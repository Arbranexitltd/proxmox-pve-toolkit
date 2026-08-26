#!/usr/bin/env python3
"""
Root entrypoint alias for proxmox-pve-toolkit.
Allows direct execution: `python main.py --help`

MIT License
Copyright (c) 2026 Principal Infrastructure & DevOps
"""

import sys
from proxmox_pve_toolkit.main import app

if __name__ == "__main__":
    app()
