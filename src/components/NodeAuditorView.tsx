import React from "react";
import { Activity, Cpu, HardDrive, Server, AlertTriangle, RefreshCw, Layers } from "lucide-react";
import { NodeMetrics, ProxmoxConnectionStatus } from "../types";
import { NotConnectedBanner } from "./NotConnectedBanner";

interface NodeAuditorViewProps {
  metrics: NodeMetrics | null;
  connectionStatus: ProxmoxConnectionStatus | null;
  onRefresh: () => void;
  onConfigureClick: () => void;
}

export function NodeAuditorView({
  metrics,
  connectionStatus,
  onRefresh,
  onConfigureClick,
}: NodeAuditorViewProps) {
  const isConnected = connectionStatus?.connected === true && metrics !== null;

  if (!isConnected) {
    return (
      <NotConnectedBanner
        onConfigureClick={onConfigureClick}
        error={connectionStatus?.lastError}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Node Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-tight font-mono">{metrics.node}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{metrics.status}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                OS: Proxmox VE {metrics.pveVersion} • Kernel: {metrics.kernelVersion} • Uptime: {metrics.uptimeDays}d
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="inline-flex items-center px-4 py-2 text-xs font-mono font-medium rounded-xl text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-2 text-indigo-400" />
          <span>RE-AUDIT TELEMETRY</span>
        </button>
      </div>

      {/* Bento Telemetry Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Gauge */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>CPU Load</span>
              </span>
              <span className="text-xs font-mono text-slate-500">{metrics.cpuCores} vCPUs</span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-white">{metrics.cpuUsagePct}%</span>
              <span className="text-[11px] font-mono text-slate-400">
                Load: [{metrics.loadAvg.join(", ")}]
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 mt-4 overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                metrics.cpuUsagePct > 80 ? "bg-rose-500" : metrics.cpuUsagePct > 50 ? "bg-amber-500" : "bg-indigo-500"
              }`}
              style={{ width: `${Math.min(metrics.cpuUsagePct, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Memory Gauge */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span>RAM Allocation</span>
              </span>
              <span className="text-xs font-mono text-slate-500">
                {metrics.memoryUsedGb} / {metrics.memoryTotalGb} GB
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-white">{metrics.memoryUsagePct}%</span>
              <span className="text-[11px] font-mono text-slate-400">Swap: {metrics.swapUsedGb} GB</span>
            </div>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 mt-4 overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                metrics.memoryUsagePct > 85 ? "bg-rose-500" : metrics.memoryUsagePct > 70 ? "bg-amber-500" : "bg-indigo-500"
              }`}
              style={{ width: `${Math.min(metrics.memoryUsagePct, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* I/O Wait */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>I/O Latency</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 font-semibold">NOMINAL</span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-white">{metrics.cpuIoWaitPct}%</span>
              <span className="text-[11px] font-mono text-slate-400">Rootfs: {metrics.rootfsUsagePct}%</span>
            </div>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 mt-4 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(metrics.cpuIoWaitPct * 10, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Workloads */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Active Workloads</span>
              </span>
              <span className="text-xs font-mono text-indigo-300 font-semibold">{metrics.runningGuests} Running</span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-white">{metrics.qemuCount + metrics.lxcCount}</span>
              <span className="text-[11px] font-mono text-slate-400">
                {metrics.qemuCount} VMs • {metrics.lxcCount} LXCs
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 mt-4 overflow-hidden flex border border-slate-800">
            <div
              className="bg-indigo-500 h-full"
              style={{ width: `${((metrics.qemuCount || 1) / Math.max(metrics.qemuCount + metrics.lxcCount, 1)) * 100}%` }}
            ></div>
            <div
              className="bg-indigo-400 h-full"
              style={{ width: `${((metrics.lxcCount || 0) / Math.max(metrics.qemuCount + metrics.lxcCount, 1)) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Storage Pools Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-indigo-400" />
            <span>Storage Pools (ZFS, LVM-Thin, Ceph, PBS)</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">{metrics.storagePools.length} POOLS DETECTED</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-6 py-3 font-sans">Storage ID</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Utilization</th>
                <th className="px-4 py-3">Used / Total</th>
                <th className="px-4 py-3">Available</th>
                <th className="px-4 py-3 font-sans">Content Types</th>
                <th className="px-4 py-3 text-center font-sans">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[11px]">
              {metrics.storagePools.map((pool) => (
                <tr key={pool.storage} className="hover:bg-slate-850 transition">
                  <td className="px-6 py-3.5 font-bold text-white font-sans">{pool.storage}</td>
                  <td className="px-4 py-3.5 text-slate-400 uppercase">{pool.type}</td>
                  <td className="px-4 py-3.5 w-48">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full ${
                            pool.usagePct > 85 ? "bg-rose-500" : pool.usagePct > 70 ? "bg-amber-500" : "bg-indigo-500"
                          }`}
                          style={{ width: `${pool.usagePct}%` }}
                        ></div>
                      </div>
                      <span className="text-slate-200 font-bold w-9 text-right">{pool.usagePct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-300">
                    {pool.usedGb} / {pool.totalGb} GB
                  </td>
                  <td className="px-4 py-3.5 text-emerald-400 font-semibold">{pool.availGb} GB</td>
                  <td className="px-4 py-3.5 text-slate-400 font-sans">{pool.content}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerts Bento Card */}
      {metrics.alerts.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-800/30 rounded-2xl p-5">
          <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="uppercase tracking-wider">Health & Capacity Warnings</span>
          </div>
          <ul className="space-y-1.5 text-xs text-amber-200/90 pl-5 list-disc font-mono">
            {metrics.alerts.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
