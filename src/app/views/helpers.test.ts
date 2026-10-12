import { describe, expect, it } from "vitest";

import type { ChatMessageType } from "@/types/chat/chatMessageType";

import {
  contextWarningLevel,
  estimateContextTokens,
  formatUsd,
  sessionUsageCsv,
  sessionUsageJson,
} from "./helpers";

const message: ChatMessageType = {
  id: "a1",
  role: "assistant",
  content: "Answer",
  modelId: "gemini",
  usage: { inputTokens: 8, outputTokens: 2, costUsd: 0.0012 },
};

describe("chat usage helpers", () => {
  it("warns at 75 percent and 90 percent of the context window", () => {
    expect(contextWarningLevel(0.74)).toBeNull();
    expect(contextWarningLevel(0.75)).toBe("amber");
    expect(contextWarningLevel(0.9)).toBe("red");
  });

  it("estimates tokens from message length and formats small costs", () => {
    expect(estimateContextTokens([message])).toBe(2);
    expect(formatUsd(0.0012)).toBe("$0.0012");
    expect(formatUsd(1.2)).toBe("$1.20");
  });

  it("exports only turns that recorded usage", () => {
    const csv = sessionUsageCsv([
      { id: "u1", role: "user", content: "Question" },
      message,
    ]);
    const json = JSON.parse(sessionUsageJson([message], message.usage)) as {
      messages: { id: string }[];
    };

    expect(csv).toContain("a1,assistant,gemini,8,2,0.0012");
    expect(csv).not.toContain("u1");
    expect(json.messages).toHaveLength(1);
  });
});
