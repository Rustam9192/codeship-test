"use client";

import { useEffect } from "react";

import {
  activeConversation,
  addUserMessage,
  appendAssistantDelta,
  beginAssistantMessage,
  completeAssistant,
  failTurn,
  resetAssistantDraft,
  setModels,
} from "@/lib/redux/slices/session/sessionSlice";
import { useAppDispatch, useAppSelector, useAppStore } from "@/lib/redux/hooks";
import type { ChatStreamEventType } from "@/types/chat/chatMessageType";
import type { PublicModelType } from "@/types/chat/publicModelType";

/**
 * Loads the model list and sends one grounded turn through the server stream.
 */
export function useChatSession() {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const session = useAppSelector((state) => state.session);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/models")
      .then((response) => response.json())
      .then((body: { models?: PublicModelType[] }) => {
        if (!cancelled && Array.isArray(body.models)) {
          dispatch(setModels(body.models));
        }
      })
      .catch(() => {
        if (!cancelled) {
          dispatch(failTurn("The model list could not be loaded."));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      dispatch(failTurn("Enter a question before sending."));
      return;
    }
    if (store.getState().session.status === "streaming") return;

    dispatch(addUserMessage({ id: crypto.randomUUID(), content: trimmed }));
    dispatch(beginAssistantMessage({ id: crypto.randomUUID() }));

    const snapshot = store.getState().session;
    const messages = activeConversation(snapshot)
      .messages.filter((message) => message.role === "user" || message.content.trim())
      .map((message) => ({ role: message.role, content: message.content }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: snapshot.selectedModelId,
          messages,
        }),
      });

      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        dispatch(failTurn(body?.error ?? "The chat request failed."));
        return;
      }

      await readChatStream(response.body, (event) => {
        if (event.type === "delta") dispatch(appendAssistantDelta(event.text));
        if (event.type === "reset") dispatch(resetAssistantDraft());
        if (event.type === "done") dispatch(completeAssistant(event));
        if (event.type === "error") dispatch(failTurn(event.message));
      });

      if (store.getState().session.status === "streaming") {
        dispatch(failTurn("The answer stopped before it finished."));
      }
    } catch {
      dispatch(failTurn("The connection dropped before the answer finished."));
    }
  }

  return { session, sendMessage };
}

async function readChatStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: ChatStreamEventType) => void,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const line = chunk.split("\n").find((item) => item.startsWith("data: "));
      if (!line) continue;
      onEvent(JSON.parse(line.slice(6)) as ChatStreamEventType);
    }
  }
}
