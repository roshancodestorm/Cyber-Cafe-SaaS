"use client";

import { useEffect, useState } from "react";
import { Eye, FileText, ImageIcon, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DocumentPreviewProps {
  file: File;
}

function isImageType(type: string): boolean {
  return type.startsWith("image/");
}

export function DocumentPreview({ file }: DocumentPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  useEffect(() => {
    if (previewUrl) setIsLoading(false);
  }, [previewUrl]);

  const isImage = isImageType(file.type);
  const isPdf = file.type === "application/pdf";

  return (
    <div className="space-y-4">
      <Alert variant="info">
        <Eye />
        <AlertTitle>Local preview only</AlertTitle>
        <AlertDescription>
          This preview is generated on your device before upload. The secure viewer will load content only from server-authorized URLs after processing.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {isImage ? (
              <ImageIcon className="h-4 w-4" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {file.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative min-h-[280px] rounded-lg border bg-muted/30 flex items-center justify-center overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {isImage && previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={`Preview of ${file.name}`}
                className="max-h-[400px] w-auto object-contain"
                onLoad={() => setIsLoading(false)}
              />
            )}

            {isPdf && previewUrl && (
              <iframe
                src={previewUrl}
                title={`Preview of ${file.name}`}
                className="w-full h-[400px] border-0"
                onLoad={() => setIsLoading(false)}
              />
            )}

            {!isImage && !isPdf && (
              <div className="text-center p-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">Preview unavailable for this file type</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {file.name} will be processed securely after upload.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
