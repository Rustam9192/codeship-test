import type {
  KnowledgeSectionType,
  ProductIdType,
} from "@/types/knowledge/knowledgeSectionType";

const PRODUCT_IDS: ProductIdType[] = ["ledger", "pulse", "relay", "vault"];

const STOP_WORDS = new Set([
  "what",
  "are",
  "the",
  "and",
  "for",
  "with",
  "does",
  "this",
  "that",
  "about",
  "its",
  "from",
  "how",
  "was",
  "were",
  "you",
  "can",
  "our",
  "who",
  "which",
  "their",
  "they",
  "should",
  "check",
  "first",
  "getting",
  "client",
  "between",
  "into",
  "have",
  "has",
  "not",
  "but",
  "all",
  "any",
  "new",
  "key",
]);

type QueryIntentType = {
  products: ProductIdType[];
  version: string | null;
  salesforce: boolean;
  saml: boolean;
  forbidden: boolean;
  sla: boolean;
  priority: "p1" | "p2" | "p3" | "p4" | null;
  pricing: boolean;
  compareTiers: boolean;
  release: boolean;
};

/**
 * Ranks knowledge sections for a question, using earlier turns when the product is implied.
 */
export function retrieveSections(
  query: string,
  history: string[],
  sections: KnowledgeSectionType[],
): KnowledgeSectionType[] {
  const intent = detectIntent(query, history);
  const terms = queryTerms(query, intent);
  const ranked = sections
    .map((section) => ({
      section,
      score: scoreSection(section, intent, terms),
    }))
    .filter((item) => item.score >= 4)
    .sort((left, right) => right.score - left.score);

  return selectSections(ranked, intent, sections);
}

function detectIntent(query: string, history: string[]): QueryIntentType {
  const text = query.toLowerCase();
  const crossProduct =
    /which (of )?(our )?products|all (of )?(our )?products|every product/.test(
      text,
    );
  const named = productsIn(query);
  const products =
    named.length > 0
      ? named
      : crossProduct
        ? []
        : productsFromHistory(history);
  const version = findVersion(query);
  const priority = findPriority(text);

  return {
    products,
    version,
    salesforce: /salesforce/.test(text),
    saml: /saml|sso|single sign-?on|federated login|sign-on/.test(text),
    forbidden: /\b403\b|forbidden/.test(text),
    sla: /\bsla\b|support ticket|priority\s*[1-4]|\bp[1-4]\b/.test(text),
    priority,
    pricing: /pric|cost|tier|\bpro\b|\benterprise\b/.test(text),
    compareTiers:
      /difference|compare|versus|\bvs\b/.test(text) &&
      /\bpro\b/.test(text) &&
      /\benterprise\b/.test(text),
    release: /release|new features|what's new|shipped/.test(text) || version !== null,
  };
}

function findVersion(query: string): string | null {
  for (const match of query.matchAll(/\bv?(\d+\.\d+)\b/gi)) {
    const index = match.index ?? 0;
    const before = query.slice(Math.max(0, index - 16), index).toLowerCase();
    if (/\b(saml|oidc|tls)\s*$/.test(before)) {
      continue;
    }
    const token = match[0].toLowerCase();
    if (token.startsWith("v") || /version\s+$/.test(before)) {
      return match[1];
    }
  }
  return null;
}

function findPriority(text: string): QueryIntentType["priority"] {
  if (/\bp1\b|priority\s*1/.test(text)) return "p1";
  if (/\bp2\b|priority\s*2/.test(text)) return "p2";
  if (/\bp3\b|priority\s*3/.test(text)) return "p3";
  if (/\bp4\b|priority\s*4/.test(text)) return "p4";
  return null;
}

function productsIn(text: string): ProductIdType[] {
  return PRODUCT_IDS.filter((product) =>
    new RegExp(`\\b${product}\\b`, "i").test(text),
  );
}

function productsFromHistory(history: string[]): ProductIdType[] {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const found = productsIn(history[index]);
    if (found.length > 0) {
      return found;
    }
  }
  return [];
}

function queryTerms(query: string, intent: QueryIntentType): string[] {
  const words = query
    .toLowerCase()
    .split(/[^a-z0-9.]+/)
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
  const extra = [
    intent.saml ? "saml" : "",
    intent.saml ? "sso" : "",
    intent.saml ? "federated" : "",
    intent.forbidden ? "403" : "",
    intent.forbidden ? "forbidden" : "",
    intent.sla ? "sla" : "",
    intent.priority ?? "",
    intent.salesforce ? "salesforce" : "",
    intent.version ?? "",
    ...intent.products,
  ];
  return [...new Set([...words, ...extra.filter(Boolean)])];
}

