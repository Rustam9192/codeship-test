export type ProviderFailureType = {
  kind: "rate-limit" | "auth" | "unavailable";
  message: string;
};

/**
 * Turns a provider exception into a message an employee can act on.
 */
export function describeProviderError(error: unknown): ProviderFailureType {
  const related = relatedErrors(error);
  const text = related.map(errorText).join("\n");
  const statuses = related
    .map(statusCodeOf)
    .filter((code): code is number => code !== undefined);
  const status = statuses.includes(429) ? 429 : statuses[0];

  if (
    status === 429 ||
    /rate[- ]limit|too many requests|resource exhausted|quota exceeded/i.test(text)
  ) {
    return {
      kind: "rate-limit",
      message:
        "The provider is rate-limiting requests. Wait a moment and try again, or switch to another model.",
    };
  }

  if (
    status === 401 ||
    status === 403 ||
    /api key|unauthorized|invalid[_\s-]?api|permission denied/i.test(text)
  ) {
    return {
      kind: "auth",
      message:
        "The provider rejected the API key. Check the server environment variable for that provider.",
    };
  }

  return {
    kind: "unavailable",
    message: "That provider is unavailable right now. Switch models, or try again shortly.",
  };
}

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "";
}

function relatedErrors(error: unknown): unknown[] {
  if (typeof error !== "object" || error === null) return [error];
  const record = error as { lastError?: unknown; cause?: unknown; errors?: unknown };
  const nested = [error];
  if (record.lastError) nested.push(record.lastError);
  if (record.cause && record.cause !== error) nested.push(record.cause);
  if (Array.isArray(record.errors)) nested.push(...record.errors);
  return nested;
}

function statusCodeOf(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const record = error as { statusCode?: unknown; status?: unknown };
  if (typeof record.statusCode === "number") return record.statusCode;
  if (typeof record.status === "number") return record.status;
  return undefined;
}
