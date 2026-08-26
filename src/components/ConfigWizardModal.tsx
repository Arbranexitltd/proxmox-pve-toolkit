import React, { useState } from "react";
import { Key, Copy, Check, Terminal, ExternalLink, Shield } from "lucide-react";

interface ConfigWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfigWizardModal: React.FC<ConfigWizardModalProps> = ({ isOpen, onClose }) => {
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const bashSetupCommands = `# 1. Create custom least-privilege role
pveum role add PVEToolkitRole -privs "VM.Audit VM.Backup VM.PowerMgmt Sys.Audit Datacenter.Audit"

# 2. Create dedicated automation user
pveum user add devops@pve --comment "DevOps Automation Service Account"

# 3. Grant role at cluster root
pveum acl modify / -user devops@pve -role PVEToolkitRole

# 4. Generate API Token
pveum user token add devops@pve pve-toolkit-token --privsep 0`;

  const copySetup = () => {
    navigator.clipboard.writeText(bashSetupCommands);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2 text-white font-bold text-sm">
            <Key className="w-4 h-4 text-indigo-400" />
            <span>Proxmox Least-Privilege API Token Setup</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs font-mono">
          <p className="text-slate-300 font-sans leading-relaxed text-xs">
            Execute these 4 commands on your Proxmox VE host CLI to create a dedicated service account and
            API token without sharing your master <code className="text-indigo-400 font-bold font-mono">root@pam</code> password.
          </p>

          <div className="relative">
            <pre className="bg-black text-emerald-400 font-mono text-xs p-4 rounded-xl overflow-x-auto border border-slate-800">
              {bashSetupCommands}
            </pre>
            <button
              onClick={copySetup}
              className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center space-x-1 transition text-xs"
            >
              {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCmd ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <span className="font-semibold text-slate-200 font-sans">Required .env Configuration:</span>
            <pre className="text-indigo-300 font-mono text-[11px] leading-relaxed">
{`PROXMOX_HOST=pve1.lab.internal
PROXMOX_PORT=8006
PROXMOX_USER=devops@pve
PROXMOX_TOKEN_NAME=pve-toolkit-token
PROXMOX_TOKEN_VALUE=<UUID-TOKEN-COPIED-FROM-OUTPUT>
VERIFY_SSL=false`}
            </pre>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold font-mono rounded-xl transition shadow-md shadow-indigo-900/30"
            >
              DONE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
