// ─────────────────────────────────────────────────────────
//  Cyber Cafe SaaS – Admin Mock Data
//  All data is static/mock – replace with real API calls.
// ─────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────

export type UserRole = "USER" | "CAFE_OWNER" | "CAFE_STAFF" | "SUPER_ADMIN";
export type UserStatus = "Active" | "Suspended" | "Pending";
export type CafeStatus = "online" | "degraded" | "offline";
export type DocStatus = "Active" | "Locked" | "Expired";
export type RequestStatus = "Approved" | "Pending" | "Denied";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ServiceStatus = "healthy" | "degraded" | "down";
export type ExpiryStatus = "active" | "soon" | "deleted";

export interface MockUser {
  id: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  lastActive: string;
  activity: { time: string; action: string }[];
}

export interface MockCafe {
  id: string;
  name: string;
  status: CafeStatus;
  jobs: number;
  todayJobs: number;
  staff: number;
  location: string;
  verified: boolean;
  services: string[];
  activeJobs: number;
}

export interface MockDocument {
  id: string;
  status: DocStatus;
  opens: number;
  maxOpens: number;
  expiresIn: string;
  uploadedAt: string;
  userId: string;
  cafeId?: string;
}

export interface MockPermission {
  requestId: string;
  cafeId: string;
  userId: string;
  documentId: string;
  canView: boolean;
  canPrint: boolean;
  canDownload: boolean;
  expiresAt: string;
  opens: number;
  maxOpens: number;
  status: RequestStatus;
  timeline: { time: string; action: string; icon: string }[];
}

export interface MockAuditLog {
  id: string;
  time: string;
  actor: string;
  actorType: "USER" | "CAFE" | "SYSTEM";
  action: string;
  result: "success" | "failure";
  resource: string;
  ip: string;
}

export interface MockSecurityEvent {
  type: string;
  count: number;
  risk: RiskLevel;
  latest: string;
  description: string;
}

export interface MockApiEndpoint {
  path: string;
  method: string;
  requests: number;
  errors: number;
  avgLatency: number;
}

export interface MockQueueStats {
  notifications: number;
  autoDelete: number;
  printJobs: number;
  aiJobs: number;
  healthy: boolean;
  totalProcessed: number;
  failedJobs: number;
}

export interface MockDbStats {
  status: ServiceStatus;
  activeQueries: number;
  avgLatency: number;
  storagePercent: number;
  slowQueries: number;
  connections: number;
  latencyHistory: number[];
}

export interface MockSystemService {
  name: string;
  status: ServiceStatus;
  uptime: number;
  responseTime: number;
  icon: string;
}

export interface MockExpirationDoc {
  id: string;
  expiresIn: string;
  status: ExpiryStatus;
  uploaded: string;
}

// ── Data ─────────────────────────────────────────────────

export const mockUsers: MockUser[] = [
  {
    id: "USR-1024",
    name: "Roshan Kumar",
    role: "USER",
    status: "Active",
    joinedAt: "2024-01-15",
    lastActive: "10 min ago",
    activity: [
      { time: "09:12", action: "Login" },
      { time: "09:14", action: "Document uploaded" },
      { time: "09:18", action: "Print requested" },
      { time: "09:22", action: "Permission approved" },
    ],
  },
  {
    id: "USR-1025",
    name: "Rahul Singh",
    role: "USER",
    status: "Active",
    joinedAt: "2024-02-20",
    lastActive: "1 hour ago",
    activity: [
      { time: "08:30", action: "Login" },
      { time: "08:35", action: "Document viewed" },
      { time: "09:00", action: "Print requested" },
    ],
  },
  {
    id: "USR-1026",
    name: "Aman Verma",
    role: "USER",
    status: "Suspended",
    joinedAt: "2024-03-10",
    lastActive: "2 days ago",
    activity: [
      { time: "2d ago", action: "Login attempt failed" },
      { time: "3d ago", action: "Unauthorized download attempt" },
    ],
  },
  {
    id: "USR-1027",
    name: "Priya Sharma",
    role: "CAFE_OWNER",
    status: "Active",
    joinedAt: "2023-11-05",
    lastActive: "30 min ago",
    activity: [
      { time: "09:30", action: "Managed staff" },
      { time: "10:00", action: "Processed job #10488" },
    ],
  },
  {
    id: "USR-1028",
    name: "Deepak Patel",
    role: "CAFE_STAFF",
    status: "Active",
    joinedAt: "2024-04-01",
    lastActive: "5 min ago",
    activity: [
      { time: "10:20", action: "Print job processed" },
      { time: "10:22", action: "Document scanned" },
    ],
  },
  {
    id: "USR-1051",
    name: "Anita Joshi",
    role: "USER",
    status: "Pending",
    joinedAt: "2024-08-14",
    lastActive: "Never",
    activity: [],
  },
];

