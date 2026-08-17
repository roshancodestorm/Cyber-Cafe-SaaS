"use client";

import { useState } from "react";
import { Shield, FileStack } from "lucide-react";
import { DocumentUploadWorkflow } from "@/components/documents/document-upload-workflow";
import { DocumentJobList } from "@/components/documents/document-job-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DocumentsPage() {
  const [jobRefreshKey, setJobRefreshKey] = useState(0);

  return (
    <div className="space-y-8 max-w-4xl">
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
