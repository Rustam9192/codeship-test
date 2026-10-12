import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { chunkMarkdown } from "@/lib/knowledge/chunkMarkdown";
import { KNOWLEDGE_BASE_DIR } from "@/lib/knowledge/shared";
import type { KnowledgeSectionType } from "@/types/knowledge/knowledgeSectionType";

/**
 * Reads every markdown file in a knowledge folder. Callers own the path.
 */
export function loadKnowledgeSections(directory: string): KnowledgeSectionType[] {
  const fileNames = readdirSync(directory)
    .filter((fileName) => fileName.toLowerCase().endsWith(".md"))
    .sort();

  return fileNames.flatMap((fileName) =>
    chunkMarkdown(fileName, readFileSync(join(directory, fileName), "utf8")),
  );
}

let cachedSections: KnowledgeSectionType[] | null = null;

/**
 * Loads the repo knowledge base once per server process.
 */
export function getKnowledgeSections(): KnowledgeSectionType[] {
  if (!cachedSections) {
    cachedSections = loadKnowledgeSections(KNOWLEDGE_BASE_DIR);
  }
  return cachedSections;
}
