"use client";

import { useSessionStore } from "@/lib/store/use-session-store";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Wallet, MonitorPlay, History } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default function UserDashboardPage() {
  const { data: session } = useSession();
  const { session: activeSession, startSession } = useSessionStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {session?.user?.name?.split(' ')[0] || "User"}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className={activeSession.isActive ? "border-primary shadow-md shadow-primary/10" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Session</CardTitle>
            <MonitorPlay className={`h-4 w-4 ${activeSession.isActive ? "text-primary" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeSession.isActive ? `Terminal ${activeSession.pcNumber}` : "None"}
            </div>
            {!activeSession.isActive && (
              <Button 
                variant="link" 
                className="px-0 mt-1 h-auto text-primary"
                onClick={() => startSession(14, 5)}
              >
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
              {activeSession.isActive ? `${Math.floor(activeSession.timeRemainingMinutes / 60)}h ${activeSession.timeRemainingMinutes % 60}m` : "0h 0m"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              ${activeSession.balance.toFixed(2)}
            </div>
            <Button size="sm" variant="outline" className="mt-2 w-full">Top Up</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><History className="w-5 h-5" /> Recent Sessions</CardTitle>
            <CardDescription>Your last 5 terminal sessions.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState 
              title="No recent sessions" 
              description="You haven't logged into any terminals recently."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wallet className="w-5 h-5" /> Recent Transactions</CardTitle>
            <CardDescription>Your latest wallet top-ups and deductions.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState 
              title="No transactions" 
              description="Your transaction history is currently empty."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
