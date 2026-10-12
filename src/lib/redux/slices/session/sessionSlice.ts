import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { DeskSnapshotType } from "@/lib/redux/slices/session/deskStorage";
import {
  NEW_CONVERSATION_TITLE,
  type ConversationType,
  type SessionStateType,
} from "@/lib/redux/slices/session/types";
import type {
  CitationType,
  ChatMessageType,
  MessageUsageType,
} from "@/types/chat/chatMessageType";
import type { PublicModelType } from "@/types/chat/publicModelType";

const EMPTY_TOTALS: MessageUsageType = {
  inputTokens: 0,
  outputTokens: 0,
  costUsd: 0,
};

const TITLE_LIMIT = 48;

function blankConversation(id: string): ConversationType {
  return {
    id,
    title: NEW_CONVERSATION_TITLE,
    messages: [],
    totals: { ...EMPTY_TOTALS },
    errorMessage: null,
  };
}

function titleFromMessages(messages: ChatMessageType[]): string {
  const content = messages.find((message) => message.role === "user")?.content.trim();
  if (!content) return NEW_CONVERSATION_TITLE;
  const line = content.split("\n")[0] ?? content;
  if (line.length <= TITLE_LIMIT) return line;
  return `${line.slice(0, TITLE_LIMIT).trimEnd()}…`;
}

function activeChat(state: SessionStateType): ConversationType {
  const found = state.conversations.find((chat) => chat.id === state.activeConversationId);
  if (found) return found;
  state.activeConversationId = state.conversations[0].id;
  return state.conversations[0];
}

const initialState: SessionStateType = {
  conversations: [blankConversation("draft")],
  activeConversationId: "draft",
  selectedModelId: "gemini",
  models: [],
  status: "idle",
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setModels(state, action: PayloadAction<PublicModelType[]>) {
      state.models = action.payload;
      const current = action.payload.find((model) => model.id === state.selectedModelId);
      if (current?.available) return;
      const next = action.payload.find((model) => model.available);
      if (next) state.selectedModelId = next.id;
    },
    setSelectedModel(state, action: PayloadAction<string>) {
      state.selectedModelId = action.payload;
    },
    hydrateDesk(state, action: PayloadAction<DeskSnapshotType>) {
      if (action.payload.conversations.length === 0) return;
      state.conversations = action.payload.conversations;
      state.activeConversationId = action.payload.activeConversationId;
      state.selectedModelId = action.payload.selectedModelId;
      state.status = "idle";
    },
    startConversation(state, action: PayloadAction<string>) {
      if (state.status === "streaming") return;
      const current = activeChat(state);
      if (current.messages.length === 0) return;
      state.conversations.unshift(blankConversation(action.payload));
      state.activeConversationId = action.payload;
      state.status = "idle";
    },
    selectConversation(state, action: PayloadAction<string>) {
      if (state.status === "streaming") return;
      const exists = state.conversations.some((chat) => chat.id === action.payload);
      if (!exists) return;
      state.activeConversationId = action.payload;
      state.status = "idle";
    },
    removeConversation(state, action: PayloadAction<{ id: string; fallbackId: string }>) {
      if (state.status === "streaming") return;
      const remaining = state.conversations.filter((chat) => chat.id !== action.payload.id);
      state.conversations =
        remaining.length > 0 ? remaining : [blankConversation(action.payload.fallbackId)];
      if (state.activeConversationId === action.payload.id) {
        state.activeConversationId = state.conversations[0].id;
      }
      state.status = "idle";
    },
    addUserMessage(state, action: PayloadAction<{ id: string; content: string }>) {
      const chat = activeChat(state);
      chat.messages.push({
        id: action.payload.id,
        role: "user",
        content: action.payload.content,
      });
      chat.title = titleFromMessages(chat.messages);
      chat.errorMessage = null;
    },
    beginAssistantMessage(state, action: PayloadAction<{ id: string }>) {
      const chat = activeChat(state);
      chat.messages.push({
        id: action.payload.id,
        role: "assistant",
        content: "",
      });
      chat.errorMessage = null;
      state.status = "streaming";
    },
    appendAssistantDelta(state, action: PayloadAction<string>) {
      const last = activeChat(state).messages.at(-1);
      if (last?.role === "assistant") last.content += action.payload;
    },
    resetAssistantDraft(state) {
      const last = activeChat(state).messages.at(-1);
      if (last?.role === "assistant") last.content = "";
    },
    completeAssistant(
      state,
      action: PayloadAction<{
        modelId: string | null;
        usage: MessageUsageType;
        citations: CitationType[];
      }>,
    ) {
      const chat = activeChat(state);
      const last = chat.messages.at(-1);
      if (last?.role === "assistant") {
        if (action.payload.modelId) last.modelId = action.payload.modelId;
        last.usage = action.payload.usage;
        last.citations = action.payload.citations;
      }
      chat.totals.inputTokens += action.payload.usage.inputTokens;
      chat.totals.outputTokens += action.payload.usage.outputTokens;
      chat.totals.costUsd =
        Math.round((chat.totals.costUsd + action.payload.usage.costUsd) * 1_000_000) /
        1_000_000;
      state.status = "idle";
    },
    failTurn(state, action: PayloadAction<string>) {
      const chat = activeChat(state);
      const last = chat.messages.at(-1);
      if (last?.role === "assistant" && !last.content.trim()) {
        chat.messages.pop();
      }
      chat.errorMessage = action.payload;
      state.status = "error";
    },
  },
});

export const {
  setModels,
  setSelectedModel,
  hydrateDesk,
  startConversation,
  selectConversation,
  removeConversation,
  addUserMessage,
  beginAssistantMessage,
  appendAssistantDelta,
  resetAssistantDraft,
  completeAssistant,
  failTurn,
} = sessionSlice.actions;

export const sessionReducer = sessionSlice.reducer;

export function activeConversation(state: SessionStateType): ConversationType {
  return (
    state.conversations.find((chat) => chat.id === state.activeConversationId) ??
    state.conversations[0]
  );
}
