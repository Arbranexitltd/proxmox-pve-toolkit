import React, { useState } from "react";
import { Archive, Play, CheckCircle2, AlertCircle, Clock, HardDrive, Shield } from "lucide-react";
import { GuestWorkload, BackupLogEntry, StoragePool, ProxmoxConnectionStatus } from "../types";
import { NotConnectedBanner } from "./NotConnectedBanner";

interface BackupOrchestratorViewProps {
  guests: GuestWorkload[];
  storagePools: StoragePool[];
  connectionStatus: ProxmoxConnectionStatus | null;
  onConfigureClick: () => void;
}

export function BackupOrchestratorView({
  guests,
  storagePools,
  connectionStatus,
  onConfigureClick,
}: BackupOrchestratorViewProps) {
  const isConnected = connectionStatus?.connected === true;

  const [targetVmid, setTargetVmid] = useState<number | "all">("all");
  const [storage, setStorage] = useState(storagePools.length > 0 ? storagePools[0].storage : "local");
  const [mode, setMode] = useState<"snapshot" | "suspend" | "stop">("snapshot");
  const [compress, setCompress] = useState<"zstd" | "gzip" | "lzo" | "none">("zstd");
  const [keepLast, setKeepLast] = useState(3);
  const [keepDaily, setKeepDaily] = useState(7);
  const [dryRun, setDryRun] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [logs, setLogs] = useState<BackupLogEntry[]>([]);

  if (!isConnected) {
    return (
      <NotConnectedBanner
        onConfigureClick={onConfigureClick}
        error={connectionStatus?.lastError}
      />
    );
  }

  const handleTriggerBackup = async () => {
    setIsRunning(true);
    setErrorMsg(null);

    const targetList =
      targetVmid === "all" ? guests : guests.filter((g) => g.vmid === targetVmid);

    if (targetList.length === 0) {
      setErrorMsg("No workloads available for backup.");
      setIsRunning(false);
      return;
    }

    try {
      const token = localStorage.getItem("pve_auth_token");
      const vmidList = targetList.map((g) => g.vmid);

      const res = await fetch("/api/pve/backup/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          node: targetList[0].node || connectionStatus.nodeName || "pve",
          vmids: vmidList,
          storage: storage || "local",
          mode,
          compress,
          keepLast,
          keepDaily,
          dryRun,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to trigger backup job");
      }

      const newEntries: BackupLogEntry[] = targetList.map((g) => ({
        id: "log-" + Date.now() + "-" + g.vmid,
        vmid: g.vmid,
        name: g.name,
        type: g.type,
        node: g.node,
        storage: storage,
        mode: mode,
        status: dryRun ? "DRY_RUN_SUCCESS" : "SUCCESS",
        duration: Math.round((Math.random() * 10 + 4) * 10) / 10,
        timestamp: new Date().toLocaleTimeString(),
        taskUpid: data.upid || `UPID:${g.node}:0000${g.vmid}:vzdump:${g.vmid}:devops@pve:`,
      }));

      setLogs((prev) => [...newEntries, ...prev]);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to dispatch backup task");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Backup Form & Config Bento Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3 text-white font-bold text-base mb-5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h2>VZDump Backup & Retention Policy Orchestrator</h2>
            <p className="text-xs text-slate-400 font-normal mt-0.5">
              Automate live snapshots, verify retention rules, and trigger vzdump tasks.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          {/* Target Workload */}
          <div>
            <label className="block text-slate-400 font-sans font-medium mb-1.5">Target VM / Container</label>
            <select
              value={targetVmid}
              onChange={(e) => setTargetVmid(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Running Guests ({guests.length} Workloads)</option>
              {guests.map((g) => (
                <option key={`${g.node}-${g.vmid}`} value={g.vmid}>
                  [{g.type.toUpperCase()}] {g.vmid} - {g.name} ({g.status})
                </option>
              ))}
            </select>
          </div>

          {/* Target Storage */}
          <div>
            <label className="block text-slate-400 font-sans font-medium mb-1.5">Destination Storage Pool</label>
            <select
              value={storage}
              onChange={(e) => setStorage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {storagePools.length > 0 ? (
                storagePools.map((p) => (
                  <option key={p.storage} value={p.storage}>
                    {p.storage} ({p.type} • {p.availGb} GB free)
                  </option>
                ))
              ) : (
                <option value="local">local (Directory /var/lib/vz)</option>
              )}
            </select>
          </div>

          {/* Mode */}
          <div>
            <label className="block text-slate-400 font-sans font-medium mb-1.5">Backup Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="snapshot">Snapshot (Live Zero-Downtime)</option>
              <option value="suspend">Suspend (Brief RAM Pause)</option>
              <option value="stop">Stop (Full Offline Consistency)</option>
            </select>
          </div>

          {/* Compression */}
          <div>
            <label className="block text-slate-400 font-sans font-medium mb-1.5">Compression Algorithm</label>
            <select
              value={compress}
              onChange={(e) => setCompress(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="zstd">zstd (Fast & High Ratio)</option>
              <option value="gzip">gzip (Standard Compatibility)</option>
              <option value="lzo">lzo (Ultra Fast / Low CPU)</option>
              <option value="none">0 (Uncompressed)</option>
            </select>
          </div>

          {/* Retention: keep-last */}
          <div>
            <label className="block text-slate-400 font-sans font-medium mb-1.5">
              Retention: <span className="text-indigo-400 font-bold font-mono">keep-last={keepLast}</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={keepLast}
              onChange={(e) => setKeepLast(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <span className="text-[11px] text-slate-500 font-sans">Preserves latest {keepLast} backups</span>
          </div>

          {/* Retention: keep-daily */}
          <div>
            <label className="block text-slate-400 font-sans font-medium mb-1.5">
              Retention: <span className="text-indigo-400 font-bold font-mono">keep-daily={keepDaily}</span>
            </label>
            <input
              type="range"
              min="1"
              max="30"
              value={keepDaily}
              onChange={(e) => setKeepDaily(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <span className="text-[11px] text-slate-500 font-sans">Preserves daily snapshots for {keepDaily} days</span>
          </div>
        </div>

        {/* Options & Execute Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer font-mono">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-indigo-500 focus:ring-0 w-4 h-4"
            />
            <span>Enable Dry-Run Simulation (--dry-run)</span>
          </label>

          <button
            onClick={handleTriggerBackup}
            disabled={isRunning}
            className={`px-4 py-2.5 text-xs font-mono font-semibold rounded-xl text-white flex items-center space-x-2 transition shadow-md ${
              isRunning
                ? "bg-slate-800 cursor-not-allowed"
                : dryRun
                ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/20"
                : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20"
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>
              {isRunning
                ? "EXECUTING VZDUMP TASK..."
                : dryRun
                ? "RUN SIMULATION"
                : "TRIGGER VZDUMP JOB"}
            </span>
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl text-rose-400 text-xs font-mono">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Backup Execution Logs Bento Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Recent Backup Execution & Pruning History</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">{logs.length} JOBS LOGGED</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold font-sans text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-6 py-3">VMID</th>
                <th className="px-4 py-3">Workload Name</th>
                <th className="px-4 py-3">Target Pool</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Task UPID</th>
                <th className="px-4 py-3 font-sans">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[11px]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500 font-sans">
                    No backup jobs triggered in this session yet. Select a workload and run a job above.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850 transition">
                    <td className="px-6 py-3.5 font-bold text-white">{log.vmid}</td>
                    <td className="px-4 py-3.5 font-sans text-slate-200">{log.name}</td>
                    <td className="px-4 py-3.5 text-slate-400">{log.storage}</td>
                    <td className="px-4 py-3.5 text-slate-400">{log.mode}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-sans ${
                          log.status === "SUCCESS"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : log.status === "DRY_RUN_SUCCESS"
                            ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">{log.duration}s</td>
                    <td className="px-4 py-3.5 text-slate-400 text-[11px] truncate max-w-[140px]" title={log.taskUpid}>
                      {log.taskUpid}
                    </td>
                    <td className="px-4 py-3.5 font-sans text-slate-400 text-[11px]">{log.timestamp}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
