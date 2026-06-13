import { httpClient } from "@/utils/http";
import { z } from "zod/v4";

const BASE = "/api/admin";

export const TagSchema = z.object({
  id: z.number(),
  name: z.string(),
  usage_count: z.number(),
  created_at: z.number(),
});

export type Tag = z.infer<typeof TagSchema>;

export interface ListTagsReq {
  q?: string;
  limit?: number;
}

export interface ListTagsRes {
  tags: Tag[];
}

/** GET /api/admin/tags */
export async function getTags(req: ListTagsReq): Promise<Tag[]> {
  const res = await httpClient.get<ListTagsRes>(`${BASE}/tags`, { params: req as any });
  return res.tags || [];
}
