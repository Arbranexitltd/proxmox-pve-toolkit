import React, { useState } from "react";
import { Lock, User, Shield, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";

interface LoginModalProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export function LoginModal({ onLoginSuccess }: LoginModalProps) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed. Please verify credentials.");
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header with Hardcoded Logo */}
        <div className="bg-slate-950/70 p-6 border-b border-slate-800/80 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 p-2 mb-3 shadow-inner">
            <img
              src="https://avatars.githubusercontent.com/u/34476702?v=4"
              alt="Algo2World Proxmox PVE Toolkit"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Proxmox PVE Toolkit</h2>
          <p className="text-xs text-slate-400 mt-1">Enterprise Cluster Orchestration & Telemetry</p>
          <div className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Shield className="w-3 h-3" />
            <span>Algo2World Sovereign Systems</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                placeholder="admin"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
              <span className="text-[11px] text-slate-500">Default: ChangeMe@PVE2026!</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="••••••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span className="inline-flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Authenticating...</span>
              </span>
            ) : (
              <>
                <span>Sign In to PVE Hub</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-3 border-t border-slate-800/60 text-center">
            <p className="text-[11px] text-slate-500">
              Initial credentials: <code className="text-indigo-300 font-mono">admin</code> / <code className="text-indigo-300 font-mono">ChangeMe@PVE2026!</code>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
