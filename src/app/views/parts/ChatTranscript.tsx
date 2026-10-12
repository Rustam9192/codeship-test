import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessageType } from "@/types/chat/chatMessageType";
import type { PublicModelType } from "@/types/chat/publicModelType";

import { formatUsageTotalsLine } from "../helpers";
import { CitationList } from "./CitationList";

const PROMPTS = [
  "What are the key differences between Pro and Enterprise?",
  "Which products support SSO via SAML 2.0?",
  "What shipped in Relay v4.2?",
];

/**
 * The conversation, with citations and per-message usage under each answer.
 */
export function ChatTranscript({
  messages,
  models,
  streaming,
  onPrompt,
}: {
  messages: ChatMessageType[];
  models: PublicModelType[];
  streaming: boolean;
  onPrompt: (text: string) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: streaming ? "auto" : "smooth",
      block: "end",
    });
  }, [messages, streaming]);

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-2 sm:px-10">
        {messages.length === 0 ? (
          <div className="py-8">
            <p className="font-heading text-2xl leading-snug font-medium italic">
              Ask the desk. Answers stay inside the company documents.
            </p>
            <ul className="mt-6 flex flex-col gap-2">
              {PROMPTS.map((prompt) => (
                <li key={prompt}>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto w-full justify-start rounded-2xl px-4 py-3 text-left font-normal whitespace-normal"
                    onClick={() => onPrompt(prompt)}
                  >
                    {prompt}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {messages.map((message) => {
          const provider = models.find((model) => model.id === message.modelId);
          const drafting =
            message.role === "assistant" &&
            streaming &&
            message.content.length === 0;

          return (
            <motion.article
              key={message.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={
                message.role === "user"
                  ? "ml-auto max-w-[85%] rounded-3xl rounded-br-md bg-primary px-5 py-3 text-sm text-primary-foreground shadow-md"
                  : "max-w-full"
              }
            >
              {message.role === "assistant" ? (
                <p className="mb-2 text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
                  Desk note
                </p>
              ) : null}
              <p
                className={
                  message.role === "assistant"
                    ? "font-heading text-[1.125rem] leading-7 whitespace-pre-wrap"
                    : "leading-6 whitespace-pre-wrap"
                }
              >
                {message.content}
                {drafting ? (
                  <motion.span
                    className="ml-1 inline-block h-4 w-0.5 bg-foreground/70 align-middle"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.1, repeat: Infinity }}
                  />
                ) : null}
              </p>
              {message.role === "assistant" && message.modelId ? (
                <p className="mt-3 text-xs tracking-wide text-muted-foreground">
                  {provider?.providerLabel ?? message.modelId}
                  {message.usage ? ` · ${formatUsageTotalsLine(message.usage)}` : ""}
                </p>
              ) : null}
              {message.citations && message.citations.length > 0 ? (
                <CitationList citations={message.citations} />
              ) : null}
            </motion.article>
          );
        })}
        <div ref={endRef} />
      </div>
    </ScrollArea>
  );
}
