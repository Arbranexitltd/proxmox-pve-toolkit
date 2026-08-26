export type TabType =
  | "bento"
  | "node"
  | "power"
  | "backup"
  | "security"
  | "cluster"
  | "terminal"
  | "ecosystem"
  | "code";

export interface AuthUser {
  username: string;
  role: string;
  mustChangePassword: boolean;
  lastLogin: string | null;
}

export interface ProxmoxConnectionStatus {
  configured: boolean;
  connected: boolean;
  host?: string;
  port?: number;
  nodeName?: string;
  lastTested?: string;
  lastStatus?: "connected" | "error" | "unconfigured";
  lastError?: string | null;
  versionInfo?: {
    release?: string;
    version?: string;
    repoid?: string;
  } | null;
}

export interface ProxmoxConfigFormData {
  host: string;
  port: number;
  authType: "token" | "password";
  tokenId: string;
  tokenSecret: string;
  username: string;
  password: string;
  realm: string;
  verifySsl: boolean;
  nodeName: string;
}

export interface StoragePool {
  storage: string;
  type: string;
  totalGb: number;
  usedGb: number;
  availGb: number;
  usagePct: number;
  active: boolean;
  content: string;
}

export interface NodeMetrics {
  node: string;
  status: "online" | "offline";
  uptimeDays: number;
  kernelVersion: string;
  pveVersion: string;
  cpuCores: number;
  cpuUsagePct: number;
  cpuIoWaitPct: number;
  loadAvg: [number, number, number];
  memoryTotalGb: number;
  memoryUsedGb: number;
  memoryUsagePct: number;
  swapTotalGb: number;
  swapUsedGb: number;
  rootfsUsagePct: number;
  storagePools: StoragePool[];
  qemuCount: number;
  lxcCount: number;
  runningGuests: number;
  alerts: string[];
}

export interface GuestWorkload {
  vmid: number;
  name: string;
  type: "qemu" | "lxc";
  node: string;
  status: "running" | "stopped" | "paused";
  tags: string[];
  pool?: string;
  cpuUsagePct: number;
  memoryMb: number;
  memoryUsedMb?: number;
  diskGb: number;
  uptime?: string;
  firewallEnabled: boolean;
  lock?: string | null;
}

export interface BackupJobState {
  vmid?: number;
  storage: string;
  mode: "snapshot" | "suspend" | "stop";
  compress: "zstd" | "gzip" | "lzo" | "none";
  keepLast: number;
  keepDaily: number;
  dryRun: boolean;
}

export interface BackupLogEntry {
  id: string;
  vmid: number;
  name: string;
  type: "qemu" | "lxc";
  node: string;
  storage: string;
  mode: string;
  status: "SUCCESS" | "FAILED" | "DRY_RUN_SUCCESS" | "RUNNING";
  duration: number;
  timestamp: string;
  taskUpid?: string;
  details?: string;
  error?: string;
}

export interface SecurityCheck {
  id: string;
  category: "Firewall" | "Authentication" | "API Security" | "TLS / Encryption" | "System Updates";
  title: string;
  status: "PASS" | "WARN" | "FAIL";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  details: string;
  remediation: string;
}

export interface TerminalOutputLine {
  id: string;
  type: "input" | "info" | "success" | "warning" | "error" | "table" | "panel" | "json";
  text?: string;
  formattedHtml?: string;
  jsonObj?: any;
}

export interface EcosystemPlatform {
  name: string;
  altDomain: string;
  category: string;
  description: string;
  url: string;
}

export interface EcosystemService {
  title: string;
  description: string;
}

export interface EcosystemData {
  company: string;
  founder: string;
  role: string;
  website: string;
  email: string;
  telegram: string;
  logo: string;
  platforms: EcosystemPlatform[];
  services: EcosystemService[];
}
