import { describe, expect, it } from "vitest";

import { loadKnowledgeSections } from "@/lib/knowledge/loadKnowledge";
import { retrieveSections } from "@/lib/knowledge/retrieveSections";
import { KNOWLEDGE_BASE_DIR } from "@/lib/knowledge/shared";

const sections = loadKnowledgeSections(KNOWLEDGE_BASE_DIR);

describe("retrieveSections", () => {
  it("ranks the Relay 4.2 release notes first", () => {
    const hits = retrieveSections(
      "What new features were released in v4.2 of Relay?",
      [],
      sections,
    );

    expect(hits[0]?.fileName).toBe("relay-release-notes.md");
    expect(hits[0]?.title.toLowerCase()).toContain("4.2");
    expect(hits[0]?.body).toContain("Request replay");
  });

  it("returns the Pulse Salesforce integration, including the version", () => {
    const hits = retrieveSections(
      "Does Pulse integrate with Salesforce? What version is required?",
      [],
      sections,
    );

    expect(hits[0]?.fileName).toBe("pulse.md");
    expect(hits[0]?.body).toMatch(/Salesforce/);
    expect(hits[0]?.body).toMatch(/4\.3|v59/);
  });

  it("covers SAML for every product and the company security overview", () => {
    const hits = retrieveSections(
      "Which of our products support SSO via SAML 2.0?",
      [],
      sections,
    );
    const files = new Set(hits.map((hit) => hit.fileName));

    expect(files.has("security-overview.md")).toBe(true);
    expect(files.has("ledger.md")).toBe(true);
    expect(files.has("pulse.md")).toBe(true);
    expect(files.has("relay.md")).toBe(true);
    expect(files.has("vault.md")).toBe(true);
    expect(hits.some((hit) => hit.fileName === "vault.md" && /SAML 2\.0/.test(hit.body))).toBe(
      true,
    );
    expect(
      hits.some(
        (hit) =>
          hit.fileName === "security-overview.md" &&
          /Vault/.test(hit.body) &&
          /Enterprise/.test(hit.body),
      ),
    ).toBe(true);
  });

  it("returns the Relay P1 row and not a neighboring priority row", () => {
    const hits = retrieveSections(
      "What's the SLA for Priority 1 support tickets on Relay Enterprise?",
      [],
      sections,
    );
    const tableRows = hits.filter((hit) => hit.kind === "table-row");

    expect(hits[0]?.title.toLowerCase()).toContain("p1");
    expect(hits[0]?.body).toContain("15 minutes");
    expect(tableRows.every((hit) => !/\bp2\b/i.test(hit.title))).toBe(true);
  });

  it("finds both 403 troubleshooting sections when no product is named", () => {
    const hits = retrieveSections(
      "A client is getting a 403 on the API. What should they check first?",
      [],
      sections,
    );
    const troubleshooting = hits.filter((hit) => /troubleshooting/i.test(hit.title));
    const files = new Set(troubleshooting.map((hit) => hit.fileName));

    expect(files.has("pulse.md")).toBe(true);
    expect(files.has("relay.md")).toBe(true);
  });

  it("keeps the product from the previous turn on a follow-up", () => {
    const hits = retrieveSections(
      "what about its SLA?",
      ["Does Relay integrate with Salesforce?"],
      sections,
    );

    expect(hits[0]?.product).toBe("relay");
    expect(hits.some((hit) => /support sla/i.test(hit.title))).toBe(true);
  });

  it("includes both Relay Pro prices when the documents disagree", () => {
    const hits = retrieveSections("What does Relay Pro cost?", [], sections);
    const blob = hits.map((hit) => hit.body).join("\n");

    expect(blob).toContain("$49");
    expect(blob).toContain("$59");
  });

  it("still finds SAML passages for a loosely worded sign-on question", () => {
    const hits = retrieveSections("does it do single sign-on?", [], sections);

    expect(hits.some((hit) => /saml/i.test(hit.body))).toBe(true);
  });

  it("returns nothing when the question is outside the documents", () => {
    const hits = retrieveSections("What is the office dog's name?", [], sections);

    expect(hits).toEqual([]);
  });
});
