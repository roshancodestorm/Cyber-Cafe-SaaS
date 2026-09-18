"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/lib/store/use-session-store";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Clock,
  Shield,
  Settings,
  Wallet,
  MonitorPlay,
  History,
  Printer,
  TrendingUp,
  BarChart3,
  Folder,
  Users,
  Upload,
  Sparkles,
  FileBarChart,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import Link from "next/link";

const navItems = [
  { href: "/user", label: "My Session", icon: MonitorPlay },
  { href: "/user/documents", label: "Secure Documents", icon: Shield },
  { href: "/user/wallet", label: "Wallet", icon: Wallet },
  { href: "/user/print", label: "Print Jobs", icon: Printer },
  { href: "/user/settings", label: "Settings", icon: Settings },
];

// Donut chart built with SVG strokes (no chart library needed)
function StatusDonut() {
  const segments = [
    { label: "Watermarked", value: 45, color: "#EF4444" },
    { label: "Enhanced", value: 25, color: "#F59E0B" },
    { label: "Clean/Paid", value: 30, color: "#10B981" },
  ];
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width="150" height="150" viewBox="0 0 160 160" className="shrink-0">
        {segments.map((seg) => {
          const dash = (seg.value / 100) * circumference;
          const el = (
            <circle
              key={seg.label}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="24"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 80 80)"
            />
          );
          offset += dash;
          return el;
        })}
        <text x="80" y="76" textAnchor="middle" className="fill-foreground font-bold text-lg">
          100%
        </text>
        <text x="80" y="94" textAnchor="middle" className="fill-muted-foreground text-xs">
          Documents
        </text>
      </svg>
      <div className="space-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-muted-foreground">
              {seg.label} <span className="font-semibold text-foreground">{seg.value}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Simple SVG line chart for revenue (May 1 – May 31)
function RevenueChart() {
  const data = [
    { date: "May 1", revenue: 89 },
    { date: "May 5", revenue: 125 },
    { date: "May 10", revenue: 97 },
    { date: "May 15", revenue: 142 },
    { date: "May 20", revenue: 118 },
    { date: "May 25", revenue: 135 },
    { date: "May 31", revenue: 167 },
  ];
  const width = 560;
  const height = 180;
  const pad = 28;
  const maxVal = Math.max(...data.map((d) => d.revenue)) * 1.15;
  const stepX = (width - pad * 2) / (data.length - 1);

  const points = data.map((d, i) => ({
    x: pad + i * stepX,
    y: height - pad - (d.revenue / maxVal) * (height - pad * 2),
    ...d,
  }));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <path d={path} fill="none" stroke="#6366f1" strokeWidth="2.5" />
        {points.map((p) => (
          <g key={p.date}>
            <circle cx={p.x} cy={p.y} r="4" fill="#6366f1" />
            <text x={p.x} y={height - 8} textAnchor="middle" className="fill-muted-foreground text-[10px]">
              {p.date}
            </text>
            <text x={p.x} y={p.y - 10} textAnchor="middle" className="fill-muted-foreground text-[10px]">
              ₹{p.revenue}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

const recentOrders = [
  { id: "ORD-2024-0512", customer: "John Doe", type: "Document Printing", status: "Pending", amount: "₹45.00", date: "May 24, 2024" },
  { id: "ORD-2024-0515", customer: "Jane Smith", type: "Scan & OCR", status: "Completed", amount: "₹28.50", date: "May 22, 2024" },
  { id: "ORD-2024-0518", customer: "Bob Wilson", type: "Watermark Removal", status: "Processing", amount: "₹10.00", date: "May 19, 2024" },
];

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Completed: "bg-green-500/10 text-green-600 dark:text-green-400",
  Processing: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

export default function UserDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { session: activeSession, startSession } = useSessionStore();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/login?from=%2Fuser");
      return;
    }
    const role = (session.user as any)?.role;
    if (role === "admin") {
      router.replace("/admin");
    }
  }, [status, session, router]);

  if (status === "loading" || !session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  const role = (session.user as any)?.role;
  if (role === "admin") return null;

  const stats = [
    { title: "Today's Orders", value: "12", icon: BarChart3 },
    { title: "Documents Processed", value: "47", icon: Folder },
    { title: "Total Revenue", value: "₹3,450", icon: TrendingUp },
    { title: "Active Customers", value: "89", icon: Users },
  ];

  const firstName = session?.user?.name?.split(" ")[0] || "User";
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Navigation bar */}
      <nav className="grid grid-cols-2 sm:grid-cols-5 gap-2 border-b pb-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                "bg-primary/10 text-primary hover:bg-primary/20"
              )}
            >
              <Icon className="mr-2 inline h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {firstName} 👋</h1>
          <p className="text-muted-foreground text-sm">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary">
          {initial}
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{s.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" /> Revenue Overview (May 1 – May 31)
            </CardTitle>
            <CardDescription>Daily revenue in ₹</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Folder className="h-4 w-4" /> Document Status
            </CardTitle>
            <CardDescription>Watermark / enhancement breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusDonut />
          </CardContent>
        </Card>
      </div>

      {/* Recent orders + quick actions */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" /> Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b">
                  <th className="pb-2 pr-3 font-medium">Order ID</th>
                  <th className="pb-2 pr-3 font-medium">Customer</th>
                  <th className="pb-2 pr-3 font-medium">Type</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 pr-3 text-right font-medium">Amount</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-b last:border-0">
                    <td className="py-2.5 pr-3 font-mono text-xs">{o.id}</td>
                    <td className="py-2.5 pr-3">{o.customer}</td>
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

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Common tasks, one click away</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/user/documents")}>
              <Upload className="h-4 w-4 mr-2" /> Upload Document
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/user")}>
              <Sparkles className="h-4 w-4 mr-2" /> Enhance Document
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/user/wallet")}>
              <Wallet className="h-4 w-4 mr-2" /> Wallet
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/user/print")}>
              <FileBarChart className="h-4 w-4 mr-2" /> Reports
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Session cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className={activeSession.isActive ? "border-primary shadow-md shadow-primary/10" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Session</CardTitle>
            <MonitorPlay className={activeSession.isActive ? "h-4 w-4 text-primary" : "h-4 w-4 text-muted-foreground"} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeSession.isActive ? `Terminal ${activeSession.pcNumber}` : "None"}
            </div>
            {!activeSession.isActive && (
              <Button variant="link" className="px-0 mt-1 h-auto text-primary" onClick={() => startSession(14, 5)}>
                Start mock session
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Remaining</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {activeSession.isActive
                ? `${Math.floor(activeSession.timeRemainingMinutes / 60)}h ${activeSession.timeRemainingMinutes % 60}m`
                : "0h 0m"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">₹{activeSession.balance.toFixed(2)}</div>
            <Button size="sm" variant="outline" className="mt-2 w-full">Top Up</Button>
          </CardContent>
        </Card>
      </div>

      {/* Empty states */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" /> Recent Sessions
            </CardTitle>
            <CardDescription>Your last 5 terminal sessions.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState title="No recent sessions" description="You haven't logged into any terminals recently." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" /> Recent Transactions
            </CardTitle>
            <CardDescription>Your latest wallet top-ups and deductions.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState title="No transactions" description="Your transaction history is currently empty." />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
