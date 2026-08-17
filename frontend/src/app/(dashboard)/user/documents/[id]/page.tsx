"use client";

import Link from "next/link";
import { use } from "react";
import { ArrowLeft, Shield } from "lucide-react";
import { DocumentViewer } from "@/components/documents/document-viewer";
import { Button } from "@/components/ui/button";

interface DocumentViewerPageProps {
  params: Promise<{ id: string }>;
}

export default function DocumentViewerPage({ params }: DocumentViewerPageProps) {
  const { id } = use(params);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link href="/user/documents">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to documents
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Secure Document Viewer
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          View-only when the server denies download or print. No private contact information is shown.
        </p>
      </div>

      <DocumentViewer documentId={id} />
    </div>
  );
}
