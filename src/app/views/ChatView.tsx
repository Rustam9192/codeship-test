"use client";

import { motion } from "framer-motion";

import { useAppDispatch } from "@/lib/redux/hooks";
import {
  resetConversation,
  setSelectedModel,
} from "@/lib/redux/slices/session/sessionSlice";

import {
  downloadText,
  estimateContextTokens,
  sessionUsageCsv,
  sessionUsageJson,
} from "./helpers";
import { useChatSession } from "./hooks";
import { ChatComposer } from "./parts/ChatComposer";
import { ChatTranscript } from "./parts/ChatTranscript";
import { DialogNewConversation } from "./parts/DialogNewConversation";
import { ModelPicker } from "./parts/ModelPicker";
import { UsagePanel } from "./parts/UsagePanel";

/**
 * Internal product chat: one session, a chosen model, and cited answers.
 */
export function ChatView() {
  const dispatch = useAppDispatch();
  const { session, sendMessage } = useChatSession();
  const streaming = session.status === "streaming";
  const selected = session.models.find(
    (model) => model.id === session.selectedModelId,
  );

  return (
    <main className="flex min-h-dvh flex-1 items-stretch justify-center px-3 py-4 sm:px-6 sm:py-8">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="journal-sheet flex min-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] sm:min-h-[calc(100dvh-4rem)]"
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
            <div className="flex flex-wrap items-center gap-2">
              <ModelPicker
                models={session.models}
                selectedModelId={session.selectedModelId}
                disabled={streaming}
                onChange={(modelId) => dispatch(setSelectedModel(modelId))}
              />
              <DialogNewConversation
                disabled={streaming}
                hasMessages={session.messages.length > 0}
                onConfirm={() => dispatch(resetConversation())}
              />
            </div>
          </div>
          <div className="mt-5 h-px bg-foreground/15" />
        </header>
        <ChatTranscript
          messages={session.messages}
          models={session.models}
          streaming={streaming}
          onPrompt={sendMessage}
        />
        {session.errorMessage ? (
          <p className="mx-6 mb-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive sm:mx-10">
            {session.errorMessage}
          </p>
        ) : null}
        <UsagePanel
          totals={session.totals}
          model={selected}
          estimatedTokens={estimateContextTokens(session.messages)}
          onExportCsv={() =>
            downloadText(
              "nimbusstack-usage.csv",
              sessionUsageCsv(session.messages),
              "text/csv",
            )
          }
          onExportJson={() =>
            downloadText(
              "nimbusstack-usage.json",
              sessionUsageJson(session.messages, session.totals),
              "application/json",
            )
          }
        />
        <ChatComposer disabled={streaming} onSend={sendMessage} />
      </motion.section>
    </main>
  );
}
