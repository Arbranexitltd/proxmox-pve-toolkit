import React, { useState } from "react";
import { Power, Play, RotateCcw, Square, Tag, Filter, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { GuestWorkload, ProxmoxConnectionStatus } from "../types";
import { NotConnectedBanner } from "./NotConnectedBanner";

interface PowerControllerViewProps {
  guests: GuestWorkload[];
  connectionStatus: ProxmoxConnectionStatus | null;
  onPowerAction: (node: string, type: "qemu" | "lxc", vmid: number, action: string) => Promise<void>;
  onRefresh: () => void;
  onConfigureClick: () => void;
}

export function PowerControllerView({
  guests,
  connectionStatus,
  onPowerAction,
  onRefresh,
  onConfigureClick,
}: PowerControllerViewProps) {
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  const isConnected = connectionStatus?.connected === true;

  if (!isConnected) {
    return (
      <NotConnectedBanner
        onConfigureClick={onConfigureClick}
        error={connectionStatus?.lastError}
      />
    );
  }

  // Extract all distinct tags
  const allTags = Array.from(new Set(guests.flatMap((g) => g.tags || [])));

  // Filtered list
  const filteredGuests = guests.filter((g) => {
    if (selectedTag !== "all" && !g.tags?.includes(selectedTag)) return false;
    if (selectedType !== "all" && g.type !== selectedType) return false;
    if (selectedStatus !== "all" && g.status !== selectedStatus) return false;
    return true;
  });

  const handleSinglePowerAction = async (node: string, type: "qemu" | "lxc", vmid: number, action: string) => {
    setIsProcessing(true);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);

    try {
      await onPowerAction(node, type, vmid, action);
      setActionSuccessMsg(`Dispatched '${action.toUpperCase()}' task for ${type.toUpperCase()} ${vmid} successfully.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: any) {
      setActionErrorMsg(err.message || "Failed to trigger power action");
      setTimeout(() => setActionErrorMsg(null), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkAction = async (action: "start" | "shutdown" | "reboot" | "stop") => {
    if (!confirm(`Are you sure you want to execute bulk '${action.toUpperCase()}' across ${filteredGuests.length} workload(s)?`)) {
      return;
    }

    setIsProcessing(true);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);

    let successCount = 0;
    let errorCount = 0;

    for (const g of filteredGuests) {
      try {
        await onPowerAction(g.node, g.type, g.vmid, action);
        successCount++;
      } catch (e) {
        errorCount++;
      }
    }

    setIsProcessing(false);
    if (errorCount === 0) {
      setActionSuccessMsg(`Successfully queued bulk '${action.toUpperCase()}' on all ${successCount} workloads.`);
    } else {
      setActionSuccessMsg(`Bulk '${action.toUpperCase()}' completed: ${successCount} queued, ${errorCount} failed.`);
    }
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Power Control Filter Bento Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center space-x-3 text-white font-bold text-base">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Power className="w-5 h-5" />
            </div>
            <div>
              <h2>Workload Power Controller & State Manager</h2>
              <p className="text-xs text-slate-400 font-normal mt-0.5">
                Execute atomic ACPI graceful shutdowns, instant starts, or pool-wide restarts.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-slate-400">
              MATCHING <span className="text-indigo-400 font-bold">{filteredGuests.length}</span> OF {guests.length} GUESTS
            </span>
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Refresh Workloads"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div>
            <label className="block text-slate-400 mb-1.5 font-sans font-medium flex items-center space-x-1">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              <span>Filter by Tag</span>
            </label>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1.5 font-sans font-medium">Workload Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All (VMs + Containers)</option>
              <option value="qemu">QEMU Virtual Machines</option>
              <option value="lxc">LXC Containers</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1.5 font-sans font-medium">Power Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="running">Running</option>
              <option value="stopped">Stopped</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 font-mono">
            <button
              onClick={() => handleBulkAction("start")}
              disabled={isProcessing || filteredGuests.length === 0}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition disabled:opacity-50 shadow-md shadow-emerald-600/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>BULK START</span>
            </button>

            <button
              onClick={() => handleBulkAction("shutdown")}
              disabled={isProcessing || filteredGuests.length === 0}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition disabled:opacity-50 shadow-md shadow-amber-600/20"
            >
              <Power className="w-3.5 h-3.5" />
              <span>ACPI SHUTDOWN</span>
            </button>

            <button
              onClick={() => handleBulkAction("reboot")}
              disabled={isProcessing || filteredGuests.length === 0}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition disabled:opacity-50 shadow-md shadow-indigo-600/20"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>REBOOT</span>
            </button>

            <button
              onClick={() => handleBulkAction("stop")}
              disabled={isProcessing || filteredGuests.length === 0}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition disabled:opacity-50 shadow-md shadow-rose-600/20"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>FORCE STOP</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            CLI: proxmox-pve-toolkit power --action shutdown {selectedTag !== "all" ? `--tag ${selectedTag}` : ""}
          </div>
        </div>

        {actionSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-emerald-400 text-xs font-mono flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {actionErrorMsg && (
          <div className="mt-4 p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl text-rose-400 text-xs font-mono flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{actionErrorMsg}</span>
          </div>
        )}
      </div>

      {/* Guest Workloads Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-6 py-3 font-mono">VMID</th>
                <th className="px-4 py-3">Workload Name</th>
                <th className="px-4 py-3 font-mono">Type</th>
                <th className="px-4 py-3">Node</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3 font-mono">CPU / RAM</th>
                <th className="px-4 py-3 text-right">Power Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500 font-sans">
                    No matching workloads found on the cluster.
                  </td>
                </tr>
              ) : (
                filteredGuests.map((g) => (
                  <tr key={`${g.node}-${g.type}-${g.vmid}`} className="hover:bg-slate-850 transition">
                    <td className="px-6 py-3.5 font-bold text-white">{g.vmid}</td>
                    <td className="px-4 py-3.5 font-sans text-white font-medium">{g.name}</td>
                    <td className="px-4 py-3.5 text-slate-400 uppercase">{g.type}</td>
                    <td className="px-4 py-3.5 font-sans text-slate-400">{g.node}</td>
                    <td className="px-4 py-3.5 font-sans">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          g.status === "running"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-950 text-slate-400 border border-slate-800"
                        }`}
                      >
                        {g.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-sans">
                      <div className="flex flex-wrap gap-1">
                        {g.tags && g.tags.length > 0 ? (
                          g.tags.map((t) => (
                            <span
                              key={t}
                              className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 rounded text-[10px] font-mono"
                            >
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 font-sans text-[11px]">
                      {g.cpuUsagePct}% CPU • {Math.round(g.memoryMb / 1024 * 10) / 10} GB
                    </td>
                    <td className="px-4 py-3.5 text-right font-sans">
                      <div className="inline-flex items-center space-x-1.5">
                        {g.status === "running" ? (
                          <>
                            <button
                              onClick={() => handleSinglePowerAction(g.node, g.type, g.vmid, "shutdown")}
                              disabled={isProcessing}
                              className="px-2.5 py-1 text-[11px] font-mono font-medium rounded-lg bg-amber-950/40 text-amber-300 border border-amber-800/40 hover:bg-amber-900/60 transition disabled:opacity-50"
                            >
                              SHUTDOWN
                            </button>
                            <button
                              onClick={() => handleSinglePowerAction(g.node, g.type, g.vmid, "stop")}
                              disabled={isProcessing}
                              className="px-2.5 py-1 text-[11px] font-mono font-medium rounded-lg bg-rose-950/40 text-rose-300 border border-rose-800/40 hover:bg-rose-900/60 transition disabled:opacity-50"
                            >
                              STOP
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleSinglePowerAction(g.node, g.type, g.vmid, "start")}
                            disabled={isProcessing}
                            className="px-3 py-1 text-[11px] font-mono font-medium rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/60 transition disabled:opacity-50"
                          >
                            START
                          </button>
                        )}
                      </div>
                    </td>
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
