import { configureStore } from "@reduxjs/toolkit";
import { describe, expect, it } from "vitest";

import {
  activeConversation,
  addUserMessage,
  beginAssistantMessage,
  completeAssistant,
  failTurn,
  removeConversation,
  selectConversation,
  sessionReducer,
  startConversation,
} from "@/lib/redux/slices/session/sessionSlice";

function store() {
  return configureStore({ reducer: { session: sessionReducer } });
}

describe("session conversations", () => {
  it("keeps the current chat and opens a new one", () => {
    const desk = store();
    desk.dispatch(addUserMessage({ id: "u1", content: "What shipped in Relay v4.2?" }));
    desk.dispatch(startConversation("second"));

    const state = desk.getState().session;
    expect(state.conversations).toHaveLength(2);
    expect(state.activeConversationId).toBe("second");
    expect(state.conversations[1]?.title).toBe("What shipped in Relay v4.2?");
    expect(activeConversation(state).messages).toEqual([]);
  });

  it("does not stack empty conversations", () => {
    const desk = store();
    desk.dispatch(startConversation("second"));

    expect(desk.getState().session.conversations).toHaveLength(1);
  });

  it("switches back without dropping messages or totals", () => {
    const desk = store();
    desk.dispatch(addUserMessage({ id: "u1", content: "First chat" }));
    desk.dispatch(beginAssistantMessage({ id: "a1" }));
    desk.dispatch(
      completeAssistant({
        modelId: "gemini",
        usage: { inputTokens: 10, outputTokens: 4, costUsd: 0.02 },
        citations: [],
      }),
    );
    desk.dispatch(startConversation("second"));
    desk.dispatch(addUserMessage({ id: "u2", content: "Second chat" }));
    desk.dispatch(selectConversation("draft"));

    const first = desk.getState().session.conversations.find((chat) => chat.id === "draft");
    expect(first?.messages).toHaveLength(2);
    expect(first?.totals.inputTokens).toBe(10);
    expect(activeConversation(desk.getState().session).id).toBe("draft");
  });

  it("ignores list changes while an answer is streaming", () => {
    const desk = store();
    desk.dispatch(addUserMessage({ id: "u1", content: "Question" }));
    desk.dispatch(beginAssistantMessage({ id: "a1" }));
    desk.dispatch(startConversation("second"));
    desk.dispatch(selectConversation("missing"));
    desk.dispatch(removeConversation({ id: "draft", fallbackId: "fallback" }));

    expect(desk.getState().session.activeConversationId).toBe("draft");
    expect(desk.getState().session.status).toBe("streaming");
  });

  it("drops an empty assistant draft when the turn fails", () => {
    const desk = store();
    desk.dispatch(addUserMessage({ id: "u1", content: "Question" }));
    desk.dispatch(beginAssistantMessage({ id: "a1" }));
    desk.dispatch(failTurn("The provider is rate-limiting requests."));

    const chat = activeConversation(desk.getState().session);
    expect(chat.messages.map((message) => message.role)).toEqual(["user"]);
    expect(chat.errorMessage).toContain("rate-limiting");
  });
});
