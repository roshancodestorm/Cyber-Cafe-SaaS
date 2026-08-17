"use client";

import { useCallback, useRef, useState } from "react";
import { FileUp, FileText, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE_MB = 25;

interface DocumentUploadProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

export function DocumentUpload({ file, onFileSelect, disabled }: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = useCallback((candidate: File): string | null => {
    if (candidate.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File exceeds the ${MAX_FILE_SIZE_MB} MB limit.`;
    }
    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      return "Unsupported file type. Use PDF, PNG, JPG, WEBP, or DOC/DOCX.";
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (candidate: File | null) => {
      if (!candidate) {
        onFileSelect(null);
        setError(null);
        return;
      }

      const validationError = validateFile(candidate);
      if (validationError) {
        setError(validationError);
        onFileSelect(null);
        return;
      }

      setError(null);
      onFileSelect(candidate);
    },
    [onFileSelect, validateFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [disabled, handleFile]
  );

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload document"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-primary/20 bg-primary/5 hover:border-primary/40",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        <div className="p-4 bg-background rounded-full shadow-sm mb-4">
          <FileUp className="w-10 h-10 text-primary" />
        </div>
        <h3 className="font-semibold text-lg">Drop your file here</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Or click to browse. Files are encrypted in transit. Final access policy is enforced by the server.
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          PDF, images, DOC/DOCX · Max {MAX_FILE_SIZE_MB} MB
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ACCEPTED_TYPES.join(",")}
          disabled={disabled}
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {file && (
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <div className="p-2 rounded-lg bg-muted">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type || "Unknown type"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              handleFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
