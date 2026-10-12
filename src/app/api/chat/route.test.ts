import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/chat/runChat", () => ({
  runChat: vi.fn(),
}));

import { runChat } from "@/lib/chat/runChat";

import { POST } from "./route";

describe("POST /api/chat", () => {
  it("rejects an empty question before calling a provider", async () => {
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: "gemini",
          messages: [{ role: "user", content: "   " }],
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(runChat).not.toHaveBeenCalled();
  });
});