function scoreSection(
  section: KnowledgeSectionType,
  intent: QueryIntentType,
  terms: string[],
): number {
  const title = section.title.toLowerCase();
  const body = section.body.toLowerCase();
  let score = 0;

  for (const term of terms) {
    if (includesTerm(title, term)) score += 3;
    if (includesTerm(body, term)) score += 1;
  }

  if (intent.products.length === 1) {
    if (section.product === intent.products[0]) score += 8;
    else if (section.product) score -= 6;
  }

  if (intent.version && title.includes(intent.version)) {
    score += section.fileName.includes("release") ? 24 : 8;
  }

  if (intent.salesforce && title.includes("integration")) score += 8;
  if (intent.salesforce && body.includes("salesforce")) score += 4;
  if (intent.saml && /saml|sso|sign-on|federated|openid/.test(`${title}\n${body}`)) {
    score += 6;
  }
  if (intent.saml && section.fileName === "security-overview.md") score += 8;
  if (intent.forbidden && title.includes("troubleshooting")) score += 12;
  if (intent.sla && title.includes("support sla")) score += 10;

  if (intent.priority && section.kind === "table-row") {
    if (title.includes(intent.priority)) score += 18;
    else if (/\bp[1-4]\b/.test(title)) score -= 14;
  }

  if (intent.compareTiers && title.includes("pricing") && section.kind === "section") {
    score += 14;
  } else if (
    intent.pricing &&
    title.includes("pricing") &&
    section.kind === "section"
  ) {
    score += 6;
  }

  if (intent.release && section.fileName.includes("release-notes")) score += 5;

  return score;
}

function selectSections(
  ranked: { section: KnowledgeSectionType; score: number }[],
  intent: QueryIntentType,
  sections: KnowledgeSectionType[],
): KnowledgeSectionType[] {
  let picked = ranked.slice(0, 8).map((item) => item.section);

  if (intent.version) {
    const exact = ranked.find(
      (item) =>
        item.section.fileName.includes("release") &&
        item.section.title.toLowerCase().includes(intent.version ?? ""),
    );
    if (exact) {
      picked = unique([exact.section, ...picked]);
    }
  }

  if (intent.saml && intent.products.length !== 1) {
    const required: KnowledgeSectionType[] = [];
    const security = ranked.find(
      (item) =>
        item.section.fileName === "security-overview.md" &&
        /saml/i.test(item.section.body),
    );
    if (security) required.push(security.section);

    for (const product of PRODUCT_IDS) {
      const best = ranked.find(
        (item) =>
          item.section.fileName === `${product}.md` &&
          /saml|sso|federated|openid|sign-on/i.test(
            `${item.section.title}\n${item.section.body}`,
          ),
      );
      if (best) required.push(best.section);
    }
    picked = unique([...required, ...picked]);
  }

  if (intent.forbidden && intent.products.length === 0) {
    const troubleshooting = sections.filter(
      (section) =>
        section.kind === "section" &&
        /troubleshooting/i.test(section.title) &&
        /403|forbidden/i.test(section.body),
    );
    picked = unique([...troubleshooting, ...picked]);
  }

  if (intent.priority) {
    const rows = ranked
      .map((item) => item.section)
      .filter(
        (section) =>
          section.kind === "table-row" &&
          section.title.toLowerCase().includes(intent.priority ?? "") &&
          (intent.products.length !== 1 ||
            section.product === intent.products[0] ||
            section.product === null),
      );
    picked = unique([
      ...rows,
      ...picked.filter(
        (section) =>
          section.kind !== "table-row" ||
          section.title.toLowerCase().includes(intent.priority ?? ""),
      ),
    ]);
  }

  if (intent.pricing && intent.products.length === 1) {
    const notes = sections.filter(
      (section) =>
        section.product === intent.products[0] &&
        section.fileName.includes("release-notes") &&
        /\$\d|pricing/i.test(`${section.title}\n${section.body}`),
    );
    picked = unique([...picked, ...notes]);
  }

  return picked.slice(0, 12);
}

function includesTerm(haystack: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(haystack);
}

function unique(sections: KnowledgeSectionType[]): KnowledgeSectionType[] {
  const seen = new Set<string>();
  const result: KnowledgeSectionType[] = [];
  for (const section of sections) {
    if (seen.has(section.id)) continue;
    seen.add(section.id);
    result.push(section);
  }
  return result;
}
