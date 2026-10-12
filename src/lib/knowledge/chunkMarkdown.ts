import type {
  KnowledgeSectionType,
  ProductIdType,
} from "@/types/knowledge/knowledgeSectionType";

const HEADING_PATTERN = /^(#{1,6})\s+(.+?)\s*#*$/;
const PRODUCT_IDS: ProductIdType[] = ["ledger", "pulse", "relay", "vault"];

/**
 * Splits one markdown file into heading sections and one section per table row.
 */
export function chunkMarkdown(
  fileName: string,
  markdown: string,
): KnowledgeSectionType[] {
  const product = productFromFileName(fileName);
  const blocks = splitByHeading(fileName, markdown);
  const sections: KnowledgeSectionType[] = [];

  for (const block of blocks) {
    const body = block.lines.join("\n").trim();
    if (!body && block.title === fileName) {
      continue;
    }

    const section: KnowledgeSectionType = {
      id: sectionId(fileName, block.headingPath, "section"),
      fileName,
      product,
      title: block.title,
      headingPath: block.headingPath,
      body,
      kind: "section",
    };
    sections.push(section);
    sections.push(...tableRowSections(section));
  }

  return sections;
}

function productFromFileName(fileName: string): ProductIdType | null {
  const base = fileName.toLowerCase();
  return PRODUCT_IDS.find((product) => base.startsWith(product)) ?? null;
}

type HeadingBlock = {
  title: string;
  headingPath: string;
  lines: string[];
};

function splitByHeading(fileName: string, markdown: string): HeadingBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: HeadingBlock[] = [];
  const stack: { level: number; title: string }[] = [];
  let current: HeadingBlock | null = null;

  const flush = () => {
    if (current) {
      blocks.push(current);
    }
  };

  for (const line of lines) {
    const match = HEADING_PATTERN.exec(line);
    if (!match) {
      if (!current) {
        current = {
          title: fileName.replace(/\.md$/i, ""),
          headingPath: fileName,
          lines: [],
        };
      }
      current.lines.push(line);
      continue;
    }

    flush();
    const level = match[1].length;
    const title = match[2].trim();
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }
    stack.push({ level, title });
    current = {
      title,
      headingPath: stack.map((item) => item.title).join(" / "),
      lines: [],
    };
  }

  flush();
  return blocks;
}

function tableRowSections(
  section: KnowledgeSectionType,
): KnowledgeSectionType[] {
  const rows: KnowledgeSectionType[] = [];
  const lines = section.body.split("\n");
  let index = 0;

  while (index < lines.length) {
    if (!isTableLine(lines[index])) {
      index += 1;
      continue;
    }

    const tableLines: string[] = [];
    while (index < lines.length && isTableLine(lines[index])) {
      tableLines.push(lines[index]);
      index += 1;
    }

    if (tableLines.length < 2) {
      continue;
    }

    const header = tableLines[0];
    const separator = isSeparatorLine(tableLines[1]) ? tableLines[1] : null;
    const dataStart = separator ? 2 : 1;

    for (const line of tableLines.slice(dataStart)) {
      if (isSeparatorLine(line)) {
        continue;
      }
      const label = firstCell(line);
      if (!label) {
        continue;
      }
      const body = [header, separator, line].filter(Boolean).join("\n");
      rows.push({
        id: sectionId(section.fileName, section.headingPath, `row:${label}`),
        fileName: section.fileName,
        product: section.product,
        title: `${section.title} / ${label}`,
        headingPath: `${section.headingPath} / ${label}`,
        body,
        kind: "table-row",
      });
    }
  }

  return rows;
}

function isTableLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.endsWith("|");
}

function isSeparatorLine(line: string): boolean {
  return /^\|?[\s|:-]+\|$/.test(line.trim()) && line.includes("-");
}

function firstCell(line: string): string {
  return line.split("|")[1]?.trim() ?? "";
}

function sectionId(fileName: string, headingPath: string, kind: string): string {
  return `${fileName}::${headingPath}::${kind}`;
}
