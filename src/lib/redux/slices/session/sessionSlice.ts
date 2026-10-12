import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { SessionStateType } from "@/lib/redux/slices/session/types";
import type {
  CitationType,
  MessageUsageType,
} from "@/types/chat/chatMessageType";
import type { PublicModelType } from "@/types/chat/publicModelType";

const initialState: SessionStateType = {
  messages: [],
  selectedModelId: "gemini",
  models: [],
  totals: { inputTokens: 0, outputTokens: 0, costUsd: 0 },
  status: "idle",
  errorMessage: null,
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
    resetConversation(state) {
      state.messages = [];
      state.totals = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
      state.status = "idle";
      state.errorMessage = null;
    },
    addUserMessage(state, action: PayloadAction<{ id: string; content: string }>) {
      state.messages.push({
        id: action.payload.id,
        role: "user",
        content: action.payload.content,
      });
      state.errorMessage = null;
    },
    beginAssistantMessage(state, action: PayloadAction<{ id: string }>) {
      state.messages.push({
        id: action.payload.id,
        role: "assistant",
        content: "",
      });
      state.status = "streaming";
      state.errorMessage = null;
    },
    appendAssistantDelta(state, action: PayloadAction<string>) {
      const last = state.messages[state.messages.length - 1];
      if (last?.role === "assistant") last.content += action.payload;
    },
    resetAssistantDraft(state) {
      const last = state.messages[state.messages.length - 1];
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
      const last = state.messages[state.messages.length - 1];
      if (last?.role === "assistant") {
        if (action.payload.modelId) last.modelId = action.payload.modelId;
        last.usage = action.payload.usage;
        last.citations = action.payload.citations;
      }
      state.totals.inputTokens += action.payload.usage.inputTokens;
      state.totals.outputTokens += action.payload.usage.outputTokens;
      state.totals.costUsd =
        Math.round((state.totals.costUsd + action.payload.usage.costUsd) * 1_000_000) /
        1_000_000;
      state.status = "idle";
    },
    failTurn(state, action: PayloadAction<string>) {
      const last = state.messages[state.messages.length - 1];
      if (last?.role === "assistant" && !last.content.trim()) {
        state.messages.pop();
      }
      state.status = "error";
      state.errorMessage = action.payload;
    },
  },
});

export const {
  setModels,
  setSelectedModel,
  resetConversation,
  addUserMessage,
  beginAssistantMessage,
  appendAssistantDelta,
  resetAssistantDraft,
  completeAssistant,
  failTurn,
} = sessionSlice.actions;

export const sessionReducer = sessionSlice.reducer;
