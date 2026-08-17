export type DocumentServiceType = "view" | "print" | "both";

export type DocumentStatus =
  | "pending"
  | "processing"
  | "ready"
  | "expired"
  | "deleted"
  | "failed";

export type DocumentJobStatus =
  | "pending"
  | "processing"
  | "ready"
  | "completed"
  | "failed"
  | "expired";

export type ApprovalStatus = "pending" | "approved" | "rejected";

/** User-requested settings only — backend validates and enforces the final policy. */
export interface UploadDocumentConfig {
  serviceType: DocumentServiceType;
  autoDeleteDurationMinutes: number | null;
  maxOpenCount: number | null;
  allowDownload: boolean;
  allowPrint: boolean;
  requiresApproval: boolean;
}

export interface UploadDocumentResponse {
  success: boolean;
  documentId: string;
  jobId: string;
  status: DocumentStatus;
  message: string;
}

/** Backend-authoritative document state — never trust client-side permission flags. */
export interface DocumentDetails {
  id: string;
  name: string;
  status: DocumentStatus;
  canView: boolean;
  canPrint: boolean;
  canDownload: boolean;
  requiresApproval: boolean;
  approvalStatus?: ApprovalStatus;
  openCount: number;
  maxOpenCount: number | null;
  expiresAt: string | null;
  previewUrl: string | null;
  message: string;
  mimeType?: string;
}

export interface DocumentJob {
  id: string;
  documentId: string;
  documentName: string;
  serviceType: DocumentServiceType;
  status: DocumentJobStatus;
  createdAt: string;
  updatedAt: string;
  message: string;
}

export interface SecureSendResponse {
  success: boolean;
  jobId: string;
  documentId: string;
  status: DocumentJobStatus;
  message: string;
}

export type DocumentWorkflowStep =
  | "upload"
  | "preview"
  | "configure"
  | "confirm"
  | "complete";
