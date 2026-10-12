import type {
  ChatMessageType,
  MessageUsageType,
} from "@/types/chat/chatMessageType";

export function estimateContextTokens(messages: ChatMessageType[]): number {
  const characters = messages.reduce((sum, message) => sum + message.content.length, 0);
  return Math.ceil(characters / 4);
}

export function contextWarningLevel(ratio: number): "amber" | "red" | null {
  if (ratio >= 0.9) return "red";
  if (ratio >= 0.75) return "amber";
  return null;
}

export function formatUsd(value: number): string {
  if (value > 0 && value < 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(2)}`;
}

/** Token and cost line shared by the transcript footer and usage panel. */
export function formatUsageTotalsLine(usage: MessageUsageType): string {
  return `${usage.inputTokens.toLocaleString()} in · ${usage.outputTokens.toLocaleString()} out · ${formatUsd(usage.costUsd)}`;
}

export function sessionUsageCsv(messages: ChatMessageType[]): string {
  const header = "messageId,role,modelId,inputTokens,outputTokens,costUsd";
  const rows = messages
    .filter((message) => message.usage)
    .map((message) =>
      [
        message.id,
        message.role,
        message.modelId ?? "",
        message.usage?.inputTokens ?? 0,
        message.usage?.outputTokens ?? 0,
        message.usage?.costUsd ?? 0,
      ].join(","),
    );
  return [header, ...rows].join("\n");
}

export function sessionUsageJson(
  messages: ChatMessageType[],
  totals: ChatMessageType["usage"],
): string {
  return JSON.stringify(
    {
      totals,
      messages: messages
        .filter((message) => message.usage)
        .map((message) => ({
          id: message.id,
          role: message.role,
          modelId: message.modelId ?? null,
          usage: message.usage,
        })),
    },
    null,
    2,
  );
}

export function downloadText(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