export const mockCafes: MockCafe[] = [
  {
    id: "CAFE-101",
    name: "Star Cyber",
    status: "online",
    jobs: 42,
    todayJobs: 42,
    staff: 4,
    location: "Lucknow, UP",
    verified: true,
    services: ["Printing", "Scanning", "Online Forms"],
    activeJobs: 8,
  },
  {
    id: "CAFE-102",
    name: "Digital Hub",
    status: "degraded",
    jobs: 18,
    todayJobs: 18,
    staff: 2,
    location: "Kanpur, UP",
    verified: true,
    services: ["Printing", "Scanning"],
    activeJobs: 3,
  },
  {
    id: "CAFE-103",
    name: "Web Point",
    status: "offline",
    jobs: 0,
    todayJobs: 0,
    staff: 3,
    location: "Varanasi, UP",
    verified: false,
    services: ["Printing"],
    activeJobs: 0,
  },
  {
    id: "CAFE-104",
    name: "NetZone Pro",
    status: "online",
    jobs: 67,
    todayJobs: 67,
    staff: 5,
    location: "Agra, UP",
    verified: true,
    services: ["Printing", "Scanning", "Online Forms", "ID Copy"],
    activeJobs: 12,
  },
  {
    id: "CAFE-105",
    name: "Speed Byte",
    status: "online",
    jobs: 29,
    todayJobs: 29,
    staff: 2,
    location: "Prayagraj, UP",
    verified: true,
    services: ["Printing", "Online Forms"],
    activeJobs: 5,
  },
];

export const mockDocuments: MockDocument[] = [
  { id: "DOC-1001", status: "Active", opens: 2, maxOpens: 3, expiresIn: "2h", uploadedAt: "09:00", userId: "USR-1024" },
  { id: "DOC-1002", status: "Locked", opens: 3, maxOpens: 3, expiresIn: "5h", uploadedAt: "08:30", userId: "USR-1025", cafeId: "CAFE-101" },
  { id: "DOC-1003", status: "Expired", opens: 0, maxOpens: 3, expiresIn: "Expired", uploadedAt: "06:00", userId: "USR-1026" },
  { id: "DOC-1004", status: "Active", opens: 1, maxOpens: 5, expiresIn: "8h", uploadedAt: "09:30", userId: "USR-1027" },
  { id: "DOC-1005", status: "Active", opens: 0, maxOpens: 3, expiresIn: "1h", uploadedAt: "10:00", userId: "USR-1028" },
  { id: "DOC-1008", status: "Locked", opens: 3, maxOpens: 3, expiresIn: "Expired", uploadedAt: "07:00", userId: "USR-1024", cafeId: "CAFE-103" },
  { id: "DOC-1092", status: "Active", opens: 2, maxOpens: 3, expiresIn: "10:42 AM", uploadedAt: "09:45", userId: "USR-1024", cafeId: "CAFE-101" },
  { id: "DOC-1101", status: "Active", opens: 0, maxOpens: 2, expiresIn: "10 min", uploadedAt: "10:30", userId: "USR-1051" },
  { id: "DOC-1102", status: "Active", opens: 1, maxOpens: 3, expiresIn: "2 hours", uploadedAt: "09:15", userId: "USR-1025" },
  { id: "DOC-1103", status: "Expired", opens: 1, maxOpens: 2, expiresIn: "Expired", uploadedAt: "08:00", userId: "USR-1026" },
];

