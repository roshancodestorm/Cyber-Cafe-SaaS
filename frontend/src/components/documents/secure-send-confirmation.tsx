"use client";

import {
  ShieldCheck,
  FileText,
  Clock,
  Hash,
  Download,
  Printer,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { UploadDocumentConfig } from "@/types/document";
import { formatDuration } from "@/components/documents/document-utils";

const SERVICE_LABELS: Record<UploadDocumentConfig["serviceType"], string> = {
  view: "View only",
  print: "Print",
  both: "View & print",
};

interface SecureSendConfirmationProps {
  fileName: string;
  config: UploadDocumentConfig;
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

export function SecureSendConfirmation({ fileName, config }: SecureSendConfirmationProps) {
  return (
    <div className="space-y-4">
      <Alert variant="warning">
        <AlertTriangle />
        <AlertTitle>Confirm secure send</AlertTitle>
        <AlertDescription>
          Review your settings before sending. Once submitted, the server applies the access policy. You cannot change permissions from the client after send — contact the cafe admin if changes are needed.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Secure send summary
          </CardTitle>
          <CardDescription>
            Verify the document and access policy below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SummaryRow icon={FileText} label="Document" value={fileName} />
          <Separator />
          <SummaryRow
            icon={ShieldCheck}
            label="Service"
            value={SERVICE_LABELS[config.serviceType]}
          />
          <SummaryRow
            icon={Clock}
            label="Auto-delete"
            value={formatDuration(config.autoDeleteDurationMinutes)}
          />
          <SummaryRow
            icon={Hash}
            label="Maximum opens"
            value={config.maxOpenCount === null ? "Unlimited" : String(config.maxOpenCount)}
          />
          <SummaryRow
            icon={Download}
            label="Download requested"
            value={config.allowDownload ? "Yes" : "No"}
          />
          <SummaryRow
            icon={Printer}
            label="Print requested"
            value={config.allowPrint ? "Yes" : "No"}
          />
          <SummaryRow
            icon={UserCheck}
            label="Approval required"
            value={config.requiresApproval ? "Yes — admin must approve" : "No"}
          />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        By confirming, you authorize encrypted upload and server-side policy enforcement. No private contact information is shared with recipients.
      </p>
    </div>
  );
}
