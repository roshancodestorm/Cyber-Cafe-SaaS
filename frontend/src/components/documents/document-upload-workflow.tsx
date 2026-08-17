"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Eye,
  Settings2,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { DocumentWorkflowStep, UploadDocumentConfig } from "@/types/document";
import { DocumentUpload } from "@/components/documents/document-upload";
import { DocumentPreview } from "@/components/documents/document-preview";
import {
  DocumentAccessSettings,
  defaultUploadConfig,
} from "@/components/documents/document-access-settings";
import { SecureSendConfirmation } from "@/components/documents/secure-send-confirmation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STEPS: { id: DocumentWorkflowStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "upload", label: "Upload", icon: Upload },
  { id: "preview", label: "Preview", icon: Eye },
  { id: "configure", label: "Configure", icon: Settings2 },
  { id: "confirm", label: "Confirm", icon: ShieldCheck },
  { id: "complete", label: "Done", icon: CheckCircle2 },
];

interface DocumentUploadWorkflowProps {
  onComplete?: () => void;
}

export function DocumentUploadWorkflow({ onComplete }: DocumentUploadWorkflowProps) {
  const router = useRouter();
  const [step, setStep] = useState<DocumentWorkflowStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [config, setConfig] = useState<UploadDocumentConfig>(defaultUploadConfig);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);

  const currentIndex = STEPS.findIndex((s) => s.id === step);

  const canProceed = (): boolean => {
    switch (step) {
      case "upload":
        return file !== null;
      case "preview":
      case "configure":
      case "confirm":
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    const next = STEPS[currentIndex + 1];
    if (next) setStep(next.id);
  };

  const goBack = () => {
    const prev = STEPS[currentIndex - 1];
    if (prev) setStep(prev.id);
  };

  const handleSubmit = async () => {
    if (!file) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const uploadResult = await apiClient.uploadDocument(file, config);
      const sendResult = await apiClient.sendDocumentSecurely(
        uploadResult.documentId,
        config
      );

      setDocumentId(uploadResult.documentId);
      setResultMessage(sendResult.message);
      setStep("complete");
      onComplete?.();
    } catch {
      setError("Secure send failed. The server did not confirm the upload. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetWorkflow = () => {
    setStep("upload");
    setFile(null);
    setConfig(defaultUploadConfig);
    setError(null);
    setResultMessage(null);
    setDocumentId(null);
  };

  return (
    <div className="space-y-6">
      <nav aria-label="Workflow progress" className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, index) => {
          const Icon = s.icon;
          const isActive = s.id === step;
          const isComplete = index < currentIndex;

          return (
            <div key={s.id} className="flex items-center shrink-0">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive && "bg-primary text-primary-foreground",
                  isComplete && !isActive && "text-primary",
                  !isActive && !isComplete && "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {index < STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground mx-1 shrink-0" />
              )}
            </div>
          );
        })}
      </nav>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Action failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {step === "upload" && "Upload document"}
            {step === "preview" && "Preview file"}
            {step === "configure" && "Configure access"}
            {step === "confirm" && "Secure send confirmation"}
            {step === "complete" && "Document sent"}
          </CardTitle>
          <CardDescription>
            {step === "upload" && "Select a file to upload securely."}
            {step === "preview" && "Review your file before configuring access."}
            {step === "configure" && "Set service type, limits, and permission requests."}
            {step === "confirm" && "Review and confirm before the server applies policy."}
            {step === "complete" && "Your document has been submitted for secure processing."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "upload" && (
            <DocumentUpload file={file} onFileSelect={setFile} disabled={isSubmitting} />
          )}
          {step === "preview" && file && <DocumentPreview file={file} />}
          {step === "configure" && (
            <DocumentAccessSettings
              config={config}
              onChange={setConfig}
              disabled={isSubmitting}
            />
          )}
          {step === "confirm" && file && (
            <SecureSendConfirmation fileName={file.name} config={config} />
          )}
          {step === "complete" && (
            <div className="space-y-4 text-center py-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <Alert variant="success">
                <AlertTitle>Secure send complete</AlertTitle>
                <AlertDescription>{resultMessage}</AlertDescription>
              </Alert>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                {documentId && (
                  <Button onClick={() => router.push(`/user/documents/${documentId}`)}>
                    Open secure viewer
                  </Button>
                )}
                <Button variant="outline" onClick={resetWorkflow}>
                  Send another document
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {step !== "complete" && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={currentIndex === 0 || isSubmitting}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {step === "confirm" ? (
            <Button onClick={handleSubmit} disabled={isSubmitting || !file}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm secure send
            </Button>
          ) : (
            <Button onClick={goNext} disabled={!canProceed() || isSubmitting}>
              Continue
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
