import { headers } from "next/headers";

import { MODEL_CATALOG, toPublicModel } from "@/lib/models";

/**
 * Public model list. Availability reflects server env keys and never returns the keys.
 */
export async function GET() {
  await headers();
  return Response.json({
    models: MODEL_CATALOG.map(toPublicModel),
  });
}
