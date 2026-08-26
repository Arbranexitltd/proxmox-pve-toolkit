import React, { useState, useMemo } from "react";
import { ShieldAlert, Lock, CheckCircle2, XCircle, KeyRound, AlertTriangle } from "lucide-react";

interface MandatoryPasswordChangeModalProps {
  token: string;
  onPasswordChanged: (user: any) => void;
}

export function MandatoryPasswordChangeModal({ token, onPasswordChanged }: MandatoryPasswordChangeModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Password strength checklist
  const criteria = useMemo(() => {
    return {
      length: newPassword.length >= 10,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword),
      matches: newPassword !== "" && newPassword === confirmPassword,
      differentFromCurrent: newPassword !== "" && newPassword !== currentPassword,
    };
  }, [newPassword, confirmPassword, currentPassword]);

  const allCriteriaMet =
    criteria.length &&
    criteria.uppercase &&
    criteria.lowercase &&
    criteria.number &&
    criteria.symbol &&
    criteria.matches &&
    criteria.differentFromCurrent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allCriteriaMet) {
      setError("Please satisfy all password complexity rules before proceeding.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password.");
      }

      onPasswordChanged(data.user);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-lg p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Banner Header */}
        <div className="bg-amber-500/10 border-b border-amber-500/30 p-6 flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
              <span>Security Action Required</span>
            </div>
            <h2 className="text-lg font-bold text-slate-100">Mandatory Initial Password Change</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              For enterprise zero-trust compliance, the initial default credentials (<code className="text-amber-300 font-mono">ChangeMe@PVE2026!</code>) must be replaced before full hypervisor access is granted.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Current Temporary Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                placeholder="Enter ChangeMe@PVE2026!"
              />
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              New Strong Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                placeholder="Enter new strong password"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                placeholder="Re-type new password"
              />
            </div>
          </div>

          {/* Password Complexity Checklist */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Complexity Requirements:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className={`flex items-center space-x-2 ${criteria.length ? "text-emerald-400" : "text-slate-500"}`}>
                {criteria.length ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>Min 10 characters</span>
              </div>
              <div className={`flex items-center space-x-2 ${criteria.uppercase ? "text-emerald-400" : "text-slate-500"}`}>
                {criteria.uppercase ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>At least 1 uppercase (A-Z)</span>
              </div>
              <div className={`flex items-center space-x-2 ${criteria.lowercase ? "text-emerald-400" : "text-slate-500"}`}>
                {criteria.lowercase ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>At least 1 lowercase (a-z)</span>
              </div>
              <div className={`flex items-center space-x-2 ${criteria.number ? "text-emerald-400" : "text-slate-500"}`}>
                {criteria.number ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>At least 1 digit (0-9)</span>
              </div>
              <div className={`flex items-center space-x-2 ${criteria.symbol ? "text-emerald-400" : "text-slate-500"}`}>
                {criteria.symbol ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>At least 1 symbol (!@#$...)</span>
              </div>
              <div className={`flex items-center space-x-2 ${criteria.matches ? "text-emerald-400" : "text-slate-500"}`}>
                {criteria.matches ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>Passwords match</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!allCriteriaMet || loading}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-950 font-semibold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span className="inline-flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Updating Credentials...</span>
              </span>
            ) : (
              <span>Save & Unlock Orchestration Hub</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
