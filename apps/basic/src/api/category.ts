import { httpClient } from "@/utils/http";
import { z } from "zod/v4";

const BASE = "/api/admin";

export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  module_type: z.string().nullable(),
  parent_id: z.number().nullable(),
  sort_order: z.number(),
  children: z
    .array(z.lazy((): z.ZodTypeAny => CategorySchema))
    .nullable()
    .default(null),
});

export type Category = z.infer<typeof CategorySchema>;

export interface CreateCategoryReq {
  name: string;
  module_type: string;
  parent_id?: number;
  sort_order?: number;
}

export interface UpdateCategoryReq {
  name?: string;
  sort_order?: number;
}

/**
 * GET /api/admin/categories
 * 返回分类树
 */
export async function getCategoryTree(type?: string): Promise<Category[]> {
  const url = type ? `${BASE}/categories?type=${type}` : `${BASE}/categories`;
  const res = await httpClient.get<{ tree?: Category[] } | Category[]>(url);
  // 后端可能返回 { tree: [...] } 或直接返回数组，兼容两种格式
  if (Array.isArray(res)) return res;
  return res.tree ?? [];
}

/** POST /api/admin/categories */
export async function createCategory(req: CreateCategoryReq): Promise<void> {
  return httpClient.post(`${BASE}/categories`, req);
}

/** PUT /api/admin/categories/:id */
export async function updateCategory(id: number, req: UpdateCategoryReq): Promise<void> {
  return httpClient.put(`${BASE}/categories/${id}`, req);
}

/** DELETE /api/admin/categories/:id */
export async function deleteCategory(id: number): Promise<void> {
  return httpClient.delete(`${BASE}/categories/${id}`);
}
