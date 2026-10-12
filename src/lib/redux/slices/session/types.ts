import type { ChatMessageType, MessageUsageType } from "@/types/chat/chatMessageType";
import type { PublicModelType } from "@/types/chat/publicModelType";

export type SessionStatusType = "idle" | "streaming" | "error";

export type SessionStateType = {
  messages: ChatMessageType[];
  selectedModelId: string;
  models: PublicModelType[];
  totals: MessageUsageType;
  status: SessionStatusType;
  errorMessage: string | null;
};
