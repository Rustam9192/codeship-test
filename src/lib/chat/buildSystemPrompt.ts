import type { CitationType } from "@/types/chat/chatMessageType";
import type { KnowledgeSectionType } from "@/types/knowledge/knowledgeSectionType";

const NOT_IN_KNOWLEDGE_BASE =
  "This is not in the NimbusStack knowledge base. I can only answer from the supplied product documents.";

/**
 * Instructions plus the retrieved passages. The model is not given the rest of the corpus.
 */
export function buildSystemPrompt(sections: KnowledgeSectionType[]): string {
  const passages = sections
    .map(
      (section, index) =>
        `Passage ${index + 1} — ${section.fileName} — ${section.headingPath}\n${section.body}`,
    )
    .join("\n\n");

  return `You are the NimbusStack internal product assistant. Employees ask about Ledger, Pulse, Relay, and Vault.

Answer using only the passages below. Do not use outside knowledge, and do not fill gaps from memory.

- If the passages do not contain the answer, say clearly that it is not in the knowledge base.
- If only part of the question is covered, answer that part and say what the documents do not cover.
- If two passages disagree, point out the disagreement and cite both sources. Do not quietly pick one.
- For a single table cell (one tier, one priority), use that row and column only. Do not substitute the neighboring row.
- Follow-up questions refer to the product and topic already in the conversation.
- Be concise and skimmable. Name the source file when you state a figure.

${passages}`;
}

export function refusalText(): string {
  return NOT_IN_KNOWLEDGE_BASE;
}

export function toCitations(sections: KnowledgeSectionType[]): CitationType[] {
  return sections.map((section) => ({
    fileName: section.fileName,
    title: section.headingPath,
    excerpt: section.body.trim().slice(0, 420),
  }));
}