export const mockPermissions: MockPermission[] = [
  {
    requestId: "#2048",
    cafeId: "CAFE-101",
    userId: "USR-1024",
    documentId: "DOC-1092",
    canView: true,
    canPrint: true,
    canDownload: false,
    expiresAt: "10:42 AM",
    opens: 2,
    maxOpens: 3,
    status: "Approved",
    timeline: [
      { time: "09:10", action: "Request created", icon: "📋" },
      { time: "09:11", action: "User notified", icon: "🔔" },
      { time: "09:12", action: "User approved", icon: "✅" },
      { time: "09:12", action: "Temporary access generated", icon: "🔑" },
      { time: "09:18", action: "Document viewed", icon: "👁️" },
      { time: "09:21", action: "Print completed", icon: "🖨️" },
      { time: "09:22", action: "Access revoked", icon: "🚫" },
    ],
  },
  {
    requestId: "#2049",
    cafeId: "CAFE-103",
    userId: "USR-1026",
    documentId: "DOC-1008",
    canView: false,
    canPrint: false,
    canDownload: false,
    expiresAt: "Expired",
    opens: 0,
    maxOpens: 3,
    status: "Denied",
    timeline: [
      { time: "10:20", action: "Request created", icon: "📋" },
      { time: "10:21", action: "User notified", icon: "🔔" },
      { time: "10:24", action: "Download attempt blocked", icon: "🚨" },
      { time: "10:24", action: "Access denied (403)", icon: "❌" },
    ],
  },
  {
    requestId: "#2050",
    cafeId: "CAFE-102",
    userId: "USR-1051",
    documentId: "DOC-1004",
    canView: true,
    canPrint: false,
    canDownload: false,
    expiresAt: "11:30 AM",
    opens: 0,
    maxOpens: 3,
    status: "Pending",
    timeline: [
      { time: "10:40", action: "Request created", icon: "📋" },
      { time: "10:41", action: "Awaiting user approval", icon: "⏳" },
    ],
  },
  {
    requestId: "#2051",
    cafeId: "CAFE-104",
    userId: "USR-1025",
    documentId: "DOC-1002",
    canView: true,
    canPrint: true,
    canDownload: false,
    expiresAt: "10:00 AM",
    opens: 3,
    maxOpens: 3,
    status: "Approved",
    timeline: [
      { time: "08:30", action: "Request created", icon: "📋" },
      { time: "08:31", action: "User approved", icon: "✅" },
      { time: "08:35", action: "Document viewed", icon: "👁️" },
      { time: "09:00", action: "Print completed", icon: "🖨️" },
      { time: "09:00", action: "Max opens reached — locked", icon: "🔒" },
    ],
  },
];

export const mockAuditLogs: MockAuditLog[] = [
  { id: "AL-001", time: "09:12", actor: "USR-1024", actorType: "USER",   action: "Upload Document",    result: "success", resource: "DOC-1092", ip: "192.168.1.101" },
  { id: "AL-002", time: "09:13", actor: "CAFE-101", actorType: "CAFE",   action: "Request Access",     result: "success", resource: "DOC-1092", ip: "10.0.0.45"     },
  { id: "AL-003", time: "09:14", actor: "USR-1024", actorType: "USER",   action: "Approve Access",     result: "success", resource: "#2048",    ip: "192.168.1.101" },
  { id: "AL-004", time: "09:20", actor: "CAFE-101", actorType: "CAFE",   action: "Print Document",     result: "success", resource: "DOC-1092", ip: "10.0.0.45"     },
  { id: "AL-005", time: "09:21", actor: "CAFE-101", actorType: "CAFE",   action: "Download Attempt",   result: "failure", resource: "DOC-1092", ip: "10.0.0.45"     },
  { id: "AL-006", time: "09:45", actor: "USR-1026", actorType: "USER",   action: "Login",              result: "failure", resource: "AUTH",     ip: "203.0.113.42"  },
  { id: "AL-007", time: "10:02", actor: "USR-1027", actorType: "USER",   action: "Upload Document",    result: "success", resource: "DOC-1004", ip: "192.168.1.55"  },
  { id: "AL-008", time: "10:15", actor: "CAFE-103", actorType: "CAFE",   action: "Unauthorized Access",result: "failure", resource: "DOC-1008", ip: "172.16.0.12"   },
  { id: "AL-009", time: "10:24", actor: "USR-1026", actorType: "USER",   action: "Download Attempt",   result: "failure", resource: "DOC-1008", ip: "203.0.113.42"  },
  { id: "AL-010", time: "10:30", actor: "SYSTEM",   actorType: "SYSTEM", action: "Auto Delete Document",result: "success", resource: "DOC-1103", ip: "internal"      },
  { id: "AL-011", time: "10:35", actor: "USR-1051", actorType: "USER",   action: "Upload Document",    result: "success", resource: "DOC-1101", ip: "192.168.2.88"  },
  { id: "AL-012", time: "10:40", actor: "CAFE-102", actorType: "CAFE",   action: "Request Access",     result: "success", resource: "DOC-1004", ip: "10.0.1.22"     },
];

