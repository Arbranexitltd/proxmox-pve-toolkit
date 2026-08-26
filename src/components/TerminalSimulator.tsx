import React, { useState, useRef, useEffect } from "react";
import { Terminal as TermIcon, Play, RotateCcw, Copy, Check, Sparkles } from "lucide-react";
import { TerminalOutputLine } from "../types";

interface TerminalSimulatorProps {
  onRunCommandPreset: (cmd: string) => void;
}

export const TerminalSimulator: React.FC<TerminalSimulatorProps> = () => {
  const [commandInput, setCommandInput] = useState("python main.py node health");
  const [history, setHistory] = useState<TerminalOutputLine[]>([
    {
      id: "init-1",
      type: "panel",
      text: `Proxmox PVE Toolkit v2.4.0-stable [Ready]
Enterprise Hypervisor Management, Automation & Security Hardening CLI
Type 'python main.py --help' or click presets below.`,
    },
  ]);
  const [copied, setCopied] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const presetCommands = [
    { label: "Node Health Audit", cmd: "python main.py node health" },
    { label: "Cluster Quorum Check", cmd: "python main.py node cluster" },
    { label: "Backup Dry-Run", cmd: "python main.py backup run --dry-run" },
    { label: "VZDump Snapshot (VM 104)", cmd: "python main.py backup run --vmid 104 --mode snapshot --keep-last 3" },
    { label: "Bulk Shutdown (k8s)", cmd: "python main.py power execute shutdown --tag k8s --timeout 45 --yes" },
    { label: "Security Baseline Audit", cmd: "python main.py security audit --export-script fix_hardening.sh" },
    { label: "JSON Node Telemetry", cmd: "python main.py node health --json" },
  ];

  const handleExecute = (cmdToRun?: string) => {
    const rawCmd = (cmdToRun || commandInput).trim();
    if (!rawCmd) return;

    const newLines: TerminalOutputLine[] = [
      { id: String(Date.now()), type: "input", text: `$ ${rawCmd}` },
    ];

    if (rawCmd.includes("node health") && !rawCmd.includes("--json")) {
      newLines.push({
        id: String(Date.now() + 1),
        type: "table",
        text: `+-----------------------------------------------------------------------------------+
| Proxmox Node Telemetry: pve-node-01 (Status: ONLINE, Uptime: 14.8 days)           |
| PVE Version: 8.2.4-1 | Kernel: Linux 6.8.8-2-pve #1 SMP PREEMPT_DYNAMIC            |
| Workloads: 9 running (6 QEMU VMs, 5 LXC Containers)                               |
+-----------------------------------------------------------------------------------+
| Resource          | Utilization    | Details                                      |
+-------------------+----------------+----------------------------------------------+
| CPU Load          | 34.2% [GREEN]  | 16 vCPUs (Load Avg: [1.45, 1.32, 1.18])     |
| I/O Wait          | 2.1% [GREEN]   | Disk I/O latency nominal                     |
| RAM Memory        | 65.3% [YELLOW] | 41.8 GB / 64.0 GB Used                       |
| Swap Space        | 5.0% [GREEN]   | 0.4 GB / 8.0 GB                              |
| Root Filesystem   | 38.5% [GREEN]  | Host partition healthy                       |
+-----------------------------------------------------------------------------------+
| Storage Pool      | Type    | Usage %        | Used / Total        | Status       |
+-------------------+---------+----------------+---------------------+--------------+
| local-zfs         | zfspool | 48.9% [GREEN]  | 910 GB / 1860 GB    | ACTIVE       |
| nvme-storage      | lvmthin | 74.9% [YELLOW] | 712 GB / 950 GB     | ACTIVE       |
| pbs-backup-target | pbs     | 41.2% [GREEN]  | 1650 GB / 4000 GB   | ACTIVE       |
| local             | dir     | 38.5% [GREEN]  | 38.5 GB / 100 GB    | ACTIVE       |
+-----------------------------------------------------------------------------------+
[WARNING] Storage pool 'nvme-storage' is at 74.9% capacity.
[INFO] Node audit completed in 0.24s.`,
      });
    } else if (rawCmd.includes("node health") && rawCmd.includes("--json")) {
      newLines.push({
        id: String(Date.now() + 1),
        type: "json",
        jsonObj: {
          node: "pve-node-01",
          status: "online",
          uptime_days: 14.8,
          kernel_version: "Linux 6.8.8-2-pve #1 SMP",
          pve_version: "8.2.4-1",
          cpu_usage_pct: 34.2,
          memory_usage_pct: 65.3,
          memory_used_gb: 41.8,
          memory_total_gb: 64.0,
          storage_pools: [
            { storage: "local-zfs", type: "zfspool", usage_pct: 48.9 },
            { storage: "nvme-storage", type: "lvmthin", usage_pct: 74.9 },
          ],
        },
      });
    } else if (rawCmd.includes("node cluster")) {
      newLines.push({
        id: String(Date.now() + 1),
        type: "table",
        text: `+-----------------------------------------------------------------------+
| Cluster Status: Proxmox-Enterprise-Cluster (Quorate: YES, Nodes: 2)   |
+-----------------------------------------------------------------------+
| Node Name    | Status   | CPU %   | RAM %   | IP Address              |
+--------------+----------+---------+---------+-------------------------+
| pve-node-01  | ONLINE   | 34.2%   | 65.3%   | 192.168.10.101          |
| pve-node-02  | ONLINE   | 18.0%   | 42.1%   | 192.168.10.102          |
+--------------+----------+---------+---------+-------------------------+
Total Workloads: 12 VMs | 8 LXCs | Corosync Quorum: HEALTHY`,
      });
    } else if (rawCmd.includes("backup run") && rawCmd.includes("--dry-run")) {
      newLines.push({
        id: String(Date.now() + 1),
        type: "info",
        text: `[DRY-RUN MODE] Simulating VZDump backup tasks across all guests on pve-node-01...
- VMID 100 (k8s-control-plane-01) -> Storage: local-zfs [DRY_RUN_SUCCESS]
- VMID 101 (k8s-worker-01)        -> Storage: local-zfs [DRY_RUN_SUCCESS]
- VMID 103 (postgres-primary-ha)  -> Storage: local-zfs [DRY_RUN_SUCCESS]
- VMID 104 (redis-cache-cluster)  -> Storage: local-zfs [DRY_RUN_SUCCESS]
- LXC  200 (traefik-ingress-gw)   -> Storage: local-zfs [DRY_RUN_SUCCESS]
[SUMMARY] 5 guests evaluated. 0 bytes written to disk. Retention: keep-last=3.`,
      });
    } else if (rawCmd.includes("backup run")) {
      newLines.push({
        id: String(Date.now() + 1),
        type: "success",
        text: `Initiating vzdump snapshot for VMID 104 (redis-cache-cluster)...
[+] Task UPID: UPID:pve-node-01:0001A84F:04B8A912:66CB728A:vzdump:104:devops@pve:
[+] Mode: snapshot | Compression: zstd | Prune: keep-last=3, keep-daily=7
[+] Creating QEMU live volume snapshot... DONE
[+] Compressing archive with zstd multi-threading...
[+] Backup written to local-zfs:backup/vzdump-qemu-104-2026_08_26.vma.zst (Size: 4.82 GB)
[+] Pruning older backups according to retention policy...
[SUCCESS] Backup task finished in 18.4s with exit status OK.`,
      });
    } else if (rawCmd.includes("power execute")) {
      newLines.push({
        id: String(Date.now() + 1),
        type: "warning",
        text: `Matched 3 guests with tag 'k8s':
  - VMID 100 (k8s-control-plane-01) [running]
  - VMID 101 (k8s-worker-01)        [running]
  - VMID 102 (k8s-worker-02)        [running]

Executing graceful shutdown (timeout: 45s)...
[+] VMID 100: ACPI shutdown signal sent -> SUCCESS
[+] VMID 101: ACPI shutdown signal sent -> SUCCESS
[+] VMID 102: ACPI shutdown signal sent -> SUCCESS
All target workloads transitioned gracefully.`,
      });
    } else if (rawCmd.includes("security audit")) {
      newLines.push({
        id: String(Date.now() + 1),
        type: "table",
        text: `+------------------------------------------------------------------------------------------------+
| Proxmox VE Security Hardening Audit (Compliance Score: 75.0% - MODERATE)                       |
| Passed: 5 | Warnings: 3 | Failed: 0                                                            |
+--------------+-------------------+------------------------------------------+--------+---------+
| ID           | Category          | Check Title                              | Status | Severity|
+--------------+-------------------+------------------------------------------+--------+---------+
| SEC-FW-001   | Firewall          | Cluster-wide Firewall Active             | PASS   | HIGH    |
| SEC-FW-002   | Firewall          | Node Firewall Status (pve-node-01)       | PASS   | HIGH    |
| SEC-FW-003   | Firewall          | Guest Workload Firewall Isolation        | WARN   | MEDIUM  |
| SEC-AUTH-001 | Authentication    | Least-Privilege API Token Authentication | PASS   | HIGH    |
| SEC-AUTH-002 | Authentication    | Two-Factor Authentication (2FA/TFA)      | WARN   | HIGH    |
| SEC-API-001  | API Security      | Unauthenticated API Endpoint Restrictions| PASS   | CRITICAL|
| SEC-TLS-001  | TLS / Encryption  | ACME / Custom SSL Certificate            | WARN   | MEDIUM  |
| SEC-SYS-001  | System Updates    | Package Repository & Patching Channel    | PASS   | LOW     |
+--------------+-------------------+------------------------------------------+--------+---------+
[+] Remediation script generated: fix_hardening.sh`,
      });
    } else if (rawCmd.includes("config-check")) {
      newLines.push({
        id: String(Date.now() + 1),
        type: "success",
        text: `SUCCESS: Authenticated to Proxmox VE Cluster!
- Host: 192.168.10.101:8006
- User: devops@pve!pve-toolkit-token
- SSL Verification: false (self-signed)
- PVE Version: 8.2.4-1
- Nodes Detected: pve-node-01, pve-node-02`,
      });
    } else if (rawCmd.includes("clear")) {
      setHistory([]);
      return;
    } else {
      newLines.push({
        id: String(Date.now() + 1),
        type: "info",
        text: `Proxmox PVE Toolkit CLI (Typer 0.15 + Rich)
Available Subcommands:
  pve-tool node health [--node NAME] [--json]
  pve-tool node cluster
  pve-tool backup run [--vmid ID] [--storage POOL] [--mode MODE] [--dry-run]
  pve-tool backup snapshot <VMID> <SNAPNAME> [--include-ram]
  pve-tool power execute <ACTION> [--tag TAG] [--pool POOL] [--timeout SEC]
  pve-tool security audit [--export-script FILE] [--json]
  pve-tool config-check`,
      });
    }

    setHistory((prev) => [...prev, ...newLines]);
  };

  const copyTerminalOutput = () => {
    const raw = history.map((h) => h.text || JSON.stringify(h.jsonObj, null, 2)).join("\n");
    navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Bento Preset Command Bar */}
      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center gap-2 backdrop-blur">
        <div className="flex items-center space-x-1.5 text-xs text-indigo-400 font-mono font-medium mr-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="uppercase tracking-wider">Presets:</span>
        </div>
        {presetCommands.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCommandInput(p.cmd);
              handleExecute(p.cmd);
            }}
            className="px-2.5 py-1.5 text-xs font-mono bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-lg transition hover:border-indigo-500/50 flex items-center space-x-1"
          >
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Bento Terminal Window */}
      <div className="bg-black/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl font-mono text-xs">
        {/* Terminal Title Bar */}
        <div className="bg-slate-900/90 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
            <span className="text-slate-400 text-xs ml-2 font-sans font-medium flex items-center space-x-1.5">
              <TermIcon className="w-3.5 h-3.5 text-indigo-400 inline" />
              <span>devops@pve-node-01: ~/proxmox-pve-toolkit</span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={copyTerminalOutput}
              className="p-1 text-slate-400 hover:text-slate-200 transition"
              title="Copy Output"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setHistory([])}
              className="p-1 text-slate-400 hover:text-slate-200 transition"
              title="Clear Terminal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Terminal Output Area */}
        <div className="p-5 min-h-[420px] max-h-[540px] overflow-y-auto space-y-3 leading-relaxed">
          {history.map((line) => (
            <div key={line.id} className="break-all">
              {line.type === "input" && (
                <div className="text-emerald-400 font-semibold">{line.text}</div>
              )}
              {line.type === "panel" && (
                <div className="p-3.5 bg-slate-900/60 border border-slate-800 text-slate-300 rounded-xl whitespace-pre-wrap">
                  {line.text}
                </div>
              )}
              {line.type === "table" && (
                <div className="text-slate-200 whitespace-pre font-mono overflow-x-auto text-[11px] leading-tight">
                  {line.text}
                </div>
              )}
              {line.type === "json" && (
                <pre className="p-3.5 bg-slate-950 text-amber-300 rounded-xl border border-slate-800 overflow-x-auto">
                  {JSON.stringify(line.jsonObj, null, 2)}
                </pre>
              )}
              {line.type === "info" && <div className="text-indigo-300 whitespace-pre-wrap">{line.text}</div>}
              {line.type === "success" && (
                <div className="text-emerald-300 whitespace-pre-wrap">{line.text}</div>
              )}
              {line.type === "warning" && (
                <div className="text-amber-300 whitespace-pre-wrap">{line.text}</div>
              )}
              {line.type === "error" && <div className="text-rose-400 whitespace-pre-wrap">{line.text}</div>}
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecute();
          }}
          className="bg-slate-900/90 border-t border-slate-800 p-3 flex items-center space-x-2.5"
        >
          <span className="text-emerald-400 font-bold pl-2">$</span>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Type CLI command, e.g., python main.py node health"
            className="flex-1 bg-transparent border-none text-slate-100 placeholder-slate-500 focus:outline-none text-xs font-mono"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>RUN</span>
          </button>
        </form>
      </div>
    </div>
  );
};
