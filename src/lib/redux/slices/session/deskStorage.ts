import type { ConversationType } from "@/lib/redux/slices/session/types";

const STORAGE_KEY = "nimbusstack-desk";

export type DeskSnapshotType = {
  conversations: ConversationType[];
  activeConversationId: string;
  selectedModelId: string;
};

/**
 * Reads the saved chat list. A missing or damaged record returns null.
 */
export function loadDesk(storage: Pick<Storage, "getItem">): DeskSnapshotType | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseDesk(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Stores the chat list so a refresh keeps every conversation.
 */
export function saveDesk(storage: Pick<Storage, "setItem">, desk: DeskSnapshotType): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(desk));
}

function parseDesk(value: unknown): DeskSnapshotType | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Partial<DeskSnapshotType>;
  if (!Array.isArray(record.conversations) || record.conversations.length === 0) return null;
  if (typeof record.activeConversationId !== "string") return null;
  if (typeof record.selectedModelId !== "string") return null;
  const conversations = record.conversations.filter(isConversation);
  if (conversations.length === 0) return null;
  const active = conversations.some((chat) => chat.id === record.activeConversationId)
    ? record.activeConversationId
    : conversations[0].id;
  return {
    conversations,
    activeConversationId: active,
    selectedModelId: record.selectedModelId,
  };
}

function isConversation(value: unknown): value is ConversationType {
  if (typeof value !== "object" || value === null) return false;
  const chat = value as Partial<ConversationType>;
  return (
    typeof chat.id === "string" &&
    typeof chat.title === "string" &&
    Array.isArray(chat.messages) &&
    typeof chat.totals === "object" &&
    chat.totals !== null
  );
}
