/**
 * API Abstraction Layer
 *
 * This file serves as the single source of truth for all external API calls.
 * Team 2 / Team 3 will replace the mock implementations below with real fetch/axios calls
 * to the backend once the backend is ready.
 *
 * IMPORTANT: Do NOT implement OAuth or security verification here.
 * The backend MUST verify all authentication tokens and enforce all permissions.
 */

import type {
  DocumentDetails,
  DocumentJob,
  SecureSendResponse,
  UploadDocumentConfig,
  UploadDocumentResponse,
} from "@/types/document";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const mockJobs: DocumentJob[] = [
  {
    id: "job_001",
    documentId: "doc_sample_001",
    documentName: "Tax_Return_2025.pdf",
    serviceType: "print",
    status: "completed",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 82800000).toISOString(),
    message: "Printed successfully at Terminal 04.",
  },
  {
    id: "job_002",
    documentId: "doc_sample_002",
    documentName: "Application_Form.pdf",
    serviceType: "view",
    status: "ready",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    message: "Document is ready for secure viewing.",
  },
  {
    id: "job_003",
    documentId: "doc_sample_003",
    documentName: "Contract_Signing_Draft.pdf",
    serviceType: "both",
    status: "pending",
    createdAt: new Date(Date.now() - 600000).toISOString(),
    updatedAt: new Date(Date.now() - 300000).toISOString(),
    message: "Awaiting cafe admin approval before access is granted.",
  },
];

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const apiClient = {
  /**
   * CAFE REGISTRATION
   */
  registerCafe: async (data: Record<string, FormDataEntryValue>) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Mock Register Cafe Payload:", data);
    return { success: true, message: "Registration pending approval." };
  },

  /**
   * DOCUMENTS & JOBS
   */
  uploadDocument: async (
    file: File,
    config: UploadDocumentConfig
  ): Promise<UploadDocumentResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("Mock Upload:", file.name, config);

    const documentId = generateId("doc");
    const jobId = generateId("job");

    mockJobs.unshift({
      id: jobId,
      documentId,
      documentName: file.name,
      serviceType: config.serviceType,
      status: "processing",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      message: "Document uploaded. Processing encryption and access policy.",
    });

    return {
      success: true,
      documentId,
      jobId,
      status: "processing",
      message: "Document uploaded securely. Processing will complete shortly.",
    };
  },

  getDocumentDetails: async (docId: string): Promise<DocumentDetails> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const job = mockJobs.find((j) => j.documentId === docId);
    const name = job?.documentName ?? "Secure_Contract.pdf";

    if (docId.endsWith("_001")) {
      return {
        id: docId,
        name,
        status: "ready",
        canView: true,
        canPrint: true,
        canDownload: true,
        requiresApproval: false,
        approvalStatus: undefined,
        openCount: 2,
        maxOpenCount: 5,
        expiresAt: new Date(Date.now() + 7200000).toISOString(),
        previewUrl:
          "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
        message:
          "Full access granted. Download and print are enabled by the document owner policy.",
        mimeType: "application/pdf",
      };
    }

    if (docId.endsWith("_003")) {
      return {
        id: docId,
        name,
        status: "ready",
        canView: true,
        canPrint: true,
        canDownload: false,
        requiresApproval: true,
        approvalStatus: "pending",
        openCount: 0,
        maxOpenCount: null,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        previewUrl: null,
        message:
          "Waiting for cafe admin approval before access is granted. Print has been requested but requires approval.",
        mimeType: "application/pdf",
      };
    }

    return {
      id: docId,
      name,
      status: "ready",
      canView: true,
      canPrint: false,
      canDownload: false,
      requiresApproval: true,
      approvalStatus: "approved",
      openCount: 1,
      maxOpenCount: 3,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      previewUrl:
        "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
      message:
        "View-only access. Download and print are disabled by the document owner policy.",
      mimeType: "application/pdf",
    };
  },

  getDocumentJobs: async (): Promise<DocumentJob[]> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return [...mockJobs];
  },

  sendDocumentSecurely: async (
    documentId: string,
    config: UploadDocumentConfig
  ): Promise<SecureSendResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    console.log("Mock Secure Send:", documentId, config);

    const jobId = generateId("job");
    const job = mockJobs.find((j) => j.documentId === documentId);

    if (job) {
      job.status = config.requiresApproval ? "pending" : "ready";
      job.updatedAt = new Date().toISOString();
      job.message = config.requiresApproval
        ? "Awaiting cafe admin approval before access is granted."
        : "Document sent securely. Access policy applied by the server.";
    }

    return {
      success: true,
      jobId,
      documentId,
      status: config.requiresApproval ? "pending" : "ready",
      message: config.requiresApproval
        ? "Secure send submitted. Access requires approval from the cafe."
        : "Document sent securely. The server has applied your access policy.",
    };
  },

  /**
   * ADMIN (CAFE) STATS
   */
  getCafeStats: async (cafeId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    console.log("Mock Cafe Stats:", cafeId);
    return {
      dailyRevenue: 450,
      activeUsers: 12,
      newRequests: 3,
    };
  },
};

export { API_BASE_URL };
