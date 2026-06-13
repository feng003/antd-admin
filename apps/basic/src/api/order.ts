/**
 * 订单 API
 * 后端前缀: /api/admin/
 */
import { httpClient } from "@/utils/http";
import { z } from "zod/v4";

// ──────────────────────────────────────────────────────────────
// Schemas
// ──────────────────────────────────────────────────────────────

export const OrderItemSchema = z.object({
  order_no: z.string(),
  user_id: z.number(),
  total_amount: z.number(), // 分
  status: z.number(), // 0=待付款 1=已付款 2=已完成 3=已取消 4=退款中
  created_at: z.string(),
  paid_at: z.string().nullable(),
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

// ──────────────────────────────────────────────────────────────
// Endpoints
// ──────────────────────────────────────────────────────────────

const BASE = "/api/admin";

export interface ListOrdersParams {
  page?: number;
  page_size?: number;
  status?: string;
  user_keyword?: string;
  order_no?: string;
  start_date?: string;
  end_date?: string;
  [key: string]: string | number | null | undefined;
}

/**
 * GET /api/admin/orders
 * 后台全量订单列表（offset 分页 + 多维筛选）
 */
export async function getOrderList(
  params?: ListOrdersParams,
): Promise<{ list: OrderItem[]; total: number; page: number; page_size: number }> {
  return httpClient.get(`${BASE}/orders`, { params });
}

/**
 * GET /api/admin/orders/:order_no
 * 订单详情
 */
export async function getOrderDetail(orderNo: string): Promise<unknown> {
  return httpClient.get(`${BASE}/orders/${orderNo}`);
}

export interface RefundReq {
  refund_amount: number; // 分
  reason: string;
}

/**
 * POST /api/admin/orders/:order_no/refund
 * 手动退款 / 强制取消
 */
export async function refundOrder(orderNo: string, req: RefundReq): Promise<void> {
  return httpClient.post(`${BASE}/orders/${orderNo}/refund`, req);
}
