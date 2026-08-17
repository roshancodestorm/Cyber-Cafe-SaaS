"use client";

import { useEffect } from "react";
import { Shield, Clock, Hash, Download, Printer, UserCheck } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DocumentServiceType, UploadDocumentConfig } from "@/types/document";
import { formatDuration } from "@/components/documents/document-utils";

const AUTO_DELETE_OPTIONS = [
  { value: "none", label: "No auto-delete" },
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "240", label: "4 hours" },
  { value: "1440", label: "24 hours" },
];

interface DocumentAccessSettingsProps {
  config: UploadDocumentConfig;
  onChange: (config: UploadDocumentConfig) => void;
  disabled?: boolean;
}

export function DocumentAccessSettings({
  config,
  onChange,
  disabled,
}: DocumentAccessSettingsProps) {
  const update = <K extends keyof UploadDocumentConfig>(
    key: K,
    value: UploadDocumentConfig[K]
  ) => {
    onChange({ ...config, [key]: value });
  };

  useEffect(() => {
    if (config.serviceType === "view" && config.allowPrint) {
      onChange({ ...config, allowPrint: false });
    }
  }, [config.serviceType]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <Alert variant="info">
        <Shield />
        <AlertTitle>Requests only — server enforces policy</AlertTitle>
        <AlertDescription>
          These settings express your preferences. The backend validates and applies the final access policy. Never assume permissions are granted until confirmed by the server.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service selection</CardTitle>
          <CardDescription>Choose how this document will be used at the cafe.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                { value: "view", label: "View only", desc: "Read on screen" },
                { value: "print", label: "Print", desc: "Send to print queue" },
                { value: "both", label: "View & print", desc: "Screen and print" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                onClick={() => update("serviceType", option.value as DocumentServiceType)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  config.serviceType === option.value
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:bg-muted/50"
                } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <p className="font-medium text-sm">{option.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{option.desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Access limits</CardTitle>
          <CardDescription>Control how long and how often the document can be opened.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="auto-delete" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Auto-delete duration
            </Label>
            <Select
              id="auto-delete"
              disabled={disabled}
              value={
                config.autoDeleteDurationMinutes === null
                  ? "none"
                  : String(config.autoDeleteDurationMinutes)
              }
              onChange={(e) => {
                const val = e.target.value;
                update("autoDeleteDurationMinutes", val === "none" ? null : Number(val));
              }}
            >
              {AUTO_DELETE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              Document will be permanently removed after {formatDuration(config.autoDeleteDurationMinutes).toLowerCase()}.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="max-opens" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Maximum open count
            </Label>
            <Input
              id="max-opens"
              type="number"
              min={1}
              max={100}
              placeholder="Unlimited"
              disabled={disabled}
              value={config.maxOpenCount ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                update("maxOpenCount", raw === "" ? null : Math.max(1, Number(raw)));
              }}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for unlimited opens. The server tracks and enforces the count.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permissions</CardTitle>
          <CardDescription>Request download, print, and approval settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="allow-download" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download permission
              </Label>
              <p className="text-xs text-muted-foreground">
                Request ability to download a copy.
              </p>
            </div>
            <Switch
              id="allow-download"
              checked={config.allowDownload}
              disabled={disabled}
              onCheckedChange={(checked) => update("allowDownload", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="allow-print" className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Print permission
              </Label>
              <p className="text-xs text-muted-foreground">
                Request ability to print this document.
              </p>
            </div>
            <Switch
              id="allow-print"
              checked={config.allowPrint}
              disabled={disabled || config.serviceType === "view"}
              onCheckedChange={(checked) => update("allowPrint", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="requires-approval" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Access approval requirement
              </Label>
              <p className="text-xs text-muted-foreground">
                Require cafe admin approval before access is granted.
              </p>
            </div>
            <Switch
              id="requires-approval"
              checked={config.requiresApproval}
              disabled={disabled}
              onCheckedChange={(checked) => update("requiresApproval", checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const defaultUploadConfig: UploadDocumentConfig = {
  serviceType: "view",
  autoDeleteDurationMinutes: 60,
  maxOpenCount: 3,
  allowDownload: false,
  allowPrint: false,
  requiresApproval: false,
};
