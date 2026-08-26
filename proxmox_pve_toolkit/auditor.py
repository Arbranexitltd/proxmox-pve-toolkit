"""
Node Health & Metric Auditor for Proxmox VE.
Collects node performance metrics, storage pool utilization, kernel info, and cluster health.

MIT License
Copyright (c) 2026 Principal Infrastructure & DevOps
"""

import logging
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from proxmox_pve_toolkit.pve_client import PVEClient

logger = logging.getLogger("proxmox_pve_toolkit.auditor")


class StoragePoolMetrics(BaseModel):
    storage: str
    type: str
    total_gb: float
    used_gb: float
    avail_gb: float
    usage_pct: float
    active: bool
    enabled: bool
    content: str


class NodeHealthReport(BaseModel):
    node: str
    status: str
    uptime_days: float
    kernel_version: str
    pve_version: str
    cpu_cores: int
    cpu_usage_pct: float
    cpu_iowait_pct: float
    load_avg: List[float]
    memory_total_gb: float
    memory_used_gb: float
    memory_usage_pct: float
    swap_total_gb: float
    swap_used_gb: float
    rootfs_usage_pct: float
    storage_pools: List[StoragePoolMetrics]
    qemu_count: int
    lxc_count: int
    running_guests: int
    alerts: List[str] = Field(default_factory=list)


class ClusterHealthReport(BaseModel):
    cluster_name: str
    is_clustered: bool
    quorate: bool
    total_nodes: int
    online_nodes: int
    offline_nodes: int
    nodes_summary: List[Dict[str, Any]]
    total_vms: int
    total_lxcs: int
    warnings: List[str] = Field(default_factory=list)


