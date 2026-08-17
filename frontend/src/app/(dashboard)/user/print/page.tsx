"use client";

import { useState } from "react";
import { Printer, Plus, Loader2 } from "lucide-react";
import { DocumentUploadWorkflow } from "@/components/documents/document-upload-workflow";
import { DocumentJobList } from "@/components/documents/document-job-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export default function PrintJobsPage() {
  const [showUpload, setShowUpload] = useState(false);
  const [jobRefreshKey, setJobRefreshKey] = useState(0);

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Printer className="h-8 w-8 text-primary" />
            Print Jobs
          </h1>
          <p className="text-muted-foreground mt-1">
            Submit documents to a nearby cyber cafe and track them until they are printed.
          </p>
        </div>
        <Button onClick={() => setShowUpload((v) => !v)} className={cn(showUpload && "hidden")}>
          <Plus className="h-4 w-4 mr-2" />
          New Print Job
        </Button>
      </div>

      <Alert variant="info">
        <Printer />
        <AlertTitle>How printing works</AlertTitle>
        <AlertDescription>
          Upload a document, choose a cafe, and release it with a secure PIN at the terminal.
          Jobs are charged on submission and refunded automatically if the print fails.
        </AlertDescription>
      </Alert>

      {showUpload && (
        <DocumentUploadWorkflow onComplete={() => setJobRefreshKey((k) => k + 1)} />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5" />
            Job tracking
          </CardTitle>
          <CardDescription>
            Monitor the status of your submitted print jobs in real time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentJobList refreshKey={jobRefreshKey} />
        </CardContent>
      </Card>
    </div>
  );
}
