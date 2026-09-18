"use client";

import { useState } from "react";
import { Shield, FileStack, MonitorPlay, Wallet, Printer, Settings } from "lucide-react";
import { DocumentUploadWorkflow } from "@/components/documents/document-upload-workflow";
import { DocumentJobList } from "@/components/documents/document-job-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function DocumentsPage() {
  const [jobRefreshKey, setJobRefreshKey] = useState(0);

  return (
    <div className="space-y-8 max-w-4xl">
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
          <Shield className="h-8 w-8 text-primary" />
          Secure Documents
        </h1>
        <p className="text-muted-foreground mt-1">
          Upload, configure access policy, and track your secure document jobs.
        </p>
      </div>

      <Alert variant="info">
        <Shield />
        <AlertTitle>Security notice</AlertTitle>
        <AlertDescription>
          This interface never assumes security. All permissions — view, download, print, and approval — are enforced by the backend. Status messages reflect server responses only.
        </AlertDescription>
      </Alert>

      <DocumentUploadWorkflow onComplete={() => setJobRefreshKey((k) => k + 1)} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileStack className="h-5 w-5" />
            Job tracking
          </CardTitle>
          <CardDescription>
            Monitor upload, processing, and delivery status for your documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentJobList refreshKey={jobRefreshKey} />
        </CardContent>
      </Card>
    </div>
  );
}
