import { httpClient } from "@/utils/http";
import { z } from "zod/v4";

const BASE = "/api/admin";

export const AuditLogSchema = z.object({
  id: z.number(),
  operator_id: z.number(),
  operator_name: z.string(),
  action: z.string(),
  resource_type: z.string(),
  resource_id: z.string(),
  reason: z.string(),
  remark: z.string(),
  operated_at: z.string(),
  created_at: z.string(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

export interface ListAuditLogsReq {
  page?: number;
  page_size?: number;
  operator_name?: string;
  action?: string;
  resource_type?: string;
  [key: string]: string | number | null | undefined;
}

export interface ListAuditLogsRes {
  list: AuditLog[];
  total: number;
}

/** GET /api/admin/sys-audit-logs */
export async function getAuditLogs(req: ListAuditLogsReq): Promise<ListAuditLogsRes> {
  return httpClient.get(`${BASE}/sys-audit-logs`, { params: req });
}
