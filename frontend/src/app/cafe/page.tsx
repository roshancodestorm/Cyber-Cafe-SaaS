"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Sparkles, Stamp, IndianRupee, Users, Wallet, LogOut,
  BarChart3, Folder, TrendingUp, UserPlus, FileBarChart, ListTodo,
} from "lucide-react";

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/cafe" },
  { label: "AI Enhance Logs", icon: Sparkles, href: "/user/documents" },
  { label: "Watermark Settings", icon: Stamp, href: "/user/documents" },
  { label: "Price Management", icon: IndianRupee, href: "/user/wallet" },
  { label: "Staff Management", icon: Users, href: "/user/settings" },
  { label: "Wallet Balance", icon: Wallet, href: "/user/wallet" },
];

const stats = [
  { title: "Today's Orders", value: "24", icon: BarChart3 },
  { title: "Documents Processed", value: "58", icon: Folder },
  { title: "Total Revenue", value: "₹12,450", icon: TrendingUp },
  { title: "Active Customers", value: "42", icon: Users },
];

const recentOrders = [
  { id: "1023", customer: "Aryan Mehta", type: "Aadhaar", status: "Watermarked", amount: "₹10", date: "01/05/2024" },
  { id: "1022", customer: "Sneha Gupta", type: "PAN", status: "Enhanced", amount: "₹15", date: "30/04/2024" },
  { id: "1021", customer: "Rahul Verma", type: "Marksheet", status: "Clean/Paid", amount: "₹20", date: "29/04/2024" },
  { id: "1020", customer: "Priya Sharma", type: "Invoice", status: "Enhanced", amount: "₹10", date: "28/04/2024" },
  { id: "1019", customer: "Anil Kapoor", type: "Resume", status: "Watermarked", amount: "₹10", date: "27/04/2024" },
];

const statusStyles: Record<string, string> = {
  Watermarked: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Enhanced: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  "Clean/Paid": "bg-green-500/15 text-green-600 dark:text-green-400",
};

function RevenueChart() {
  const data = [
    { label: "May 1", v: 165 }, { label: "May 5", v: 172 }, { label: "May 8", v: 178 },
    { label: "May 12", v: 170 }, { label: "May 15", v: 195 }, { label: "May 19", v: 182 },
    { label: "May 22", v: 186 }, { label: "May 25", v: 175 }, { label: "May 28", v: 192 },
    { label: "May 31", v: 188 },
  ];
  const width = 620, height = 220, pad = 36, maxV = 210, minV = 155;
  const stepX = (width - pad * 2) / (data.length - 1);
  const pts = data.map((d, i) => ({
    x: pad + i * stepX,
    y: height - pad - ((d.v - minV) / (maxV - minV)) * (height - pad * 2),
    ...d,
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${pts[pts.length - 1].x},${height - pad} L${pts[0].x},${height - pad} Z`;

  return (
    <div>
      <div className="flex justify-end mb-2">
        <span className="rounded-md border px-3 py-1 text-xs text-muted-foreground">May 1 – May 31 ▾</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#revFill)" />
        <path d={line} fill="none" stroke="#10b981" strokeWidth="2.5" />
        {pts.map((p) => (
          <g key={p.label}>
            <circle cx={p.x} cy={p.y} r="4" fill="#10b981" />
            <text x={p.x} y={height - 10} textAnchor="middle" className="fill-muted-foreground text-[10px]">
              {p.label}
            </text>
          </g>
        ))}
        {[200, 190, 180, 170, 160].map((tick) => {
          const y = height - pad - ((tick - minV) / (maxV - minV)) * (height - pad * 2);
          return (
            <text key={tick} x={pad - 8} y={y + 3} textAnchor="end" className="fill-muted-foreground text-[9px]">
              {tick}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function StatusDonut() {
  const segments = [
    { label: "Watermarked", value: 45, color: "#EF4444" },
    { label: "Enhanced", value: 25, color: "#3B82F6" },
    { label: "Clean/Paid", value: 30, color: "#10B981" },
  ];
  const radius = 60;
  const circ = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160" className="shrink-0">
        {segments.map((seg) => {
          const dash = (seg.value / 100) * circ;
          const el = (
            <circle key={seg.label} cx="80" cy="80" r={radius} fill="none" stroke={seg.color}
              strokeWidth="26" strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset} transform="rotate(-90 80 80)" />
          );
          offset += dash;
          return el;
        })}
        <text x="80" y="76" textAnchor="middle" className="fill-foreground font-bold text-xl">45%</text>
        <text x="80" y="94" textAnchor="middle" className="fill-muted-foreground text-[10px]">Enhanced</text>
      </svg>
      <div className="space-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span>{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const quickActions = [
  { label: "View Tasks", icon: ListTodo, href: "/user/print" },
  { label: "Enhance Document", icon: Sparkles, href: "/user/documents" },
  { label: "Add Customer", icon: UserPlus, href: "/user/settings" },
  { label: "View Reports", icon: FileBarChart, href: "/user/wallet" },
];

export default function CafeDashboardPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Dark sidebar — no Secure Documents entry */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-slate-950 text-slate-100">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 font-black text-white">
            C
          </div>
          <div>
            <div className="font-bold leading-tight">ABC Cyber</div>
            <div className="font-bold leading-tight">Cafe</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/cafe";
            return (
              <button
                key={item.label}
                onClick={() => router.push(item.href)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left",
                  isActive
                    ? "bg-emerald-600 text-white"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <button
            onClick={() => router.push("/")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 space-y-5">
        {/* Overview cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Icon className="h-4 w-4" /> {s.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{s.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts row */}
        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Document Status</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-4">
              <StatusDonut />
            </CardContent>
          </Card>
        </div>

        {/* Orders + quick actions */}
        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="pb-2 pr-3 font-medium">Order ID</th>
                    <th className="pb-2 pr-3 font-medium">Customer Name</th>
                    <th className="pb-2 pr-3 font-medium">Document Type</th>
                    <th className="pb-2 pr-3 font-medium">Status</th>
                    <th className="pb-2 pr-3 text-right font-medium">Amount</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id + o.date} className="border-b last:border-0">
                      <td className="py-2.5 pr-3 font-mono text-xs">{o.id}</td>
                      <td className="py-2.5 pr-3 font-medium">{o.customer}</td>
                      <td className="py-2.5 pr-3">{o.type}</td>
                      <td className="py-2.5 pr-3">
                        <span className={cn("rounded px-2 py-0.5 text-xs font-medium", statusStyles[o.status])}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono">{o.amount}</td>
                      <td className="py-2.5 text-xs text-muted-foreground">{o.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Quick Actions — Secure Documents / Upload Document removed */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => router.push(action.href)}
                    className="flex items-center gap-3 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                  >
                    <Icon className="h-4 w-4" /> {action.label}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
