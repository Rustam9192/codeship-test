import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

import type { PublicModelType } from "@/types/chat/publicModelType";

export type ModelProviderType = "anthropic" | "openai" | "google";

export type ModelConfigType = {
  id: string;
  provider: ModelProviderType;
  providerLabel: string;
  modelId: string;
  description: string;
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
  contextWindow: number;
  fallbackOrder: number;
  envVar: "ANTHROPIC_API_KEY" | "OPENAI_API_KEY" | "GOOGLE_GENERATIVE_AI_API_KEY";
};

/**
 * Provider list, prices, and context sizes. The UI reads the public view from `/api/models`.
 * Prices are published list rates used only to estimate session cost.
 */
export const MODEL_CATALOG: ModelConfigType[] = [
  {
    id: "claude",
    provider: "anthropic",
    providerLabel: "Claude",
    modelId: "claude-sonnet-4-5",
    description: "Anthropic Sonnet. Careful reading when documents disagree.",
    inputUsdPerMillion: 3,
    outputUsdPerMillion: 15,
    contextWindow: 200_000,
    fallbackOrder: 2,
    envVar: "ANTHROPIC_API_KEY",
  },
  {
    id: "openai",
    provider: "openai",
    providerLabel: "OpenAI",
    modelId: "gpt-4.1-mini",
    description: "OpenAI GPT-4.1 mini. Fast lookups for pricing and specs.",
    inputUsdPerMillion: 0.4,
    outputUsdPerMillion: 1.6,
    contextWindow: 1_047_576,
    fallbackOrder: 1,
    envVar: "OPENAI_API_KEY",
  },
  {
    id: "gemini",
    provider: "google",
    providerLabel: "Gemini",
    modelId: "gemini-3.8-flash",
    description: "Google Gemini Flash. Lower cost, including a free tier.",
    inputUsdPerMillion: 0.75,
    outputUsdPerMillion: 3.75,
    contextWindow: 1_048_576,
    fallbackOrder: 0,
    envVar: "GOOGLE_GENERATIVE_AI_API_KEY",
  },
];

export function isModelConfigured(model: ModelConfigType): boolean {
  return Boolean(process.env[model.envVar]?.trim());
}

export function toPublicModel(model: ModelConfigType): PublicModelType {
  return {
    id: model.id,
    providerLabel: model.providerLabel,
    description: model.description,
    inputUsdPerMillion: model.inputUsdPerMillion,
    outputUsdPerMillion: model.outputUsdPerMillion,
    contextWindow: model.contextWindow,
    available: isModelConfigured(model),
  };
}

export function modelById(id: string): ModelConfigType | undefined {
  return MODEL_CATALOG.find((model) => model.id === id);
}

/**
 * Tries the selected model first, then the remaining providers by fallback order.
 */
export function providerAttemptOrder(selectedId: string): ModelConfigType[] {
  const selected = modelById(selectedId) ?? MODEL_CATALOG[0];
  const rest = MODEL_CATALOG.filter((model) => model.id !== selected.id).sort(
    (left, right) => left.fallbackOrder - right.fallbackOrder,
  );
  return [selected, ...rest];
}

export function languageModelFor(model: ModelConfigType): LanguageModel {
  switch (model.provider) {
    case "anthropic":
      return anthropic(model.modelId);
    case "openai":
      return openai(model.modelId);
    case "google":
      return google(model.modelId);
  }
}

export function estimateCostUsd(
  model: ModelConfigType,
  inputTokens: number,
  outputTokens: number,
): number {
  const cost =
    (inputTokens / 1_000_000) * model.inputUsdPerMillion +
    (outputTokens / 1_000_000) * model.outputUsdPerMillion;
  return Math.round(cost * 1_000_000) / 1_000_000;
}
