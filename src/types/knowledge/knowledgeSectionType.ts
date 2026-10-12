export type ProductIdType = "ledger" | "pulse" | "relay" | "vault";

export type KnowledgeSectionType = {
  id: string;
  fileName: string;
  product: ProductIdType | null;
  title: string;
  headingPath: string;
  body: string;
  kind: "section" | "table-row";
};
