import { afterEach, describe, expect, it } from "vitest";

import { estimateCostUsd, isModelConfigured, modelById, providerAttemptOrder } from "@/lib/models";

const ENV_KEYS = ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"] as const;

describe("models", () => {
  afterEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });

  it("tries the selected model first, then the others by fallback order", () => {
    const order = providerAttemptOrder("openai").map((model) => model.id);

    expect(order).toEqual(["openai", "gemini", "claude"]);
  });

  it("treats a blank key as unconfigured", () => {
    const gemini = modelById("gemini");
    expect(gemini).toBeDefined();
    if (!gemini) return;

    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "   ";
    expect(isModelConfigured(gemini)).toBe(false);

    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "key";
    expect(isModelConfigured(gemini)).toBe(true);
  });

  it("estimates cost from the published per-million rates", () => {
    const gemini = modelById("gemini");
    expect(gemini).toBeDefined();
    if (!gemini) return;

    expect(estimateCostUsd(gemini, 1_000_000, 1_000_000)).toBe(
      gemini.inputUsdPerMillion + gemini.outputUsdPerMillion,
    );
  });
});