export const mockSecurityEvents: MockSecurityEvent[] = [
  { type: "Failed Login",       count: 18, risk: "MEDIUM",   latest: "10:45 AM", description: "Multiple failed authentication attempts detected"         },
  { type: "Unauthorized Access",count: 7,  risk: "HIGH",     latest: "10:24 AM", description: "Access to restricted documents without permission"        },
  { type: "Download Attempts",  count: 5,  risk: "HIGH",     latest: "10:24 AM", description: "Attempts to download documents without permission"         },
  { type: "Rate Limit Events",  count: 3,  risk: "LOW",      latest: "09:58 AM", description: "API rate limit exceeded on /documents endpoint"            },
  { type: "Suspicious Activity",count: 2,  risk: "CRITICAL", latest: "10:15 AM", description: "Anomalous access patterns detected from new IP addresses"  },
];

export const mockApiEndpoints: MockApiEndpoint[] = [
  { path: "/auth/google",   method: "POST",     requests: 820,   errors: 2, avgLatency: 142 },
  { path: "/documents",     method: "GET/POST", requests: 4200,  errors: 8, avgLatency: 89  },
  { path: "/permissions",   method: "GET/POST", requests: 1300,  errors: 3, avgLatency: 112 },
  { path: "/print-jobs",    method: "GET/POST", requests: 2100,  errors: 6, avgLatency: 203 },
  { path: "/cafes",         method: "GET",      requests: 680,   errors: 1, avgLatency: 67  },
  { path: "/users",         method: "GET",      requests: 940,   errors: 0, avgLatency: 54  },
  { path: "/audit-logs",    method: "GET",      requests: 320,   errors: 0, avgLatency: 78  },
  { path: "/health",        method: "GET",      requests: 14400, errors: 0, avgLatency: 12  },
];

export const mockQueueStats: MockQueueStats = {
  notifications: 18,
  autoDelete: 4,
  printJobs: 12,
  aiJobs: 6,
  healthy: true,
  totalProcessed: 24892,
  failedJobs: 3,
};

export const mockDbStats: MockDbStats = {
  status: "healthy",
  activeQueries: 42,
  avgLatency: 24,
  storagePercent: 61,
  slowQueries: 3,
  connections: 87,
  latencyHistory: [18, 22, 19, 28, 24, 31, 21, 18, 24, 20, 25, 19, 22, 26, 24],
};

export const mockSystemServices: MockSystemService[] = [
  { name: "FastAPI Backend",    status: "healthy", uptime: 99.98, responseTime: 45,  icon: "🚀" },
  { name: "PostgreSQL",         status: "healthy", uptime: 99.99, responseTime: 24,  icon: "🗄️" },
  { name: "Redis Cache",        status: "healthy", uptime: 100.0, responseTime: 2,   icon: "⚡" },
  { name: "Object Storage",     status: "healthy", uptime: 99.95, responseTime: 88,  icon: "📦" },
  { name: "Notification Queue", status: "healthy", uptime: 99.87, responseTime: 12,  icon: "📬" },
  { name: "Worker Process",     status: "healthy", uptime: 99.72, responseTime: 156, icon: "⚙️" },
];

