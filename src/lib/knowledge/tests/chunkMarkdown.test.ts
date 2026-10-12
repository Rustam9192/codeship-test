import { describe, expect, it } from "vitest";

import { chunkMarkdown } from "@/lib/knowledge/chunkMarkdown";

const markdown = `# Relay

Intro line.

## Pricing

| Tier | Price |
| --- | --- |
| Pro | $49 |
| Enterprise | $99 |
`;

describe("chunkMarkdown", () => {
  it("splits headings and keeps one section per table row", () => {
    const sections = chunkMarkdown("relay.md", markdown);
    const rows = sections.filter((section) => section.kind === "table-row");

    expect(sections.some((section) => section.headingPath === "Relay / Pricing")).toBe(true);
    expect(rows.map((section) => section.title)).toEqual([
      "Pricing / Pro",
      "Pricing / Enterprise",
    ]);
    expect(rows[0]?.body).toContain("$49");
    expect(rows[0]?.body).not.toContain("$99");
    expect(rows[0]?.product).toBe("relay");
  });
});
