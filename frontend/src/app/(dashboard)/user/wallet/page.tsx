"use client";

import { useState } from "react";
import {
  Wallet,
  Clock,
  Plus,
  History,
  CheckCircle2,
  MonitorPlay,
  Shield,
  Printer,
  Settings,
} from "lucide-react";
import { useSessionStore } from "@/lib/store/use-session-store";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

const QUICK_TOPUPS = [1, 5, 10, 20];

export default function WalletPage() {
  const { session, addBalance } = useSessionStore();
  const [lastTopUp, setLastTopUp] = useState<number | null>(null);

  const handleTopUp = (amount: number) => {
    addBalance(amount);
    setLastTopUp(amount);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Navigation Bar - Two groups of options */}
      <div className="border-b pb-4 mb-6">
        <nav className="grid grid-cols-2 gap-2">
          <Link
            href="/user"
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              "bg-primary/10 text-primary hover:bg-primary/20"
            )}
          >
            <MonitorPlay className="mr-2 h-4 w-4" />
            My Session
          </Link>
          <Link
            href="/user/documents"
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              "bg-primary/10 text-primary hover:bg-primary/20"
            )}
          >
            <Shield className="mr-2 h-4 w-4" />
            Secure Documents
          </Link>
          <Link
            href="/user/wallet"
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              "bg-primary/10 text-primary hover:bg-primary/20"
            )}
          >
            <Wallet className="mr-2 h-4 w-4" />
            Wallet
          </Link>
          <Link
            href="/user/print"
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              "bg-primary/10 text-primary hover:bg-primary/20"
            )}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Jobs
          </Link>
          <Link
            href="/user/settings"
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              "bg-primary/10 text-primary hover:bg-primary/20"
            )}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </nav>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Wallet className="h-8 w-8 text-primary" />
          Wallet
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your balance, top up for terminal sessions, and review your transaction history.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <CardDescription>Available for sessions and print jobs.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono tracking-tight">
              ${session.balance.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              ≈ {Math.floor(session.balance * 60)} minutes of session time
            </div>
            {lastTopUp !== null && (
              <div className="flex items-center gap-1.5 mt-4 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                Added ${lastTopUp.toFixed(2)} to your balance.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quick Top Up</CardTitle>
            <CardDescription>Choose an amount to add instantly.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_TOPUPS.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  className="h-12 text-base font-semibold"
                  onClick={() => handleTopUp(amount)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  ${amount}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>
            Your latest wallet top-ups and session deductions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Wallet className="h-8 w-8 text-muted-foreground" />}
            title="No transactions yet"
            description="Top up your wallet to get started. Your transaction history will appear here."
          />
          <Separator className="my-6" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Wallet status</span>
            <Badge variant="secondary">Active</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
