import { describe, expect, it } from "vitest";

import { describeProviderError } from "@/lib/chat/providerError";

describe("describeProviderError", () => {
  it("reads a rate limit wrapped by a retry error", () => {
    const failure = describeProviderError({
      message: "Failed after 3 attempts",
      lastError: Object.assign(new Error("quota exceeded for the free tier"), {
        statusCode: 429,
      }),
      errors: [Object.assign(new Error("high demand"), { statusCode: 503 })],
    });

    expect(failure.kind).toBe("rate-limit");
  });

  it("reports a rejected key separately from an outage", () => {
    expect(describeProviderError(Object.assign(new Error("nope"), { statusCode: 401 })).kind).toBe(
      "auth",
    );
    expect(describeProviderError(new Error("socket closed")).kind).toBe("unavailable");
  });
});
