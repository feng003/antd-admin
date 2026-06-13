/**
 * CMS 文章 / 媒体库 API
 * 后端前缀: /api/admin/cms/
 */
import { httpClient } from "@/utils/http";
import { z } from "zod/v4";

// ──────────────────────────────────────────────────────────────
// Schemas
// ──────────────────────────────────────────────────────────────

/** 文章状态: draft=草稿 pending=审批中 published=已发布 archived=已归档 */
export type ArticleStatus = "draft" | "pending" | "published" | "archived";

export const ArticleListItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string().nullable(),
  status: z.string(),
  author_id: z.number(),
  author_name: z.string().nullable(),
  published_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ArticleListItem = z.infer<typeof ArticleListItemSchema>;

export const MediaItemSchema = z.object({
  id: z.number(),
  filename: z.string(),
  original_name: z.string().nullable(),
  mime_type: z.string().nullable(),
  size: z.number().nullable(),
  url: z.string(),
  created_at: z.string(),
});

export type MediaItem = z.infer<typeof MediaItemSchema>;

// ──────────────────────────────────────────────────────────────
// Endpoints
// ──────────────────────────────────────────────────────────────

const BASE = "/api/admin/cms";

// ── 文章 ──────────────────────────────────────────────────────

export interface ListArticlesParams {
  page?: number;
  page_size?: number;
  status?: ArticleStatus;
  keyword?: string;
  [key: string]: string | number | null | undefined;
}

/**
 * GET /api/admin/cms/articles
 */
export async function getArticleList(
  params?: ListArticlesParams,
): Promise<{ list: ArticleListItem[]; total: number }> {
  return httpClient.get(`${BASE}/articles`, { params });
}

/**
 * GET /api/admin/cms/articles/:id
 */
export async function getArticle(id: number): Promise<unknown> {
  return httpClient.get(`${BASE}/articles/${id}`);
}

export interface CreateArticleReq {
  title: string;
  slug?: string;
  content?: string;
  summary?: string;
  cover_image?: string;
  category_id?: number;
  tag_ids?: number[];
  status?: ArticleStatus;
}

/**
 * POST /api/admin/cms/articles
 */
export async function createArticle(req: CreateArticleReq): Promise<{ id: number }> {
  return httpClient.post(`${BASE}/articles`, req);
}

/**
 * PUT /api/admin/cms/articles/:id
 */
export async function updateArticle(id: number, req: Partial<CreateArticleReq>): Promise<void> {
  return httpClient.put(`${BASE}/articles/${id}`, req);
}

/**
 * PATCH /api/admin/cms/articles/:id/status
 */
export async function updateArticleStatus(id: number, status: ArticleStatus): Promise<void> {
  return httpClient.post(`${BASE}/articles/${id}/status`, { status });
}

/**
 * DELETE /api/admin/cms/articles/:id
 */
export async function deleteArticle(id: number): Promise<void> {
  return httpClient.delete(`${BASE}/articles/${id}`);
}

/** GET /api/admin/cms/articles/:id/versions — 文章版本历史 */
export async function getArticleVersions(id: number): Promise<unknown[]> {
  return httpClient.get(`${BASE}/articles/${id}/versions`);
}

/** POST /api/admin/cms/articles/:id/versions/:version_id/rollback — 回滚到指定版本 */
export async function rollbackArticleVersion(articleId: number, versionId: number): Promise<void> {
  return httpClient.post(`${BASE}/articles/${articleId}/versions/${versionId}/rollback`);
}

// ── 媒体库 ────────────────────────────────────────────────────

export interface ListMediaParams {
  page?: number;
  page_size?: number;
  mime_type?: string;
  [key: string]: string | number | null | undefined;
}

/**
 * GET /api/admin/cms/media
 */
export async function getMediaList(
  params?: ListMediaParams,
): Promise<{ list: MediaItem[]; total: number }> {
  return httpClient.get(`${BASE}/media`, { params });
}

/**
 * DELETE /api/admin/cms/media/:id
 */
export async function deleteMedia(id: number): Promise<void> {
  return httpClient.delete(`${BASE}/media/${id}`);
}
