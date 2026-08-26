import React from "react";
import {
  LayoutGrid,
  Activity,
  Power,
  Archive,
  ShieldCheck,
  Server,
  Terminal,
  Globe,
  Code2,
  Download,
  KeyRound,
  LogOut,
  User,
  ExternalLink,
} from "lucide-react";
import { TabType, AuthUser, ProxmoxConnectionStatus } from "../types";

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onDownloadZip: () => void;
  onOpenPasswordChange: () => void;
  onLogout: () => void;
  user: AuthUser | null;
  connectionStatus: ProxmoxConnectionStatus | null;
}

export function Navbar({
  activeTab,
  setActiveTab,
  onDownloadZip,
  onOpenPasswordChange,
  onLogout,
  user,
  connectionStatus,
}: NavbarProps) {
  const isConnected = connectionStatus?.connected === true;

  const navItems: { id: TabType; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: "bento", label: "Overview", icon: LayoutGrid },
    { id: "node", label: "Node Health", icon: Activity },
    { id: "power", label: "Workloads & Power", icon: Power },
    { id: "backup", label: "Backup Engine", icon: Archive },
    { id: "security", label: "Security Auditor", icon: ShieldCheck, badge: "Live Scan" },
    { id: "cluster", label: "Cluster Settings", icon: Server },
    { id: "terminal", label: "CLI Console", icon: Terminal },
    { id: "ecosystem", label: "Ind. Ecosystem", icon: Globe, badge: "Algo2World" },
    { id: "code", label: "Code & Python CLI", icon: Code2 },
  ];

  return (
    <header className="bg-slate-950/95 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Tier: Logo, Status, User Actions */}
        <div className="flex items-center justify-between py-3 gap-4 border-b border-slate-800/80">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 p-1 flex items-center justify-center shrink-0 shadow-md">
              <img
                src="https://avatars.githubusercontent.com/u/34476702?v=4"
                alt="Proxmox PVE Toolkit"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-white tracking-tight">proxmox-pve-toolkit</h1>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                  v2.4.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider">
                ORCHESTRATION & TELEMETRY HUB • <span className="text-indigo-400">ALGO2WORLD</span>
              </p>
            </div>
          </div>

          {/* Connection Status & User Profile */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Proxmox Connection Indicator */}
            <button
              onClick={() => setActiveTab("cluster")}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left transition-all text-xs"
              title="Click to manage Proxmox connection"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              ></span>
              <div className="hidden sm:block">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {isConnected ? "Hypervisor Live" : "Hypervisor"}
                </div>
                <div className="font-mono text-slate-300 text-[11px]">
                  {isConnected
                    ? `${connectionStatus?.host || "Connected"}:${connectionStatus?.port || 8006}`
                    : "Not Connected"}
                </div>
              </div>
            </button>

            {/* Quick Export ZIP */}
            <button
              onClick={onDownloadZip}
              className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export ZIP</span>
            </button>

            {/* User Profile & Actions */}
            {user && (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                <div className="hidden lg:flex flex-col items-end">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-semibold text-slate-200">{user.username}</span>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                      {user.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {user.lastLogin ? "Session Active" : "First Login"}
                  </span>
                </div>

                <button
                  onClick={onOpenPasswordChange}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 transition"
                  title="Update Security Password"
                >
                  <KeyRound className="w-4 h-4" />
                </button>

                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/60 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Tier: Tab Navigation */}
        <div className="flex space-x-1.5 overflow-x-auto py-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-slate-900 text-white border border-slate-700 shadow-sm border-b-2 border-b-indigo-500"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      item.id === "security"
                        ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60"
                        : item.id === "ecosystem"
                        ? "bg-indigo-950 text-indigo-300 border border-indigo-800/60"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
