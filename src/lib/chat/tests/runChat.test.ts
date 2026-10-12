import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("ai", () => ({
  streamText: vi.fn(),
}));

import { streamText } from "ai";

import { runChat } from "@/lib/chat/runChat";
import type { ChatStreamEventType } from "@/types/chat/chatMessageType";

const streamTextMock = vi.mocked(streamText);
const ENV_KEYS = ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"] as const;

function eventsFor(question: string) {
  const events: ChatStreamEventType[] = [];
  return {
    events,
    done: runChat("gemini", [{ role: "user", content: question }], (event) => {
      events.push(event);
    }),
  };
}

describe("runChat", () => {
  afterEach(() => {
    streamTextMock.mockReset();
    for (const key of ENV_KEYS) delete process.env[key];
  });

  it("refuses a question outside the documents without calling a provider", async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "key";
    const { events, done } = eventsFor("What is the office dog's name?");
    await done;

    expect(streamTextMock).not.toHaveBeenCalled();
    expect(events[0]).toMatchObject({ type: "delta" });
    expect(events.at(-1)).toMatchObject({ type: "done", modelId: null });
  });

  it("does not call a provider when no key is configured", async () => {
    const { events, done } = eventsFor("What shipped in Relay v4.2?");
    await done;

    expect(streamTextMock).not.toHaveBeenCalled();
    expect(events[0]).toMatchObject({
      type: "error",
      message: expect.stringContaining("No model provider"),
    });
  });

  it("resets a partial answer before the fallback provider continues", async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "key";
    process.env.OPENAI_API_KEY = "key";
    streamTextMock
      .mockReturnValueOnce({
        fullStream: (async function* () {
          yield { type: "text-delta" as const, text: "partial" };
          yield {
            type: "error" as const,
            error: Object.assign(new Error("quota exceeded"), { statusCode: 429 }),
          };
        })(),
        usage: Promise.resolve({ inputTokens: 1, outputTokens: 1 }),
      } as never)
      .mockReturnValueOnce({
        fullStream: (async function* () {
          yield { type: "text-delta" as const, text: "Recovered answer" };
        })(),
        usage: Promise.resolve({ inputTokens: 8, outputTokens: 4 }),
      } as never);

    const { events, done } = eventsFor("What shipped in Relay v4.2?");
    await done;

    expect(events.map((event) => event.type)).toEqual(["delta", "reset", "delta", "done"]);
    expect(events.at(-1)).toMatchObject({ type: "done", modelId: "openai" });
  });
});
