"""
Unit tests for Proxmox Node & Health Auditor.
"""

from unittest.mock import MagicMock
import pytest
from proxmox_pve_toolkit.config import PVEConfig
from proxmox_pve_toolkit.pve_client import PVEClient
from proxmox_pve_toolkit.auditor import NodeAuditor


@pytest.fixture
def mock_pve_client():
    config = PVEConfig(
        proxmox_host="192.168.1.100",
        proxmox_user="devops@pve",
        proxmox_token_name="test-token",
        proxmox_token_value="12345678-1234-1234-1234-123456789abc",
        verify_ssl=False,
    )
    client = PVEClient(config)
    
    mock_api = MagicMock()
    # Mock node status
    mock_api.nodes.return_value.status.get.return_value = {
        "kversion": "Linux 6.8.4-2-pve #1 SMP PREEMPT_DYNAMIC",
        "uptime": 172800,  # 2 days
        "cpu": 0.25,
        "wait": 0.02,
        "cpuinfo": {"cpus": 16},
        "loadavg": ["1.20", "0.95", "0.80"],
        "memory": {"total": 68719476736, "used": 34359738368},  # 64GB / 32GB
        "swap": {"total": 8589934592, "used": 0},
        "rootfs": {"total": 107374182400, "used": 21474836480},
    }
    
    # Mock version
    mock_api.version.get.return_value = {"version": "8.2", "release": "1"}
    
    # Mock storage
    mock_api.nodes.return_value.storage.get.return_value = [
        {
            "storage": "local-zfs",
            "type": "zfspool",
            "total": 1000000000000,
            "used": 400000000000,
            "avail": 600000000000,
            "active": 1,
            "enabled": 1,
            "content": "images,rootdir",
        }
    ]
    
    # Mock guest counts
    mock_api.nodes.return_value.qemu.get.return_value = [{"vmid": 100, "status": "running"}, {"vmid": 101, "status": "stopped"}]
    mock_api.nodes.return_value.lxc.get.return_value = [{"vmid": 200, "status": "running"}]
    
    client._api = mock_api
    client._connected = True
    return client


def test_node_auditor(mock_pve_client):
    auditor = NodeAuditor(mock_pve_client)
    report = auditor.audit_node("pve1")

    assert report.node == "pve1"
    assert report.status == "online"
    assert report.cpu_cores == 16
    assert report.cpu_usage_pct == 25.0
    assert report.memory_usage_pct == 50.0
    assert report.qemu_count == 2
    assert report.lxc_count == 1
    assert report.running_guests == 2
    assert len(report.storage_pools) == 1
    assert report.storage_pools[0].storage == "local-zfs"
    assert len(report.alerts) == 0
