/**
 * 赛事管理 API
 * 后端前缀: /api/admin/competitions
 */
import { httpClient } from "@/utils/http";
import { z } from "zod/v4";

// ──────────────────────────────────────────────────────────────
// Schemas
// ──────────────────────────────────────────────────────────────

/** 赛事状态: 0=待审核 1=已发布 2=已驳回 */
export type CompetitionStatus = 0 | 1 | 2;

export const CompetitionItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  course_type: z.string(),
  location: z.string(),
  start_at: z.string(),
  end_at: z.string(),
  ext_link: z.string(),
  enroll_req: z.unknown().nullable(),
  status: z.number(),
  creator_id: z.number(),
  created_at: z.string(),
  tags: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
      }),
    )
    .nullable(),
});

export type CompetitionItem = z.infer<typeof CompetitionItemSchema>;

// ──────────────────────────────────────────────────────────────
// Request DTOs
// ──────────────────────────────────────────────────────────────

export interface CreateCompetitionReq {
  name: string;
  course_type: "trail" | "road" | "race" | "other";
  location: string;
  start_at: string; // ISO 8601
  end_at: string;
  ext_link?: string;
  enroll_req?: unknown;
  tags?: string[];
}

export interface UpdateCompetitionReq {
  name: string;
  course_type: "trail" | "road" | "race" | "other";
  location?: string;
  start_at?: string;
  end_at?: string;
  ext_link?: string;
  enroll_req?: unknown;
  tags?: string[];
}

export interface ApproveReq {
  remark?: string;
}

// ──────────────────────────────────────────────────────────────
// Query params
// ──────────────────────────────────────────────────────────────

export interface ListCompetitionsParams {
  keyword?: string;
  course_type?: string;
  status?: number;
  last_id?: number;
  limit?: number;
  [key: string]: string | number | null | undefined;
}

// ──────────────────────────────────────────────────────────────
// Endpoints
// ──────────────────────────────────────────────────────────────

const BASE = "/api/admin/competitions";

/**
 * GET /api/admin/competitions
 * 赛事列表（Keyset 分页）
 */
export async function getCompetitionList(
  params?: ListCompetitionsParams,
): Promise<{ competitions: CompetitionItem[]; has_more: boolean }> {
  return httpClient.get(BASE, { params });
}

/**
 * GET /api/admin/competitions/:id
 * 赛事详情
 */
export async function getCompetition(id: number): Promise<CompetitionItem> {
  return httpClient.get(`${BASE}/${id}`);
}

/**
 * POST /api/admin/competitions
 * 管理员直接创建赛事
 */
export async function createCompetition(req: CreateCompetitionReq): Promise<CompetitionItem> {
  return httpClient.post(BASE, req);
}

/**
 * PUT /api/admin/competitions/:id
 * 编辑赛事
 */
export async function updateCompetition(id: number, req: UpdateCompetitionReq): Promise<void> {
  return httpClient.put(`${BASE}/${id}`, req);
}

/**
 * POST /api/admin/competitions/:id/approve
 * 审核通过
 */
export async function approveCompetition(id: number, req?: ApproveReq): Promise<void> {
  return httpClient.post(`${BASE}/${id}/approve`, req ?? {});
}

/**
 * POST /api/admin/competitions/:id/reject
 * 审核驳回
 */
export async function rejectCompetition(id: number, req?: ApproveReq): Promise<void> {
  return httpClient.post(`${BASE}/${id}/reject`, req ?? {});
}

/**
 * DELETE /api/admin/competitions/:id
 * 软删除赛事
 */
export async function deleteCompetition(id: number): Promise<void> {
  return httpClient.delete(`${BASE}/${id}`);
}
