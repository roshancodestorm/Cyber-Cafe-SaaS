"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Shield,
  Download,
  Printer,
  Eye,
  Loader2,
  AlertCircle,
  Clock,
  Hash,
  UserCheck,
  Lock,
  RefreshCw,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { DocumentDetails } from "@/types/document";
import { DocumentStatusBadge, formatExpiry } from "@/components/documents/document-utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DocumentViewerProps {
  documentId: string;
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function DocumentViewer({ documentId }: DocumentViewerProps) {
  const [doc, setDoc] = useState<DocumentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibilityWarning, setVisibilityWarning] = useState(false);

  const loadDocument = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const details = await apiClient.getDocumentDetails(documentId);
      setDoc(details);
    } catch {
      setError("Unable to load document. Access may be denied or the document may no longer exist.");
      setDoc(null);
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  useEffect(() => {
    const handleVisibility = () => {
      if (doc && !doc.canDownload && doc.status === "ready") {
        setVisibilityWarning(window.document.visibilityState === "hidden");
      }
    };
    window.document.addEventListener("visibilitychange", handleVisibility);
    return () => window.document.removeEventListener("visibilitychange", handleVisibility);
  }, [doc]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!doc?.canDownload || !doc?.canPrint) {
      e.preventDefault();
    }
  }, [doc]);

  const handleCopy = useCallback((e: React.ClipboardEvent) => {
    if (!doc?.canDownload) {
      e.preventDefault();
    }
  }, [doc]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!doc?.canDownload) {
        if (
          (e.ctrlKey || e.metaKey) &&
          ["c", "s", "p", "u", "a"].includes(e.key.toLowerCase())
        ) {
          e.preventDefault();
        }
      }
      if (!doc?.canPrint && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
      }
    },
    [doc]
  );

  const handleDownload = () => {
    if (!doc?.canDownload || !doc.previewUrl) return;
    window.open(doc.previewUrl, "_blank", "noopener,noreferrer");
  };

  const handlePrint = () => {
    if (!doc?.canPrint) return;
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading secure document...</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Access unavailable</AlertTitle>
          <AlertDescription>{error ?? "Document not found."}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={loadDocument}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const isBlocked =
    doc.status === "expired" ||
    doc.status === "deleted" ||
    doc.status === "failed" ||
    !doc.canView ||
    (doc.requiresApproval && doc.approvalStatus !== "approved");

  const opensRemaining =
    doc.maxOpenCount !== null
      ? Math.max(0, doc.maxOpenCount - doc.openCount)
      : null;

  const viewerProtected = !doc.canDownload || !doc.canPrint;

  return (
    <div
      className={cn("space-y-6", viewerProtected && "select-none")}
      onContextMenu={handleContextMenu}
      onCopy={handleCopy}
      onKeyDown={handleKeyDown}
    >
      {visibilityWarning && (
        <Alert variant="warning">
          <AlertCircle />
          <AlertTitle>Tab switch detected</AlertTitle>
          <AlertDescription>
            This document is view-only. Leaving or screenshotting this tab may be logged by the cafe's security policy.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold truncate">{doc.name}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DocumentStatusBadge status={doc.status} />
            {doc.requiresApproval && doc.approvalStatus && (
              <Badge variant={doc.approvalStatus === "approved" ? "default" : "secondary"}>
                Approval: {doc.approvalStatus}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {doc.canDownload && (
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={!doc.previewUrl}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
          {doc.canPrint && (
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          )}
          {!doc.canDownload && !doc.canPrint && (
            <Badge variant="outline" className="gap-1">
              <Lock className="h-3 w-3" />
              View only
            </Badge>
          )}
        </div>
      </div>

      <Alert variant={isBlocked ? "destructive" : "info"}>
        <Eye />
        <AlertTitle>{isBlocked ? "Access restricted" : "Server-enforced access"}</AlertTitle>
        <AlertDescription>{doc.message}</AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetaItem icon={Hash} label="Opens used" value={String(doc.openCount)} />
        <MetaItem
          icon={Hash}
          label="Opens remaining"
          value={opensRemaining === null ? "Unlimited" : String(opensRemaining)}
        />
        <MetaItem icon={Clock} label="Expires" value={formatExpiry(doc.expiresAt)} />
        {doc.requiresApproval && (
          <MetaItem
            icon={UserCheck}
            label="Approval"
            value={doc.approvalStatus ?? "Not required"}
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Secure viewer</CardTitle>
          <CardDescription>
            Content is loaded only from server-authorized URLs. Permissions are enforced by the backend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isBlocked ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/20">
              <Lock className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">Document cannot be displayed</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                {doc.status === "expired" && "This document has expired and was auto-deleted."}
                {doc.status === "deleted" && "This document has been permanently removed."}
                {doc.status === "failed" && "Processing failed. Please re-upload the document."}
                {doc.requiresApproval &&
                  doc.approvalStatus === "pending" &&
                  "Waiting for cafe admin approval before viewing is allowed."}
                {doc.requiresApproval &&
                  doc.approvalStatus === "rejected" &&
                  "Access was rejected by the cafe admin."}
                {!doc.canView &&
                  doc.status === "ready" &&
                  "View permission was not granted by the server."}
              </p>
            </div>
          ) : doc.previewUrl ? (
            <div className="rounded-lg border overflow-hidden bg-muted/10 relative">
              {!doc.canDownload && (
                <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.02] bg-[repeating-linear-gradient(45deg,#000_0,#000_1px,transparent_1px,transparent_8px)]" />
              )}
              {doc.mimeType?.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={doc.previewUrl}
                  alt={doc.name}
                  className={cn(
                    "w-full max-h-[600px] object-contain mx-auto",
                    !doc.canDownload && "pointer-events-none"
                  )}
                  draggable={doc.canDownload}
                />
              ) : (
                <iframe
                  src={doc.previewUrl}
                  title={doc.name}
                  className="w-full h-[600px] border-0"
                  sandbox="allow-scripts allow-same-origin"
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/20">
              <Eye className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">Preview URL not yet available</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                The server has not issued a preview URL for this document. This is normal while processing is in progress or when view access is pending approval.
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={loadDocument}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Check again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <p className="text-xs text-muted-foreground text-center">
        All access controls are enforced server-side. Download and print actions require explicit backend authorization.
      </p>
    </div>
  );
}
