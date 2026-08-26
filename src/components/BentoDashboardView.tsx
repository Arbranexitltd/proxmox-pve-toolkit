import React, { useState } from "react";
import {
  Activity,
  ShieldCheck,
  Power,
  Archive,
  Terminal,
  Cpu,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Server,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Globe,
} from "lucide-react";
import { NodeMetrics, GuestWorkload, SecurityCheck, TabType, ProxmoxConnectionStatus } from "../types";
import { NotConnectedBanner } from "./NotConnectedBanner";

interface BentoDashboardViewProps {
  metrics: NodeMetrics | null;
  guests: GuestWorkload[];
  securityChecks: SecurityCheck[];
  connectionStatus: ProxmoxConnectionStatus | null;
  onNavigateTab: (tab: TabType) => void;
  onRefreshMetrics: () => void;
  onPowerAction: (node: string, type: "qemu" | "lxc", vmid: number, action: string) => void;
}

export function BentoDashboardView({
  metrics,
  guests,
  securityChecks,
  connectionStatus,
  onNavigateTab,
  onRefreshMetrics,
  onPowerAction,
}: BentoDashboardViewProps) {
  const isConnected = connectionStatus?.connected === true;

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <NotConnectedBanner
          onConfigureClick={() => onNavigateTab("cluster")}
          error={connectionStatus?.lastError}
        />
      </div>
    );
  }

  const runningVms = guests.filter((g) => g.type === "qemu" && g.status === "running").length;
  const runningLxcs = guests.filter((g) => g.type === "lxc" && g.status === "running").length;
  const passedSecurity = securityChecks.filter((c) => c.status === "PASS").length;
  const warnSecurity = securityChecks.filter((c) => c.status === "WARN").length;
  const failSecurity = securityChecks.filter((c) => c.status === "FAIL").length;
  const securityScore = securityChecks.length
    ? Math.round(((passedSecurity * 1.0 + warnSecurity * 0.5) / securityChecks.length) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Bento Grid Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 lg:grid-rows-3 gap-4">
        {/* Cell 1: Node Health & Real-time Metrics (Col 1-2, Row 1-2) */}
        <section className="lg:col-span-2 lg:row-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl hover:border-slate-700 transition">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
                <h2 className="text-base font-semibold text-white tracking-tight">
                  Node Telemetry: {metrics?.node || connectionStatus?.nodeName || "Proxmox Host"}
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono text-emerald-400 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>LIVE HYPERVISOR</span>
                </span>
                <button
                  onClick={onRefreshMetrics}
                  className="p-1 text-slate-400 hover:text-indigo-400 transition"
                  title="Refresh Metrics"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Metrics Dual Column */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Gauges */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">CPU SATURATION</span>
                    <span className="text-white font-semibold">{metrics?.cpuUsagePct ?? 0}%</span>
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(metrics?.cpuUsagePct ?? 0, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">RAM ALLOCATION</span>
                    <span className="text-white font-semibold">
                      {metrics?.memoryUsedGb ?? 0} GB / {metrics?.memoryTotalGb ?? 0} GB
                    </span>
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(metrics?.memoryUsagePct ?? 0, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">I/O WAIT PRESSURE</span>
                    <span className="text-emerald-400 font-semibold">{metrics?.cpuIoWaitPct ?? 0}%</span>
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((metrics?.cpuIoWaitPct ?? 0) * 10, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Hypervisor Node Info Box */}
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-[11px] leading-relaxed flex flex-col justify-between">
                <div>
                  <div className="text-indigo-400 font-semibold mb-2 flex items-center space-x-1.5">
                    <Server className="w-3.5 h-3.5" />
                    <span>Host Connection:</span>
                  </div>
                  <div className="text-slate-300 space-y-1">
                    <div>
                      Endpoint: <span className="text-white">{connectionStatus?.host}:{connectionStatus?.port}</span>
                    </div>
                    <div>
                      Release: <span className="text-white">PVE {metrics?.pveVersion || "7.x/8.x"}</span>
                    </div>
                    <div className="truncate">
                      Kernel: <span className="text-white">{metrics?.kernelVersion || "Linux Kernel"}</span>
                    </div>
                    <div>
                      Uptime: <span className="text-white">{metrics?.uptimeDays ? `${metrics.uptimeDays} days` : "Active"}</span>
                    </div>
                    <div className="text-emerald-400">Status: Online (REST Authenticated)</div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateTab("node")}
                  className="mt-3 inline-flex items-center text-[10px] text-indigo-400 hover:text-indigo-300 transition uppercase font-semibold tracking-wider self-start"
                >
                  <span>Detailed Storage & Telemetry</span>
                  <ChevronRight className="w-3 h-3 ml-1" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bento Metric Counters */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div
              onClick={() => onNavigateTab("power")}
              className="bg-slate-950 hover:bg-slate-850 p-3 rounded-xl border border-slate-800 text-center cursor-pointer transition"
            >
              <div className="text-2xl font-bold font-mono text-indigo-300">{runningVms}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                Active VMs
              </div>
            </div>

            <div
              onClick={() => onNavigateTab("power")}
              className="bg-slate-950 hover:bg-slate-850 p-3 rounded-xl border border-slate-800 text-center cursor-pointer transition"
            >
              <div className="text-2xl font-bold font-mono text-indigo-300">{runningLxcs}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                Active LXC
              </div>
            </div>

            <div
              onClick={() => onNavigateTab("node")}
              className="bg-slate-950 hover:bg-slate-850 p-3 rounded-xl border border-slate-800 text-center cursor-pointer transition"
            >
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {metrics?.storagePools ? metrics.storagePools.length : 0}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                Storage Pools
              </div>
            </div>
          </div>
        </section>

        {/* Cell 2: Security Baseline Bento Card (Col 3, Row 1) */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl hover:border-slate-700 transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Security Baseline</span>
              </h2>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {securityScore}%
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                <span className="text-slate-300 font-medium">API Token Auth</span>
                <span className="font-mono font-bold text-emerald-400">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                <span className="text-slate-300 font-medium">Datacenter Firewall</span>
                <span className="font-mono font-bold text-emerald-400">ENABLED</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                <span className="text-slate-300 font-medium">Local Secret Storage</span>
                <span className="font-mono font-bold text-emerald-400">AES-256</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab("security")}
            className="mt-3 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center justify-between pt-2 border-t border-slate-800 transition"
          >
            <span>Run Security Audit & Fix Script</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </section>

        {/* Cell 3: Bulk Workload Actions Bento Card (Col 4, Row 1) */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl hover:border-slate-700 transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Power className="w-4 h-4 text-indigo-400" />
                <span>Workload Control</span>
              </h2>
              <span className="text-[10px] font-mono text-slate-500">{guests.length} Workloads</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Manage virtual machine and container power states with graceful ACPI shutdown or instantaneous boot.
            </p>

            <button
              onClick={() => onNavigateTab("power")}
              className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl transition flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-600/20"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Open Workload Manager</span>
            </button>
          </div>

          <button
            onClick={() => onNavigateTab("power")}
            className="mt-3 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center justify-between pt-2 border-t border-slate-800 transition"
          >
            <span>View All VMs & LXCs</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </section>

        {/* Cell 4: Backup Engine Bento Card (Col 3-4, Row 2) */}
        <section className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl hover:border-slate-700 transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Archive className="w-4 h-4 text-indigo-400" />
                <span>Backup Orchestrator & VZDump</span>
              </h2>
              <button
                onClick={() => onNavigateTab("backup")}
                className="text-[11px] text-indigo-400 hover:underline font-mono"
              >
                OPEN BACKUP ENGINE
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Trigger snapshot vzdump backups across live workloads, configure ZSTD compression, and verify retention pruning policies.
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Supported Compression:</span>
              <span className="text-indigo-300 font-semibold">ZSTD / GZIP / LZO</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Storage targets: <strong className="text-slate-200">local, local-zfs, PBS</strong></span>
            <span>Modes: <strong className="text-indigo-400">snapshot, suspend, stop</strong></span>
          </div>
        </section>

        {/* Cell 5: Ind. Sovereign Ecosystem Widget (Col 1-4, Row 3) */}
        <section className="lg:col-span-4 bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950/40 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 p-1 shrink-0">
              <img
                src="https://avatars.githubusercontent.com/u/34476702?v=4"
                alt="Algo2World"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-100">Algo2World & Ind. Sovereign Ecosystem</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                  Sovereign Cloud
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Engineered by Nikil (Algo2World) — Explore samvad.chat, ind.social, ind.network, ind.trading, ind.shiksha, ind.run.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab("ecosystem")}
            className="shrink-0 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center space-x-1.5"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>Explore Ecosystem & Commercial SLA</span>
          </button>
        </section>
      </div>
    </div>
  );
}
