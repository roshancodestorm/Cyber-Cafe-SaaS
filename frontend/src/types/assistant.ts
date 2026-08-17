export type ChatRole = "user" | "assistant" | "system";

export type MessageStatus = "sending" | "sent" | "streaming" | "error";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  status: MessageStatus;
  createdAt: string;
  errorMessage?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    creditsUsed?: number;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AssistantCredits {
  balance: number;
  totalUsed: number;
  planLimit: number | null;
  resetDate?: string;
}

export interface AssistantSuggestion {
  id: string;
  label: string;
  prompt: string;
}

export interface AssistantStreamEvent {
  type: "token" | "done" | "error" | "usage";
  token?: string;
  errorMessage?: string;
  usage?: ChatMessage["usage"];
}

export const DEFAULT_SUGGESTIONS: AssistantSuggestion[] = [
  {
    id: "sug-1",
    label: "Explain document security",
    prompt: "How does the document security and access policy work?",
  },
  {
    id: "sug-2",
    label: "Troubleshoot printing",
    prompt: "My print job is stuck. What should I check?",
  },
  {
    id: "sug-3",
    label: "Maximize session time",
    prompt: "Tips to get the most value from my cafe session time.",
  },
  {
    id: "sug-4",
    label: "Pricing & plans",
    prompt: "Explain the pricing plans and how credits work.",
  },
];
