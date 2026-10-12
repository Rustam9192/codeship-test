import { describe, expect, it } from "vitest";

import { buildSystemPrompt, refusalText, toCitations } from "@/lib/chat/buildSystemPrompt";
import type { KnowledgeSectionType } from "@/types/knowledge/knowledgeSectionType";

const section: KnowledgeSectionType = {
  id: "relay.md::Pricing::section",
  fileName: "relay.md",
  product: "relay",
  title: "Pricing",
  headingPath: "Relay / Pricing",
  body: "Pro is $49.",
  kind: "section",
};

describe("buildSystemPrompt", () => {
  it("includes only the retrieved passage and the disagreement rule", () => {
    const prompt = buildSystemPrompt([section]);

    expect(prompt).toContain("relay.md — Relay / Pricing");
    expect(prompt).toContain("Pro is $49.");
    expect(prompt).toContain("cite both sources");
  });

  it("keeps the refusal wording stable and shortens long excerpts", () => {
    expect(refusalText()).toContain("not in the NimbusStack knowledge base");
    const citation = toCitations([{ ...section, body: "a".repeat(500) }])[0];

    expect(citation?.excerpt).toHaveLength(420);
    expect(citation?.fileName).toBe("relay.md");
  });
});
