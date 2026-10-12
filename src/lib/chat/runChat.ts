import { streamText } from "ai";

import { buildSystemPrompt, refusalText, toCitations } from "@/lib/chat/buildSystemPrompt";
import { describeProviderError } from "@/lib/chat/providerError";
import { getKnowledgeSections } from "@/lib/knowledge/loadKnowledge";
import { retrieveSections } from "@/lib/knowledge/retrieveSections";
import {
  estimateCostUsd,
  isModelConfigured,
  languageModelFor,
  providerAttemptOrder,
} from "@/lib/models";
import type {
  ChatRequestMessageType,
  ChatStreamEventType,
  MessageUsageType,
} from "@/types/chat/chatMessageType";

const EMPTY_USAGE: MessageUsageType = {
  inputTokens: 0,
  outputTokens: 0,
  costUsd: 0,
};

/**
 * Streams one grounded answer. A failed provider is discarded before the next one starts.
 */
export async function runChat(
  modelId: string,
  messages: ChatRequestMessageType[],
  send: (event: ChatStreamEventType) => void,
): Promise<void> {
  const question = messages[messages.length - 1]?.content ?? "";
  const history = messages.slice(0, -1).map((message) => message.content);
  const passages = retrieveSections(question, history, getKnowledgeSections());

  if (passages.length === 0) {
    send({ type: "delta", text: refusalText() });
    send({
      type: "done",
      modelId: null,
      usage: EMPTY_USAGE,
      citations: [],
    });
    return;
  }

  const attempted = providerAttemptOrder(modelId).filter(isModelConfigured);
  if (attempted.length === 0) {
    send({
      type: "error",
      message:
        "No model provider is configured. Add an API key on the server and restart.",
    });
    return;
  }

  let lastFailure = describeProviderError(new Error("unavailable"));

  for (const model of attempted) {
    let emitted = false;
    try {
      const result = streamText({
        model: languageModelFor(model),
        system: buildSystemPrompt(passages),
        messages: messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      });

      let text = "";
      for await (const part of result.fullStream) {
        if (part.type === "text-delta") {
          text += part.text;
          emitted = true;
          send({ type: "delta", text: part.text });
        } else if (part.type === "error") {
          throw part.error;
        }
      }

      if (!text.trim()) {
        throw new Error("The provider returned an empty answer.");
      }

      const usage = await result.usage;
      const inputTokens = usage.inputTokens ?? 0;
      const outputTokens = usage.outputTokens ?? 0;
      send({
        type: "done",
        modelId: model.id,
        usage: {
          inputTokens,
          outputTokens,
          costUsd: estimateCostUsd(model, inputTokens, outputTokens),
        },
        citations: toCitations(passages),
      });
      return;
    } catch (error) {
      if (emitted) {
        send({ type: "reset" });
      }
      lastFailure = describeProviderError(error);
    }
  }

  send({ type: "error", message: lastFailure.message });
}
