"""
Configuration Management Module for Proxmox VE Toolkit.
Handles loading from .env, environment variables, or YAML configuration files.

MIT License
Copyright (c) 2026 Principal Infrastructure & DevOps
"""

import os
from pathlib import Path
from typing import Optional
import yaml
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class PVEConfig(BaseSettings):
    """Configuration schema with strict validation and sane DevOps defaults."""
    
    # Proxmox Host Connection
    proxmox_host: str = Field(
        default="127.0.0.1",
        description="Proxmox host FQDN or IP address"
    )
    proxmox_port: int = Field(
        default=8006,
        description="Proxmox API port (default: 8006)"
    )
    verify_ssl: bool = Field(
        default=False,
        description="Verify SSL certificates (set true in production with trusted CA)"
    )
    
    # Authentication - API Token (Recommended)
    proxmox_user: str = Field(
        default="root@pam",
        description="User in username@realm format (e.g. root@pam or automation@pve)"
    )
    proxmox_token_name: Optional[str] = Field(
        default=None,
        description="API Token ID/Name (e.g. pve-toolkit-token)"
    )
    proxmox_token_value: Optional[str] = Field(
        default=None,
        description="Secret UUID token value"
    )
    
    # Fallback Authentication - Password
    proxmox_password: Optional[str] = Field(
        default=None,
        description="Password (fallback if token not provided)"
    )
    
    # Operational Defaults
    default_node: Optional[str] = Field(
        default=None,
        description="Default PVE node name to target if unspecified"
    )
    request_timeout: int = Field(
        default=30,
        description="API request timeout in seconds"
    )
    output_format: str = Field(
        default="table",
        description="Output format (table, json, yaml)"
    )
    log_level: str = Field(
        default="INFO",
        description="Logging verbosity level"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False
    )

    @field_validator("proxmox_user")
    def validate_user_realm(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("Proxmox user must include realm, e.g. root@pam or devops@pve")
        return v

    @classmethod
    def from_yaml(cls, yaml_path: str | Path) -> "PVEConfig":
        """Load configuration from a YAML file."""
        path = Path(yaml_path)
        if not path.exists():
            raise FileNotFoundError(f"Configuration file not found: {path}")
        
        with open(path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
            
        # Convert nested or hyphenated keys to underscored
        clean_data = {k.replace("-", "_").lower(): v for k, v in data.items()}
        return cls(**clean_data)


def load_config(config_path: Optional[str] = None) -> PVEConfig:
    """
    Unified configuration resolver:
    1. Explicit YAML file if passed
    2. config.yaml if present in cwd
    3. .env file / environment variables
    """
    if config_path and Path(config_path).exists():
        return PVEConfig.from_yaml(config_path)
    
    default_yaml = Path("config.yaml")
    if default_yaml.exists():
        return PVEConfig.from_yaml(default_yaml)
        
    return PVEConfig()
