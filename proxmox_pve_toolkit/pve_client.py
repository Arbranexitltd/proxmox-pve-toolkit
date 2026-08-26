"""
Proxmox REST API Client Wrapper.
Encapsulates authentication, connection pooling, SSL handling, and error handling.

MIT License
Copyright (c) 2026 Principal Infrastructure & DevOps
"""

import logging
import urllib3
from typing import Any, Dict, List, Optional
from proxmoxer import ProxmoxAPI
from proxmoxer.core import ResourceException
import requests

from proxmox_pve_toolkit.config import PVEConfig

logger = logging.getLogger("proxmox_pve_toolkit.client")


class PVEClient:
    """Enterprise wrapper around ProxmoxAPI client."""

    def __init__(self, config: PVEConfig):
        self.config = config
        self._api: Optional[ProxmoxAPI] = None
        self._connected = False
        
        # Suppress insecure HTTPS warnings if explicitly disabled by user
        if not self.config.verify_ssl:
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    @property
    def api(self) -> ProxmoxAPI:
        """Lazy-loaded connected ProxmoxAPI instance."""
        if not self._api:
            self.connect()
        return self._api

    def connect(self) -> ProxmoxAPI:
        """Establish authenticated connection to Proxmox VE."""
        logger.debug(
            f"Connecting to Proxmox at {self.config.proxmox_host}:{self.config.proxmox_port} "
            f"as {self.config.proxmox_user}"
        )
        
        try:
            if self.config.proxmox_token_name and self.config.proxmox_token_value:
                # Token-based authentication (PVEAPIToken=USER@REALM!TOKENID=UUID)
                self._api = ProxmoxAPI(
                    self.config.proxmox_host,
                    port=self.config.proxmox_port,
                    user=self.config.proxmox_user,
                    token_name=self.config.proxmox_token_name,
                    token_value=self.config.proxmox_token_value,
                    verify_ssl=self.config.verify_ssl,
                    timeout=self.config.request_timeout,
                )
            elif self.config.proxmox_password:
                # Password-based authentication (ticket creation)
                self._api = ProxmoxAPI(
                    self.config.proxmox_host,
                    port=self.config.proxmox_port,
                    user=self.config.proxmox_user,
                    password=self.config.proxmox_password,
                    verify_ssl=self.config.verify_ssl,
                    timeout=self.config.request_timeout,
                )
            else:
                raise ValueError(
                    "Missing authentication credentials. Either provide PROXMOX_TOKEN_NAME "
                    "and PROXMOX_TOKEN_VALUE, or PROXMOX_PASSWORD."
                )

            # Test connection by querying version
            version_info = self._api.version.get()
            self._connected = True
            logger.info(
                f"Successfully connected to Proxmox VE {version_info.get('version', 'unknown')} "
                f"(release: {version_info.get('release', 'unknown')})"
            )
            return self._api

        except requests.exceptions.SSLError as e:
            logger.error(f"SSL certificate validation failed: {e}")
            raise ConnectionError(
                f"SSL verification failed connecting to {self.config.proxmox_host}. "
                "Use --insecure or set VERIFY_SSL=false if using self-signed certificates."
            ) from e
        except requests.exceptions.ConnectionError as e:
            logger.error(f"Failed to reach host: {e}")
            raise ConnectionError(
                f"Could not reach Proxmox host at {self.config.proxmox_host}:{self.config.proxmox_port}. "
                "Check network routing, DNS, or firewall rules."
            ) from e
        except ResourceException as e:
            logger.error(f"Proxmox API authorization error: {e}")
            raise PermissionError(
                f"Proxmox API rejected credentials for {self.config.proxmox_user}: {e.content}"
            ) from e
        except Exception as e:
            logger.error(f"Unexpected connection failure: {e}")
            raise

    def get_nodes(self) -> List[Dict[str, Any]]:
        """Retrieve list of all cluster nodes."""
        return self.api.nodes.get()

    def get_target_node(self, node_override: Optional[str] = None) -> str:
        """Resolve the target node name, defaulting to config or first active node."""
        if node_override:
            return node_override
        if self.config.default_node:
            return self.config.default_node
            
        nodes = self.get_nodes()
        online_nodes = [n["node"] for n in nodes if n.get("status") == "online"]
        if not online_nodes:
            raise RuntimeError("No online Proxmox nodes found in cluster.")
        return online_nodes[0]

    def get_all_guests(self, node: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieve all QEMU VMs and LXC Containers across a node or whole cluster."""
        guests = []
        target_nodes = [node] if node else [n["node"] for n in self.get_nodes() if n.get("status") == "online"]

        for n in target_nodes:
            # Query QEMU VMs
            try:
                vms = self.api.nodes(n).qemu.get()
                for vm in vms:
                    vm["type"] = "qemu"
                    vm["node"] = n
                    guests.append(vm)
            except Exception as e:
                logger.warning(f"Failed to query QEMU VMs on node {n}: {e}")

            # Query LXC Containers
            try:
                lxcs = self.api.nodes(n).lxc.get()
                for lxc in lxcs:
                    lxc["type"] = "lxc"
                    lxc["node"] = n
                    guests.append(lxc)
            except Exception as e:
                logger.warning(f"Failed to query LXC containers on node {n}: {e}")

        return guests
