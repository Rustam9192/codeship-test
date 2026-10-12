import { runChat } from "@/lib/chat/runChat";
import type { ChatRequestMessageType } from "@/types/chat/chatMessageType";

export const maxDuration = 60;

type ParseResultType =
  | { ok: true; modelId: string; messages: ChatRequestMessageType[] }
  | { ok: false; error: string };

/**
 * Streams a grounded answer. API keys stay on the server.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "The request body must be JSON." }, { status: 400 });
  }

  const parsed = parseChatRequest(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      try {
        await runChat(parsed.modelId, parsed.messages, send);
      } catch (error) {
        console.error(error);
        send({
          type: "error",
          message: "The chat request failed before a model could answer.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

function parseChatRequest(body: unknown): ParseResultType {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "The request body must be an object." };
  }

  const record = body as { modelId?: unknown; messages?: unknown };
  if (typeof record.modelId !== "string" || !record.modelId.trim()) {
    return { ok: false, error: "Choose a model before sending." };
  }
  if (!Array.isArray(record.messages) || record.messages.length === 0) {
    return { ok: false, error: "Enter a question before sending." };
  }

  const messages: ChatRequestMessageType[] = [];
  for (const item of record.messages) {
    if (typeof item !== "object" || item === null) {
      return { ok: false, error: "Each message must include a role and content." };
    }
    const message = item as { role?: unknown; content?: unknown };
    if (message.role !== "user" && message.role !== "assistant") {
      return { ok: false, error: "Each message must include a role and content." };
    }
    if (typeof message.content !== "string") {
      return { ok: false, error: "Each message must include a role and content." };
    }
    messages.push({ role: message.role, content: message.content });
  }

  const latest = messages[messages.length - 1];
  if (latest.role !== "user" || !latest.content.trim()) {
    return { ok: false, error: "Enter a question before sending." };
  }

  return { ok: true, modelId: record.modelId, messages };
}
