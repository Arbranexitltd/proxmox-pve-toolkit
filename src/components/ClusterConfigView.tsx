import React, { useState, useEffect } from "react";
import { Server, KeyRound, Shield, CheckCircle2, AlertTriangle, RefreshCw, Terminal, Eye, EyeOff, Save, ExternalLink } from "lucide-react";
import { ProxmoxConfigFormData } from "../types";

interface ClusterConfigViewProps {
  token: string;
  onConnectionUpdated: () => void;
}

export function ClusterConfigView({ token, onConnectionUpdated }: ClusterConfigViewProps) {
  const [formData, setFormData] = useState<ProxmoxConfigFormData>({
    host: "",
    port: 8006,
    authType: "token",
    tokenId: "automation@pve!pve-toolkit-token",
    tokenSecret: "",
    username: "root",
    password: "",
    realm: "pam",
    verifySsl: false,
    nodeName: "",
  });

  const [hasStoredSecret, setHasStoredSecret] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; version?: any } | null>(null);
  const [currentStatus, setCurrentStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch current config on load
  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pve/config", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.configured && data.config) {
        setFormData({
          host: data.config.host || "",
          port: data.config.port || 8006,
          authType: data.config.authType || "token",
          tokenId: data.config.tokenId || "",
          tokenSecret: "",
          username: data.config.username || "",
          password: "",
          realm: data.config.realm || "pam",
          verifySsl: data.config.verifySsl === true,
          nodeName: data.config.nodeName || "",
        });
        setHasStoredSecret(data.config.hasTokenSecret || data.config.hasPassword);
        setCurrentStatus(data.config);
      }
    } catch (err: any) {
      console.error("Failed to load PVE config:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, [token]);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const res = await fetch("/api/pve/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Connection handshake failed.");
      }

      setTestResult({
        success: true,
        message: data.message || "Proxmox REST API handshake successful!",
        version: data.version,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Could not reach Proxmox host on port 8006.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/pve/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save Proxmox connection.");
      }

      setHasStoredSecret(true);
      await loadConfig();
      onConnectionUpdated();
    } catch (err: any) {
      setError(err.message || "Error updating connection credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <Server className="w-5 h-5 text-indigo-400" />
            <span>Proxmox Host & Cluster Connection Manager</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage REST API credentials, least-privilege API tokens, and TLS security for your Proxmox VE 7.x/8.x hypervisors.
          </p>
        </div>

        {currentStatus && (
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                currentStatus.lastStatus === "connected"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  currentStatus.lastStatus === "connected" ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                }`}
              ></span>
              <span>
                {currentStatus.lastStatus === "connected"
                  ? `Connected: ${currentStatus.host}:${currentStatus.port}`
                  : "Disconnected / Error"}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Main Settings Form Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <form onSubmit={handleSave} className="space-y-5">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 ${
                  testResult.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{testResult.message}</p>
                  {testResult.version && (
                    <p className="mt-1 font-mono text-[11px] text-emerald-200">
                      Release: {testResult.version.release || testResult.version.version} | Repo ID: {testResult.version.repoid}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Host and Port */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Proxmox Hostname or IP Address *
                </label>
                <input
                  type="text"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  required
                  placeholder="192.168.1.100 or pve.yourdomain.lan"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Port
                </label>
                <input
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })}
                  required
                  placeholder="8006"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Auth Type Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Authentication Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, authType: "token" })}
                  className={`p-3 rounded-xl border text-left flex items-start space-x-3 transition-all ${
                    formData.authType === "token"
                      ? "bg-indigo-600/15 border-indigo-500 text-indigo-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <KeyRound className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
                  <div>
                    <div className="font-semibold text-xs text-slate-200">API Token (Recommended)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Scoped token, no password needed</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, authType: "password" })}
                  className={`p-3 rounded-xl border text-left flex items-start space-x-3 transition-all ${
                    formData.authType === "password"
                      ? "bg-indigo-600/15 border-indigo-500 text-indigo-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <Shield className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
                  <div>
                    <div className="font-semibold text-xs text-slate-200">User & Password / Ticket</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Direct PAM/PVE realm auth</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Token Fields */}
            {formData.authType === "token" && (
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    API Token ID (USER@REALM!TOKENID)
                  </label>
                  <input
                    type="text"
                    value={formData.tokenId}
                    onChange={(e) => setFormData({ ...formData, tokenId: e.target.value })}
                    required
                    placeholder="automation@pve!pve-toolkit-token"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      API Token Secret (UUID)
                    </label>
                    {hasStoredSecret && !formData.tokenSecret && (
                      <span className="text-[11px] text-emerald-400 font-mono">
                        ✓ Token Secret securely encrypted in store
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showSecret ? "text" : "password"}
                      value={formData.tokenSecret}
                      onChange={(e) => setFormData({ ...formData, tokenSecret: e.target.value })}
                      placeholder={
                        hasStoredSecret
                          ? "Leave blank to keep existing secret, or enter new UUID"
                          : "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      }
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Password Auth Fields */}
            {formData.authType === "password" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    placeholder="root"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Realm</label>
                  <select
                    value={formData.realm}
                    onChange={(e) => setFormData({ ...formData, realm: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 font-mono"
                  >
                    <option value="pam">pam (Linux PAM Standard)</option>
                    <option value="pve">pve (Proxmox VE Auth Realm)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={hasStoredSecret ? "••••••••••••" : "Password"}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 font-mono"
                  />
                </div>
              </div>
            )}

            {/* TLS & Node Name */}
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Verify SSL Certificate</div>
                  <div className="text-[11px] text-slate-500">
                    Disable if using default Proxmox self-signed HTTPS certificate
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.verifySsl}
                    onChange={(e) => setFormData({ ...formData, verifySsl: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Default Target Node Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.nodeName}
                  onChange={(e) => setFormData({ ...formData, nodeName: e.target.value })}
                  placeholder="Auto-detects first active node (e.g., pve or pve-01)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 font-mono"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !formData.host}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-medium text-xs rounded-xl transition-all border border-slate-700 flex items-center justify-center space-x-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? "animate-spin text-indigo-400" : ""}`} />
                <span>{testing ? "Pinging Proxmox..." : "Test Connection Handshake"}</span>
              </button>

              <button
                type="submit"
                disabled={loading || !formData.host}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-950 disabled:text-slate-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save & Connect Cluster</span>
              </button>
            </div>
          </form>
        </div>

        {/* Least-Privilege Role Setup Instructions */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Terminal className="w-4 h-4" />
              <span>Proxmox Shell Setup Guide</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Run these quick commands in your Proxmox Host Shell / SSH terminal to create a dedicated least-privilege automation user and API token:
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-indigo-300 space-y-2 overflow-x-auto select-all">
              <div>
                <span className="text-slate-500"># 1. Add dedicated least-privilege role</span>
                <br />
                <code>pveum role add PVEToolkitRole -privs "VM.Audit VM.Backup VM.PowerMgmt VM.Config.Disk Sys.Audit Datacenter.Audit"</code>
              </div>
              <div>
                <span className="text-slate-500"># 2. Create service user in PVE realm</span>
                <br />
                <code>pveum user add automation@pve --comment "DevOps Automation"</code>
              </div>
              <div>
                <span className="text-slate-500"># 3. Grant role at cluster root</span>
                <br />
                <code>pveum acl modify / -user automation@pve -role PVEToolkitRole</code>
              </div>
              <div>
                <span className="text-slate-500"># 4. Generate API token without privilege separation</span>
                <br />
                <code>pveum user token add automation@pve pve-toolkit-token --privsep 0</code>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Zero-Trust Local Encryption</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connection credentials and secrets are encrypted with an automated local AES-256-GCM master key on disk. Tokens are transmitted directly to the configured hypervisor endpoint without external telemetries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