class NodeAuditor:
    """Audits health and performance metrics for Proxmox nodes and clusters."""

    def __init__(self, client: PVEClient):
        self.client = client
        self.api = client.api

    def audit_node(self, node_name: Optional[str] = None) -> NodeHealthReport:
        """Collect deep telemetry from a specific PVE node."""
        target_node = self.client.get_target_node(node_name)
        logger.debug(f"Starting audit for node: {target_node}")

        # Fetch Node Status & Metrics
        status = self.api.nodes(target_node).status.get()
        pve_ver = self.api.version.get()

        # Parse Kernel & System Info
        kernel_ver = status.get("kversion", "unknown")
        uptime_seconds = status.get("uptime", 0)
        uptime_days = round(uptime_seconds / 86400, 2)

        # CPU Metrics
        cpu_usage_pct = round(status.get("cpu", 0) * 100, 2)
        cpu_info = status.get("cpuinfo", {})
        cpu_cores = cpu_info.get("cpus", 1)
        load_avg = [float(x) for x in status.get("loadavg", [0.0, 0.0, 0.0])]

        # I/O Wait detection (from status or rrddata)
        cpu_iowait = round(status.get("wait", 0) * 100, 2)

        # Memory Metrics
        mem_info = status.get("memory", {})
        mem_total_gb = round(mem_info.get("total", 0) / (1024**3), 2)
        mem_used_gb = round(mem_info.get("used", 0) / (1024**3), 2)
        mem_pct = round((mem_used_gb / mem_total_gb * 100) if mem_total_gb > 0 else 0, 2)

        # Swap Metrics
        swap_info = status.get("swap", {})
        swap_total_gb = round(swap_info.get("total", 0) / (1024**3), 2)
        swap_used_gb = round(swap_info.get("used", 0) / (1024**3), 2)

        # Rootfs Metrics
        rootfs = status.get("rootfs", {})
        rootfs_total = rootfs.get("total", 1)
        rootfs_used = rootfs.get("used", 0)
        rootfs_pct = round((rootfs_used / rootfs_total) * 100, 2)

        # Audit Storage Pools on Node
        storage_pools: List[StoragePoolMetrics] = []
        try:
            raw_storage = self.api.nodes(target_node).storage.get()
            for s in raw_storage:
                tot_gb = round(s.get("total", 0) / (1024**3), 2)
                used_gb = round(s.get("used", 0) / (1024**3), 2)
                avail_gb = round(s.get("avail", 0) / (1024**3), 2)
                pct = round((used_gb / tot_gb * 100) if tot_gb > 0 else 0, 2)

                pool = StoragePoolMetrics(
                    storage=s.get("storage", "unknown"),
                    type=s.get("type", "unknown"),
                    total_gb=tot_gb,
                    used_gb=used_gb,
                    avail_gb=avail_gb,
                    usage_pct=pct,
                    active=bool(s.get("active", 1)),
                    enabled=bool(s.get("enabled", 1)),
                    content=s.get("content", ""),
                )
                storage_pools.append(pool)
        except Exception as e:
            logger.warning(f"Could not read storage metrics on {target_node}: {e}")

        # Count Guests
        vms = self.api.nodes(target_node).qemu.get()
        lxcs = self.api.nodes(target_node).lxc.get()
        running_vms = sum(1 for v in vms if v.get("status") == "running")
        running_lxcs = sum(1 for l in lxcs if l.get("status") == "running")

        # Evaluate Health Alerts
        alerts: List[str] = []
        if mem_pct >= 90.0:
            alerts.append(f"CRITICAL: Memory utilization at {mem_pct}% (>{mem_used_gb}GB / {mem_total_gb}GB)")
        elif mem_pct >= 80.0:
            alerts.append(f"WARNING: High memory utilization at {mem_pct}%")

        if cpu_usage_pct >= 85.0:
            alerts.append(f"WARNING: High CPU load at {cpu_usage_pct}%")
        if cpu_iowait >= 15.0:
            alerts.append(f"CRITICAL: High I/O Wait detected at {cpu_iowait}%, storage bottleneck likely!")
        if rootfs_pct >= 85.0:
            alerts.append(f"CRITICAL: Root filesystem almost full at {rootfs_pct}%")

        for p in storage_pools:
            if p.usage_pct >= 90.0 and p.active:
                alerts.append(f"CRITICAL: Storage pool '{p.storage}' is {p.usage_pct}% full")
            elif p.usage_pct >= 80.0 and p.active:
                alerts.append(f"WARNING: Storage pool '{p.storage}' capacity is high ({p.usage_pct}%)")

        return NodeHealthReport(
            node=target_node,
            status="online",
            uptime_days=uptime_days,
            kernel_version=kernel_ver,
            pve_version=f"{pve_ver.get('version', '')}-{pve_ver.get('release', '')}",
            cpu_cores=cpu_cores,
            cpu_usage_pct=cpu_usage_pct,
            cpu_iowait_pct=cpu_iowait,
            load_avg=load_avg,
            memory_total_gb=mem_total_gb,
            memory_used_gb=mem_used_gb,
            memory_usage_pct=mem_pct,
            swap_total_gb=swap_total_gb,
            swap_used_gb=swap_used_gb,
            rootfs_usage_pct=rootfs_pct,
            storage_pools=storage_pools,
            qemu_count=len(vms),
            lxc_count=len(lxcs),
            running_guests=running_vms + running_lxcs,
            alerts=alerts,
        )

    def audit_cluster(self) -> ClusterHealthReport:
        """Audit overall cluster health, quorum status, and node availability."""
        raw_nodes = self.client.get_nodes()
        online_nodes = [n for n in raw_nodes if n.get("status") == "online"]
        offline_nodes = [n for n in raw_nodes if n.get("status") != "online"]

        # Check Corosync cluster status if available
        cluster_name = "Standalone"
        is_clustered = False
        quorate = True
        warnings = []

        try:
            cluster_status = self.api.cluster.status.get()
            for item in cluster_status:
                if item.get("type") == "cluster":
                    cluster_name = item.get("name", "Cluster")
                    is_clustered = True
                    quorate = bool(item.get("quorate", 1))
        except Exception:
            # Standalone node (not configured in Corosync cluster)
            pass

        if not quorate:
            warnings.append("CRITICAL: Cluster has lost Quorum! Corosync communication failure or split-brain.")

        if offline_nodes:
            offline_names = ", ".join(n.get("node", "unknown") for n in offline_nodes)
            warnings.append(f"WARNING: Nodes offline: {offline_names}")

        all_guests = self.client.get_all_guests()
        vms = [g for g in all_guests if g.get("type") == "qemu"]
        lxcs = [g for g in all_guests if g.get("type") == "lxc"]

        return ClusterHealthReport(
            cluster_name=cluster_name,
            is_clustered=is_clustered,
            quorate=quorate,
            total_nodes=len(raw_nodes),
            online_nodes=len(online_nodes),
            offline_nodes=len(offline_nodes),
            nodes_summary=raw_nodes,
            total_vms=len(vms),
            total_lxcs=len(lxcs),
            warnings=warnings,
        )
