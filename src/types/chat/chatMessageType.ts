export type MessageUsageType = {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

export type CitationType = {
  fileName: string;
  title: string;
  excerpt: string;
};

export type ChatMessageType = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: CitationType[];
  modelId?: string;
  usage?: MessageUsageType;
};

export type ChatRequestMessageType = {
  role: "user" | "assistant";
  content: string;
};

export type ChatStreamEventType =
  | { type: "delta"; text: string }
  | { type: "reset" }
  | {
      type: "done";
      modelId: string | null;
      usage: MessageUsageType;
      citations: CitationType[];
    }
  | { type: "error"; message: string };
