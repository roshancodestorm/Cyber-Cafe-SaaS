"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MonitorPlay, Users, Settings, LogOut, Printer, Wallet, Shield, Store, FileText, Key, ScrollText, AlertTriangle, Timer, Zap, Database, Globe, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

const adminRoutes = [
  { href: "/admin",             label: "Overview",      icon: LayoutDashboard },
  { href: "/admin/rbac",        label: "RBAC",          icon: Shield          },
  { href: "/admin/users",       label: "Users",         icon: Users           },
  { href: "/admin/cafes",       label: "Cafes",         icon: Store           },
  { href: "/admin/documents",   label: "Documents",     icon: FileText        },
  { href: "/admin/permissions", label: "Permissions",   icon: Key             },
  { href: "/admin/audit",       label: "Audit Logs",    icon: ScrollText      },
  { href: "/admin/security",    label: "Security",      icon: AlertTriangle   },
  { href: "/admin/expiration",  label: "Expiration",    icon: Timer           },
  { href: "/admin/queue",       label: "Queue / Redis", icon: Zap             },
  { href: "/admin/database",    label: "Database",      icon: Database        },
  { href: "/admin/api-monitor", label: "API Monitor",   icon: Globe           },
  { href: "/admin/health",      label: "System Health", icon: Heart           },
  { href: "/admin/settings",    label: "Settings",      icon: Settings        },
];

const userRoutes = [
  { href: "/user", label: "My Session", icon: LayoutDashboard },
  { href: "/user/documents", label: "Secure Documents", icon: Shield },
  { href: "/user/wallet", label: "Wallet", icon: Wallet },
  { href: "/user/print", label: "Print Jobs", icon: Printer },
  { href: "/user/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const routes = session?.user?.role === "admin" ? adminRoutes : userRoutes;

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/20">
      <div className="flex h-14 items-center border-b px-4 font-semibold">
        <MonitorPlay className="mr-2 h-5 w-5 text-primary" />
        Cyber SaaS
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-2">
          {routes.map((route) => {
            const Icon = route.icon;
            const isActive =
              pathname === route.href ||
              (route.href !== "/user" && pathname.startsWith(`${route.href}/`));
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {route.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t p-4">
        <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={() => signOut({ callbackUrl: '/' })}>
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
