"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, ExternalLink, Loader2, FileStack } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { DocumentJob } from "@/types/document";
import { DocumentStatusBadge } from "@/components/documents/document-utils";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DocumentJobListProps {
  refreshKey?: number;
}

export function DocumentJobList({ refreshKey = 0 }: DocumentJobListProps) {
  const [jobs, setJobs] = useState<DocumentJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getDocumentJobs();
      setJobs(data);
    } catch {
      setError("Unable to load document jobs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs, refreshKey]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={loadJobs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={<FileStack className="h-8 w-8 text-muted-foreground" />}
        title="No document jobs"
        description="Upload and send a document to track its processing status here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {jobs.length} job{jobs.length === 1 ? "" : "s"}
        </p>
        <Button variant="ghost" size="sm" onClick={loadJobs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Updated</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>
                  <div>
                    <p className="font-medium truncate max-w-[200px]">{job.documentName}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                      {job.message}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="capitalize">{job.serviceType}</TableCell>
                <TableCell>
                  <DocumentStatusBadge status={job.status} />
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                  {new Date(job.updatedAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {(job.status === "ready" || job.status === "completed") && (
                    <Link href={`/user/documents/${job.documentId}`}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
