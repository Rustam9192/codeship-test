import { describe, expect, it } from "vitest";

import { loadDesk, saveDesk } from "@/lib/redux/slices/session/deskStorage";
import type { ConversationType } from "@/lib/redux/slices/session/types";

function memoryStorage() {
  const records = new Map<string, string>();
  return {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => {
      records.set(key, value);
    },
  };
}

const chat: ConversationType = {
  id: "draft",
  title: "Relay v4.2",
  messages: [],
  totals: { inputTokens: 0, outputTokens: 0, costUsd: 0 },
  errorMessage: null,
};

describe("deskStorage", () => {
  it("round-trips the chat list", () => {
    const storage = memoryStorage();
    saveDesk(storage, {
      conversations: [chat],
      activeConversationId: "draft",
      selectedModelId: "gemini",
    });

    expect(loadDesk(storage)?.conversations[0]?.title).toBe("Relay v4.2");
  });

  it("ignores a damaged record", () => {
    const storage = memoryStorage();
    storage.setItem("nimbusstack-desk", "{");

    expect(loadDesk(storage)).toBeNull();
  });
});
