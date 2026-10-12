import { join } from "node:path";

import type { ProductIdType } from "@/types/knowledge/knowledgeSectionType";

export const KNOWLEDGE_BASE_DIR = join(process.cwd(), "nimbusstack-knowledge-base");

export const PRODUCT_IDS: ProductIdType[] = ["ledger", "pulse", "relay", "vault"];
