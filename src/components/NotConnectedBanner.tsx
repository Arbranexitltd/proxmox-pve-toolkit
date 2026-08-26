import React from "react";
import { ServerOff, Settings2, Shield, ArrowRight, CheckCircle2 } from "lucide-react";

interface NotConnectedBannerProps {
  onConfigureClick: () => void;
  error?: string | null;
}

export function NotConnectedBanner({ onConfigureClick, error }: NotConnectedBannerProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 text-center max-w-3xl mx-auto shadow-2xl my-8">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
        <ServerOff className="w-8 h-8" />
      </div>

      <h3 className="text-xl font-bold text-slate-100 tracking-tight">
        Not Connected — Configure Proxmox Cluster
      </h3>
      <p className="text-sm text-slate-400 max-w-lg mx-auto mt-2 leading-relaxed">
        No live Proxmox Virtual Environment (PVE) host connection is active. Connect your hypervisor endpoint to stream real-time metrics, workloads, backup jobs, and security audits.
      </p>

      {error && (
        <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-mono max-w-xl mx-auto text-left">
          <strong>Connection Error:</strong> {error}
        </div>
      )}

      {/* Zero Mock Data Policy badge */}
      <div className="mt-6 inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs text-slate-400">
        <Shield className="w-3.5 h-3.5 text-indigo-400" />
        <span>Zero Mock Data Policy: All telemetry is strictly pulled from live Proxmox REST APIs.</span>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onConfigureClick}
          className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2"
        >
          <Settings2 className="w-4 h-4" />
          <span>Open Cluster Connection Settings</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
        <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-900">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>API Token Auth</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            Uses scoped <code className="text-slate-400 font-mono">PVEAPIToken=USER@REALM!TOKENID=SECRET</code> without requiring root PAM passwords.
          </p>
        </div>
        <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-900">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Self-Signed SSL Toggle</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            Supports default Proxmox self-signed SSL certificates safely with one-click verification toggle.
          </p>
        </div>
        <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-900">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Encrypted at Rest</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            API secrets and tokens are encrypted locally with AES-256-GCM master keys.
          </p>
        </div>
      </div>
    </div>
  );
}
