"""
Unit tests for Proxmox Security Baseline Auditor.
"""

from unittest.mock import MagicMock
from proxmox_pve_toolkit.config import PVEConfig
from proxmox_pve_toolkit.pve_client import PVEClient
from proxmox_pve_toolkit.security import SecurityAuditor


def test_security_auditor_pass():
    config = PVEConfig(
        proxmox_host="192.168.1.100",
        proxmox_user="devops@pve",
        proxmox_token_name="scoped-token",
        proxmox_token_value="uuid-token-value-here",
        verify_ssl=True,
    )
    client = PVEClient(config)
    mock_api = MagicMock()
    
    # Cluster firewall on
    mock_api.cluster.firewall.options.get.return_value = {"enable": 1}
    # Node firewall on
    mock_api.nodes.return_value.firewall.options.get.return_value = {"enable": 1}
    # 2FA users
    mock_api.access.users.get.return_value = [{"userid": "root@pam", "totp": "key"}]
    # Certs
    mock_api.nodes.return_value.certificates.info.get.return_value = [{"issuer": "Let's Encrypt Authority X3", "notafter": "2027-01-01"}]
    # Guests
    mock_api.nodes.return_value.qemu.get.return_value = []
    mock_api.nodes.return_value.lxc.get.return_value = []

    client._api = mock_api
    client._connected = True

    auditor = SecurityAuditor(client)
    # Mock probe to prevent actual external network call in unit test
    auditor._probe_unauthenticated_endpoints = MagicMock(return_value=MagicMock(
        check_id="SEC-API-001",
        category="API Security",
        title="Unauthenticated Endpoint Access Restrictions",
        status="PASS",
        severity="CRITICAL",
        details="Tested OK",
        remediation="None",
    ))

    report = auditor.run_full_audit("pve1")

    assert report.total_checks >= 7
    assert report.failed_checks == 0
    assert report.score_percentage > 85.0
    assert "pve-firewall" in report.remediation_script
