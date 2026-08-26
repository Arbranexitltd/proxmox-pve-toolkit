"""
Automated LXC/VM Backup Orchestrator for Proxmox VE.
Handles vzdump backups, live snapshots, retention pruning (keep-last, keep-daily), and task monitoring.

MIT License
Copyright (c) 2026 Principal Infrastructure & DevOps
"""

import json
import logging
import time
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from proxmox_pve_toolkit.pve_client import PVEClient

logger = logging.getLogger("proxmox_pve_toolkit.backup")


class BackupJobConfig(BaseModel):
    vmid: Optional[int] = None
    all_guests: bool = False
    node: Optional[str] = None
    storage: str = "local"
    mode: str = Field(default="snapshot", description="snapshot, suspend, or stop")
    compress: str = Field(default="zstd", description="zstd, gzip, lzo, or 0")
    mailnotification: str = "failure"
    keep_last: Optional[int] = Field(default=3, description="Retention: keep last N backups")
    keep_daily: Optional[int] = Field(default=7, description="Retention: keep N daily backups")
    keep_weekly: Optional[int] = Field(default=4, description="Retention: keep N weekly backups")
    dry_run: bool = False


class BackupResult(BaseModel):
    vmid: int
    guest_name: str
    guest_type: str
    node: str
    storage: str
    mode: str
    status: str
    task_upid: Optional[str] = None
    start_time: str
    end_time: Optional[str] = None
    duration_seconds: float = 0.0
    size_mb: Optional[float] = None
    error_message: Optional[str] = None


class BackupOrchestrator:
    """Orchestrates vzdump backups and snapshot lifecycle management."""

    def __init__(self, client: PVEClient):
        self.client = client
        self.api = client.api

    def run_vzdump(self, job: BackupJobConfig) -> List[BackupResult]:
        """Execute or simulate a vzdump backup job across targeted guests."""
        results: List[BackupResult] = []
        target_node = self.client.get_target_node(job.node)
        
        # Determine target guests
        guests = self.client.get_all_guests(target_node)
        if job.vmid:
            guests = [g for g in guests if int(g.get("vmid", 0)) == int(job.vmid)]
            if not guests:
                raise ValueError(f"Guest with VMID {job.vmid} not found on node {target_node}")

        logger.info(f"Targeting {len(guests)} guest(s) for backup on node {target_node}")

        for guest in guests:
            vmid = int(guest["vmid"])
            name = guest.get("name", f"guest-{vmid}")
            gtype = guest.get("type", "qemu")
            start_ts = datetime.utcnow().isoformat()
            t0 = time.time()

            logger.info(f"Initiating backup for {gtype.upper()} {vmid} ({name}) in mode '{job.mode}'...")

            if job.dry_run:
                logger.info(f"[DRY-RUN] Would backup VMID {vmid} to storage '{job.storage}' with mode={job.mode}")
                results.append(
                    BackupResult(
                        vmid=vmid,
                        guest_name=name,
                        guest_type=gtype,
                        node=target_node,
                        storage=job.storage,
                        mode=job.mode,
                        status="DRY_RUN_SUCCESS",
                        task_upid="UPID:dryrun:00000000:00000000:00000000:vzdump:0:root@pam:",
                        start_time=start_ts,
                        end_time=datetime.utcnow().isoformat(),
                        duration_seconds=0.1,
                    )
                )
                continue

            try:
                # Prepare vzdump API parameters
                payload = {
                    "vmid": vmid,
                    "storage": job.storage,
                    "mode": job.mode,
                    "compress": job.compress,
                    "mailnotification": job.mailnotification,
                }
                
                # Apply retention policy parameters if supported by backend
                if job.keep_last:
                    payload["prune-backups"] = f"keep-last={job.keep_last}"
                    if job.keep_daily:
                        payload["prune-backups"] += f",keep-daily={job.keep_daily}"

                # Trigger vzdump via node API
                task_upid = self.api.nodes(target_node).vzdump.post(**payload)
                logger.info(f"Backup task spawned with UPID: {task_upid}")

                # Monitor task completion
                task_status = self._wait_for_task(target_node, task_upid)
                duration = round(time.time() - t0, 2)
                end_ts = datetime.utcnow().isoformat()

                if task_status.get("exitstatus") == "OK":
                    logger.info(f"Backup succeeded for VMID {vmid} in {duration}s")
                    results.append(
                        BackupResult(
                            vmid=vmid,
                            guest_name=name,
                            guest_type=gtype,
                            node=target_node,
                            storage=job.storage,
                            mode=job.mode,
                            status="SUCCESS",
                            task_upid=task_upid,
                            start_time=start_ts,
                            end_time=end_ts,
                            duration_seconds=duration,
                        )
                    )
                else:
                    err_msg = task_status.get("exitstatus", "Unknown task failure")
                    logger.error(f"Backup failed for VMID {vmid}: {err_msg}")
                    results.append(
                        BackupResult(
                            vmid=vmid,
                            guest_name=name,
                            guest_type=gtype,
                            node=target_node,
                            storage=job.storage,
                            mode=job.mode,
                            status="FAILED",
                            task_upid=task_upid,
                            start_time=start_ts,
                            end_time=end_ts,
                            duration_seconds=duration,
                            error_message=err_msg,
                        )
                    )

            except Exception as e:
                duration = round(time.time() - t0, 2)
                logger.error(f"Exception during backup of VMID {vmid}: {e}")
                results.append(
                    BackupResult(
                        vmid=vmid,
                        guest_name=name,
                        guest_type=gtype,
                        node=target_node,
                        storage=job.storage,
                        mode=job.mode,
                        status="ERROR",
                        start_time=start_ts,
                        duration_seconds=duration,
                        error_message=str(e),
                    )
                )

        return results

    def create_snapshot(self, vmid: int, snap_name: str, description: str = "", vmstate: bool = False, node: Optional[str] = None) -> Dict[str, Any]:
        """Create a live snapshot of a VM or Container."""
        target_node = self.client.get_target_node(node)
        guests = self.client.get_all_guests(target_node)
        guest = next((g for g in guests if int(g.get("vmid", 0)) == int(vmid)), None)
        
        if not guest:
            raise ValueError(f"Guest {vmid} not found on node {target_node}")

        gtype = guest.get("type", "qemu")
        logger.info(f"Creating snapshot '{snap_name}' for {gtype.upper()} {vmid}...")

        if gtype == "qemu":
            task = self.api.nodes(target_node).qemu(vmid).snapshot.post(
                snapname=snap_name,
                description=description,
                vmstate=1 if vmstate else 0
            )
        else:
            task = self.api.nodes(target_node).lxc(vmid).snapshot.post(
                snapname=snap_name,
                description=description
            )

        return {"status": "initiated", "task_upid": task, "snapname": snap_name, "vmid": vmid}

    def _wait_for_task(self, node: str, upid: str, timeout: int = 1800, poll_interval: int = 3) -> Dict[str, Any]:
        """Poll Proxmox task endpoint until task finishes or times out."""
        start_time = time.time()
        while time.time() - start_time < timeout:
            status = self.api.nodes(node).tasks(upid).status.get()
            if status.get("status") == "stopped":
                return status
            time.sleep(poll_interval)
        return {"status": "stopped", "exitstatus": "TIMEOUT: Task exceeded max execution limit"}

    def export_report(self, results: List[BackupResult], output_path: str):
        """Export backup execution summary to a JSON file."""
        data = [r.model_dump() for r in results]
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        logger.info(f"Backup report exported to {output_path}")
