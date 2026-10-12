"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

import { useAppDispatch } from "@/lib/redux/hooks";
import { loadDesk, saveDesk } from "@/lib/redux/slices/session/deskStorage";
import {
  activeConversation,
  hydrateDesk,
  removeConversation,
  selectConversation,
  setSelectedModel,
  startConversation,
} from "@/lib/redux/slices/session/sessionSlice";

import {
  downloadText,
  estimateContextTokens,
  sessionUsageCsv,
  sessionUsageJson,
} from "./helpers";
import { useChatSession } from "./hooks";
import { ChatComposer } from "./parts/ChatComposer";
import { ChatSidebar } from "./parts/ChatSidebar";
import { ChatTranscript } from "./parts/ChatTranscript";
import { ModelPicker } from "./parts/ModelPicker";
import { UsagePanel } from "./parts/UsagePanel";

/**
 * Internal product chat: several conversations, a chosen model, and cited answers.
 */
export function ChatView() {
  const dispatch = useAppDispatch();
  const { session, sendMessage } = useChatSession();
  const skipSave = useRef(true);
  const streaming = session.status === "streaming";
  const chat = activeConversation(session);
  const selected = session.models.find(
    (model) => model.id === session.selectedModelId,
  );

  useEffect(() => {
    const saved = loadDesk(localStorage);
    if (saved) dispatch(hydrateDesk(saved));
  }, [dispatch]);

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    saveDesk(localStorage, {
      conversations: session.conversations,
      activeConversationId: session.activeConversationId,
      selectedModelId: session.selectedModelId,
    });
  }, [
    session.conversations,
    session.activeConversationId,
    session.selectedModelId,
  ]);

  return (
    <div className="flex min-h-dvh flex-1 flex-col gap-3 p-3 md:flex-row md:p-4">
      <ChatSidebar
        conversations={session.conversations}
        activeConversationId={session.activeConversationId}
        disabled={streaming}
        onStart={() => dispatch(startConversation(crypto.randomUUID()))}
        onSelect={(id) => dispatch(selectConversation(id))}
        onRemove={(id) =>
          dispatch(removeConversation({ id, fallbackId: crypto.randomUUID() }))
        }
      />
      <main className="flex min-h-0 min-w-0 flex-1 items-stretch justify-center">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="journal-sheet flex min-h-[calc(100dvh-16rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] md:min-h-[calc(100dvh-2rem)]"
        >
          <header className="px-6 pt-7 pb-5 sm:px-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] tracking-[0.28em] text-muted-foreground uppercase">
                  NimbusStack · desk copy
                </p>
                <h1 className="font-heading mt-1 text-4xl leading-none font-medium tracking-tight">
                  Product knowledge
                </h1>
              </div>
              <ModelPicker
                models={session.models}
                selectedModelId={session.selectedModelId}
                disabled={streaming}
                onChange={(modelId) => dispatch(setSelectedModel(modelId))}
              />
            </div>
            <div className="mt-5 h-px bg-foreground/15" />
          </header>
          <ChatTranscript
            messages={chat.messages}
            models={session.models}
            streaming={streaming}
            onPrompt={sendMessage}
          />
          {chat.errorMessage ? (
            <p className="mx-6 mb-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive sm:mx-10">
              {chat.errorMessage}
            </p>
          ) : null}
          <UsagePanel
            totals={chat.totals}
            model={selected}
            estimatedTokens={estimateContextTokens(chat.messages)}
            onExportCsv={() =>
              downloadText(
                "nimbusstack-usage.csv",
                sessionUsageCsv(chat.messages),
                "text/csv",
              )
            }
            onExportJson={() =>
              downloadText(
                "nimbusstack-usage.json",
                sessionUsageJson(chat.messages, chat.totals),
                "application/json",
              )
            }
          />
          <ChatComposer disabled={streaming} onSend={sendMessage} />
        </motion.section>
      </main>
    </div>
  );
}
