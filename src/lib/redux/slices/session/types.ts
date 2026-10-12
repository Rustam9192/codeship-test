import type { ChatMessageType, MessageUsageType } from "@/types/chat/chatMessageType";
import type { PublicModelType } from "@/types/chat/publicModelType";

export type SessionStatusType = "idle" | "streaming" | "error";

export type ConversationType = {
  id: string;
  title: string;
  messages: ChatMessageType[];
  totals: MessageUsageType;
  errorMessage: string | null;
};

export type SessionStateType = {
  conversations: ConversationType[];
  activeConversationId: string;
  selectedModelId: string;
  models: PublicModelType[];
  status: SessionStatusType;
};

export const NEW_CONVERSATION_TITLE = "New conversation";
