"use client";

import { Button } from "@/components/ui/button";
import type { MessageUsageType } from "@/types/chat/chatMessageType";
import type { PublicModelType } from "@/types/chat/publicModelType";

import { contextWarningLevel, formatUsd } from "../helpers";

/**
 * Running token totals and the context-window warning for the selected model.
 */
export function UsagePanel({
  totals,
  model,
  estimatedTokens,
  onExportCsv,
  onExportJson,
}: {
  totals: MessageUsageType;
  model: PublicModelType | undefined;
  estimatedTokens: number;
  onExportCsv: () => void;
  onExportJson: () => void;
}) {
  const ratio = model ? estimatedTokens / model.contextWindow : 0;
  const level = model ? contextWarningLevel(ratio) : null;
  const percent = Math.round(ratio * 100);

  return (
    <div className="flex flex-col gap-2 px-6 sm:px-10">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p className="tracking-wide">
          {totals.inputTokens.toLocaleString()} in · {totals.outputTokens.toLocaleString()} out ·{" "}
          {formatUsd(totals.costUsd)}
        </p>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={onExportCsv}>
            CSV
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onExportJson}>
            JSON
          </Button>
        </div>
      </div>
      {level ? (
        <p
          className={
            level === "red"
              ? "rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-950 shadow-sm"
              : "rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-950 shadow-sm"
          }
        >
          About {percent}% of the {model?.providerLabel} context window is in use. Start a new
          conversation before the next reply is cut off.
        </p>
      ) : null}
    </div>
  );
}