export const mockLatencyHistory =  [120, 135, 118, 142, 128, 156, 132, 145, 138, 122, 148, 131, 139, 125, 142];
export const mockRequestHistory =  [1800, 2100, 1950, 2400, 2200, 2800, 2600, 3100, 2900, 2400, 3200, 2700, 3000, 2500, 2800];
export const mockErrorHistory =    [2, 4, 1, 6, 3, 8, 2, 5, 3, 1, 7, 2, 4, 3, 5];

export const mockExpirationDocs: MockExpirationDoc[] = [
  { id: "DOC-1101", expiresIn: "10 min",  status: "soon",    uploaded: "10:30 AM" },
  { id: "DOC-1005", expiresIn: "1 hour",  status: "soon",    uploaded: "10:00 AM" },
  { id: "DOC-1102", expiresIn: "2 hours", status: "active",  uploaded: "09:15 AM" },
  { id: "DOC-1092", expiresIn: "4 hours", status: "active",  uploaded: "09:45 AM" },
  { id: "DOC-1004", expiresIn: "8 hours", status: "active",  uploaded: "09:30 AM" },
  { id: "DOC-1103", expiresIn: "Expired", status: "deleted", uploaded: "08:00 AM" },
  { id: "DOC-1003", expiresIn: "Expired", status: "deleted", uploaded: "06:00 AM" },
];

export const mockBlockedAccess = [
  { userId: "USR-1026", cafeId: "CAFE-103", documentId: "DOC-1008", reason: "Permission denied",                    attempt: "Download", httpCode: 403, time: "10:24 AM", ip: "203.0.113.42" },
  { userId: "USR-1051", cafeId: "CAFE-102", documentId: "DOC-1001", reason: "Document locked (max opens reached)",  attempt: "View",     httpCode: 423, time: "10:18 AM", ip: "192.168.2.88" },
];

export const mockOverviewStats = {
  apiRequests:    24892,
  activeUsers:    1240,
  activeCafes:    184,
  activeJobs:     326,
  securityEvents: 12,
};

export const rbacRoles = [
  {
    id: "USER",
    label: "User",
    color: "#004E89",
    description: "End users who upload and approve document access",
    permissions: {
      viewJobs: true,
      requestAccess: true,
      print: true,
      download: false,
      uploadDocuments: true,
      approveAccess: true,
      manageCafe: false,
      manageStaff: false,
      billing: false,
      adminSettings: false,
    },
  },
  {
    id: "CAFE_OWNER",
    label: "Cafe Owner",
    color: "#FF6B35",
    description: "Owns and manages a cyber cafe and its staff",
    permissions: {
      viewJobs: true,
      requestAccess: true,
      print: true,
      download: false,
      uploadDocuments: false,
      approveAccess: false,
      manageCafe: true,
      manageStaff: true,
      billing: true,
      adminSettings: false,
    },
  },
  {
    id: "CAFE_STAFF",
    label: "Cafe Staff",
    color: "#F59E0B",
    description: "Staff members who process assigned print and scan jobs",
    permissions: {
      viewJobs: true,
      requestAccess: true,
      print: true,
      download: false,
      uploadDocuments: false,
      approveAccess: false,
      manageCafe: false,
      manageStaff: false,
      billing: false,
      adminSettings: false,
    },
  },
  {
    id: "SUPER_ADMIN",
    label: "Super Admin",
    color: "#EF4444",
    description: "Full system administration access",
    permissions: {
      viewJobs: true,
      requestAccess: true,
      print: true,
      download: true,
      uploadDocuments: true,
      approveAccess: true,
      manageCafe: true,
      manageStaff: true,
      billing: true,
      adminSettings: true,
    },
  },
];

export const permissionLabels: Record<string, string> = {
  viewJobs:         "View Jobs",
  requestAccess:    "Request Access",
  print:            "Print",
  download:         "Download",
  uploadDocuments:  "Upload Documents",
  approveAccess:    "Approve Access",
  manageCafe:       "Manage Cafe",
  manageStaff:      "Manage Staff",
  billing:          "Billing",
  adminSettings:    "Admin Settings",
};
