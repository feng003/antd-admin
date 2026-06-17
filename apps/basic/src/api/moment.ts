/**
 * 动态管理 API
 * 后端前缀: /api/admin/moments
 */
import { httpClient } from "@/utils/http";
import { z } from "zod/v4";

// ──────────────────────────────────────────────────────────────
// Schemas
// ──────────────────────────────────────────────────────────────

/** 动态可见性: 0=公开 1=好友 2=指定人 3=仅自己 */
export type MomentVisibility = 0 | 1 | 2 | 3;

export const MomentMediaSchema = z.object({
  id: z.number(),
  url: z.string(),
  media_type: z.string().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  size: z.number().nullable(),
  sort_order: z.number(),
  created_at: z.string(),
});

export type MomentMedia = z.infer<typeof MomentMediaSchema>;

export const MomentItemSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  competition_id: z.number(),
  content: z.string(),
  visibility: z.number(),
  like_count: z.number(),
  comment_count: z.number(),
  liked_by_me: z.boolean(),
  medias: z.array(MomentMediaSchema).nullable(),
  created_at: z.string(),
});

export type MomentItem = z.infer<typeof MomentItemSchema>;

// ──────────────────────────────────────────────────────────────
// Query params
// ──────────────────────────────────────────────────────────────

export interface ListMomentsParams {
  competition_id?: number;
  user_id?: number;
  last_id?: number;
  limit?: number;
  [key: string]: string | number | null | undefined;
}

// ──────────────────────────────────────────────────────────────
// Endpoints
// ──────────────────────────────────────────────────────────────

const BASE = "/api/admin/moments";

/**
 * GET /api/admin/moments
 * 动态列表（Keyset 分页，B 端全量）
 */
export async function getMomentList(
  params?: ListMomentsParams,
): Promise<{ moments: MomentItem[]; has_more: boolean }> {
  return httpClient.get(BASE, { params });
}

/**
 * DELETE /api/admin/moments/:id
 * 强制下线动态（reason 作为请求 body 由后端 ShouldBindJSON 解析）
 */
export async function forceDeleteMoment(id: number, reason?: string): Promise<void> {
  // httpClient.delete 不支持 body；后端通过 ShouldBindJSON 读取，故直接用 fetch
  const { getAccessToken } = await import("@/stores/auth");
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`/api/admin/moments/${id}`, {
    method: "DELETE",
    headers,
    body: JSON.stringify({ reason: reason ?? "" }),
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(json.message ?? `HTTP ${res.status}`);
  }
}
