import React, { useState, useEffect, useCallback } from "react";
import {
  TabType,
  NodeMetrics,
  GuestWorkload,
  SecurityCheck,
  AuthUser,
  ProxmoxConnectionStatus,
  StoragePool,
} from "./types";
import { toolkitFiles } from "./data/toolkitFiles";
import { Navbar } from "./components/Navbar";
import { BentoDashboardView } from "./components/BentoDashboardView";
import { TerminalSimulator } from "./components/TerminalSimulator";
import { NodeAuditorView } from "./components/NodeAuditorView";
import { BackupOrchestratorView } from "./components/BackupOrchestratorView";
import { PowerControllerView } from "./components/PowerControllerView";
import { SecurityAuditorView } from "./components/SecurityAuditorView";
import { ClusterConfigView } from "./components/ClusterConfigView";
import { EcosystemShowcaseView } from "./components/EcosystemShowcaseView";
import { CodeExporterView } from "./components/CodeExporterView";
import { LoginModal } from "./components/LoginModal";
import { MandatoryPasswordChangeModal } from "./components/MandatoryPasswordChangeModal";
import JSZip from "jszip";
import { Globe, Heart, Shield, Terminal, Zap, CheckCircle2 } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("bento");

  // Auth States
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("pve_auth_token"));
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);

  // Proxmox Live Data States
  const [connectionStatus, setConnectionStatus] = useState<ProxmoxConnectionStatus | null>(null);
  const [nodeMetrics, setNodeMetrics] = useState<NodeMetrics | null>(null);
  const [guests, setGuests] = useState<GuestWorkload[]>([]);
  const [securityChecks, setSecurityChecks] = useState<SecurityCheck[]>([]);
  const [storagePools, setStoragePools] = useState<StoragePool[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // 1. Verify User Authentication on Startup
  const checkAuth = useCallback(async () => {
    const savedToken = localStorage.getItem("pve_auth_token");
    if (!savedToken) {
      setUser(null);
      setIsAuthLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(savedToken);
        if (data.user.mustChangePassword) {
          setShowPasswordChangeModal(true);
        }
      } else {
        localStorage.removeItem("pve_auth_token");
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 2. Fetch Proxmox Connection Status & Cluster Telemetry
  const fetchProxmoxData = useCallback(async () => {
    if (!token) return;
    setIsLoadingData(true);

    try {
      // Check Connection Status
      const statusRes = await fetch("/api/pve/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statusData: ProxmoxConnectionStatus = await statusRes.json();
      setConnectionStatus(statusData);

      if (statusData.connected) {
        const activeNode = statusData.nodeName || "pve";

        // Parallel Fetch: Node Status, Workloads, Security Audit
        const [nodeRes, workloadsRes, secRes, storageRes] = await Promise.all([
          fetch(`/api/pve/nodes/${encodeURIComponent(activeNode)}/status`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/pve/workloads", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/pve/security/audit", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/pve/nodes/${encodeURIComponent(activeNode)}/storage`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (nodeRes.ok) {
          const nodeData = await nodeRes.json();
          if (nodeData.success && nodeData.metrics) {
            setNodeMetrics(nodeData.metrics);
          }
        }

        if (workloadsRes.ok) {
          const workData = await workloadsRes.json();
          if (workData.success && Array.isArray(workData.guests)) {
            setGuests(workData.guests);
          }
        }

        if (secRes.ok) {
          const secData = await secRes.json();
          if (secData.success && Array.isArray(secData.checks)) {
            setSecurityChecks(secData.checks);
          }
        }

        if (storageRes.ok) {
          const stData = await storageRes.json();
          if (stData.success && Array.isArray(stData.storage)) {
            setStoragePools(stData.storage);
          }
        }
      } else {
        setNodeMetrics(null);
        setGuests([]);
        setSecurityChecks([]);
        setStoragePools([]);
      }
    } catch (err) {
      console.error("Failed to load Proxmox data:", err);
    } finally {
      setIsLoadingData(false);
    }
  }, [token]);

  useEffect(() => {
    if (user && token) {
      fetchProxmoxData();
    }
  }, [user, token, fetchProxmoxData]);

  // Auth Handlers
  const handleLoginSuccess = (newToken: string, loggedInUser: AuthUser) => {
    setToken(newToken);
    setUser(loggedInUser);
    if (loggedInUser.mustChangePassword) {
      setShowPasswordChangeModal(true);
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Logout request error:", err);
      }
    }
    localStorage.removeItem("pve_auth_token");
    setToken(null);
    setUser(null);
    setConnectionStatus(null);
    setNodeMetrics(null);
    setGuests([]);
  };

  const handlePasswordChanged = () => {
    setShowPasswordChangeModal(false);
    if (user) {
      setUser({ ...user, mustChangePassword: false });
    }
  };

  // Power Action Handler
  const handlePowerAction = async (node: string, type: "qemu" | "lxc", vmid: number, action: string) => {
    if (!token) throw new Error("Unauthorized");
    const res = await fetch(`/api/pve/workloads/${encodeURIComponent(node)}/${type}/${vmid}/power`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Power operation failed");
    }

    // Refresh workload list
    fetchProxmoxData();
  };

  // Export Zip Handler
  const handleDownloadZip = async () => {
    const zip = new JSZip();
    toolkitFiles.forEach((file) => {
      zip.file(file.path, file.content);
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "proxmox-pve-toolkit-v2.4.0.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadZip={handleDownloadZip}
        onOpenPasswordChange={() => setShowPasswordChangeModal(true)}
        onLogout={handleLogout}
        user={user}
        connectionStatus={connectionStatus}
      />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "bento" && (
          <BentoDashboardView
            metrics={nodeMetrics}
            guests={guests}
            securityChecks={securityChecks}
            connectionStatus={connectionStatus}
            onNavigateTab={setActiveTab}
            onRefreshMetrics={fetchProxmoxData}
            onPowerAction={handlePowerAction}
          />
        )}

        {activeTab === "node" && (
          <NodeAuditorView
            metrics={nodeMetrics}
            connectionStatus={connectionStatus}
            onRefresh={fetchProxmoxData}
            onConfigureClick={() => setActiveTab("cluster")}
          />
        )}

        {activeTab === "power" && (
          <PowerControllerView
            guests={guests}
            connectionStatus={connectionStatus}
            onPowerAction={handlePowerAction}
            onRefresh={fetchProxmoxData}
            onConfigureClick={() => setActiveTab("cluster")}
          />
        )}

        {activeTab === "backup" && (
          <BackupOrchestratorView
            guests={guests}
            storagePools={storagePools}
            connectionStatus={connectionStatus}
            onConfigureClick={() => setActiveTab("cluster")}
          />
        )}

        {activeTab === "security" && (
          <SecurityAuditorView
            checks={securityChecks}
            connectionStatus={connectionStatus}
            onRefresh={fetchProxmoxData}
            onConfigureClick={() => setActiveTab("cluster")}
          />
        )}

        {activeTab === "cluster" && (
          <ClusterConfigView
            onConnectionSaved={fetchProxmoxData}
            connectionStatus={connectionStatus}
          />
        )}

        {activeTab === "terminal" && (
          <TerminalSimulator onRunCommandPreset={(cmd) => {}} />
        )}

        {activeTab === "ecosystem" && <EcosystemShowcaseView />}

        {activeTab === "code" && (
          <CodeExporterView onDownloadZip={handleDownloadZip} />
        )}
      </main>

      {/* Mandatory Password Change Modal */}
      <MandatoryPasswordChangeModal
        isOpen={showPasswordChangeModal}
        onPasswordChanged={handlePasswordChanged}
      />

      {/* Login Modal (if not logged in and not loading) */}
      {!isAuthLoading && !user && (
        <LoginModal onLoginSuccess={handleLoginSuccess} />
      )}

      {/* Global Bento Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 p-0.5 shrink-0">
              <img
                src="https://avatars.githubusercontent.com/u/34476702?v=4"
                alt="Algo2World"
                className="w-full h-full object-cover rounded-md"
              />
            </div>
            <div>
              <span className="font-semibold text-slate-200">Algo2World & Ind. Sovereign Ecosystem</span>
              <span className="text-slate-500 font-mono ml-2">Lead Architect: Nikil</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono">
            <a
              href="https://algo2world.com"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-indigo-400 transition"
            >
              algo2world.com
            </a>
            <span className="text-slate-700">•</span>
            <a
              href="https://samvad.chat"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-indigo-400 transition"
            >
              samvad.chat
            </a>
            <span className="text-slate-700">•</span>
            <a
              href="https://ind.network"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-indigo-400 transition"
            >
              ind.network
            </a>
            <span className="text-slate-700">•</span>
            <a
              href="mailto:nikil@algo2world.com"
              className="text-slate-400 hover:text-indigo-400 transition"
            >
              nikil@algo2world.com
            </a>
            <span className="text-slate-700">•</span>
            <a
              href="https://t.me/AUTO_GPT_BOT"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:text-indigo-300 transition"
            >
              @AUTO_GPT_BOT
            </a>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-500">
            <span>AES-256 GCM VAULT</span>
            <span>•</span>
            <span className="text-emerald-400">PVE REST API</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
