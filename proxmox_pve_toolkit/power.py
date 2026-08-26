"""
Bulk VM/LXC Power State Controller for Proxmox VE.
Performs filtered batch power management (start, shutdown, restart, stop) based on tags, pools, and nodes.

MIT License
Copyright (c) 2026 Principal Infrastructure & DevOps
"""

import logging
import time
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from proxmox_pve_toolkit.pve_client import PVEClient

logger = logging.getLogger("proxmox_pve_toolkit.power")


class PowerActionReport(BaseModel):
    vmid: int
    name: str
    guest_type: str
    node: str
    action: str
    initial_status: str
    final_status: str
    success: bool
    message: str


class PowerController:
    """Orchestrates bulk power transitions with safety filters."""

    def __init__(self, client: PVEClient):
        self.client = client
        self.api = client.api

    def filter_guests(
        self,
        node: Optional[str] = None,
        tag: Optional[str] = None,
        pool: Optional[str] = None,
        status_filter: Optional[str] = None,
        guest_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Filter guests across the cluster or node by tags, pools, and status."""
        all_guests = self.client.get_all_guests(node)
        filtered = []

        for guest in all_guests:
            # Filter by guest type (qemu/lxc)
            if guest_type and guest.get("type") != guest_type:
                continue

            # Filter by status (running/stopped)
            if status_filter and guest.get("status") != status_filter:
                continue

            # Filter by tag (Proxmox stores tags as comma- or semicolon-separated string)
            if tag:
                guest_tags = guest.get("tags", "")
                tag_list = [t.strip().lower() for t in guest_tags.replace(";", ",").split(",") if t.strip()]
                if tag.lower() not in tag_list:
                    continue

            # Filter by pool ID
            if pool:
                guest_pool = guest.get("pool", "")
                if guest_pool.lower() != pool.lower():
                    continue

            filtered.append(guest)

        return filtered

    def execute_bulk_power(
        self,
        action: str,
        guests: List[Dict[str, Any]],
        timeout_seconds: int = 60,
        force_after_timeout: bool = False,
        dry_run: bool = False,
    ) -> List[PowerActionReport]:
        """
        Execute power action across a batch of guests.
        Supported actions: 'start', 'shutdown', 'stop', 'reboot'
        """
        valid_actions = {"start", "shutdown", "stop", "reboot"}
        if action not in valid_actions:
            raise ValueError(f"Invalid power action '{action}'. Must be one of {valid_actions}")

        reports: List[PowerActionReport] = []

        for guest in guests:
            vmid = int(guest["vmid"])
            name = guest.get("name", f"guest-{vmid}")
            node = guest["node"]
            gtype = guest.get("type", "qemu")
            curr_status = guest.get("status", "unknown")

            logger.info(f"Processing {action.upper()} for {gtype.upper()} {vmid} ({name}) on node {node}...")

            if dry_run:
                reports.append(
                    PowerActionReport(
                        vmid=vmid,
                        name=name,
                        guest_type=gtype,
                        node=node,
                        action=action,
                        initial_status=curr_status,
                        final_status="DRY_RUN",
                        success=True,
                        message=f"[DRY-RUN] Would execute {action} on {gtype} {vmid}",
                    )
                )
                continue

            # Skip redundant operations
            if action == "start" and curr_status == "running":
                reports.append(
                    PowerActionReport(
                        vmid=vmid,
                        name=name,
                        guest_type=gtype,
                        node=node,
                        action=action,
                        initial_status=curr_status,
                        final_status=curr_status,
                        success=True,
                        message="Guest is already running",
                    )
                )
                continue

            if action in {"shutdown", "stop"} and curr_status == "stopped":
                reports.append(
                    PowerActionReport(
                        vmid=vmid,
                        name=name,
                        guest_type=gtype,
                        node=node,
                        action=action,
                        initial_status=curr_status,
                        final_status=curr_status,
                        success=True,
                        message="Guest is already stopped",
                    )
                )
                continue

            try:
                endpoint = self.api.nodes(node).qemu(vmid).status if gtype == "qemu" else self.api.nodes(node).lxc(vmid).status

                if action == "start":
                    endpoint.start.post()
                    msg = "Start command dispatched"
                elif action == "shutdown":
                    endpoint.shutdown.post(timeout=timeout_seconds, forceStop=1 if force_after_timeout else 0)
                    msg = f"Graceful shutdown initiated (timeout: {timeout_seconds}s)"
                elif action == "reboot":
                    endpoint.reboot.post(timeout=timeout_seconds)
                    msg = "Reboot command dispatched"
                elif action == "stop":
                    endpoint.stop.post()
                    msg = "Immediate hard stop dispatched"

                reports.append(
                    PowerActionReport(
                        vmid=vmid,
                        name=name,
                        guest_type=gtype,
                        node=node,
                        action=action,
                        initial_status=curr_status,
                        final_status="command_sent",
                        success=True,
                        message=msg,
                    )
                )

            except Exception as e:
                logger.error(f"Failed to execute {action} on {vmid}: {e}")
                reports.append(
                    PowerActionReport(
                        vmid=vmid,
                        name=name,
                        guest_type=gtype,
                        node=node,
                        action=action,
                        initial_status=curr_status,
                        final_status=curr_status,
                        success=False,
                        message=f"API Error: {str(e)}",
                    )
                )

        return reports
