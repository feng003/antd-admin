/**
 * 商品 / 分类 API
 * 后端前缀: /api/admin/
 */
import { httpClient } from "@/utils/http";
import { z } from "zod/v4";

// ──────────────────────────────────────────────────────────────
// Schemas
// ──────────────────────────────────────────────────────────────

/** SPU 状态: 0=草稿 1=上架 2=下架 3=封禁 */
export type SPUStatus = 0 | 1 | 2 | 3;

export const ProductListItemSchema = z.object({
  id: z.number(),
  spu_no: z.string(),
  name: z.string(),
  main_image: z.string(),
  status: z.number(),
  min_price: z.number(), // 分
  max_price: z.number(), // 分
  sold_count: z.number(),
  created_at: z.number(),
});

export type ProductListItem = z.infer<typeof ProductListItemSchema>;

// ──────────────────────────────────────────────────────────────
// Inputs for Create/Update
// ──────────────────────────────────────────────────────────────

export interface SpecValueInput {
  name: string;
  image?: string;
  sort_order?: number;
}

export interface SpecKeyInput {
  name: string;
  sort_order?: number;
  values: SpecValueInput[];
}

export interface SKUInputSpec {
  key_name: string;
  value_name: string;
}

export interface SKUInput {
  specs: SKUInputSpec[];
  sku_code?: string;
  cover_image?: string;
  sale_price: number; // 分
  origin_price?: number; // 分
  cost_price?: number; // 分
  stock: number;
  weight?: number;
  volume?: number;
}

export interface CreateProductReq {
  name: string;
  category_id?: number;
  brand_id?: number;
  main_image: string;
  image_list?: string[];
  detail_html?: string;
  status?: SPUStatus;
  spec_keys: SpecKeyInput[];
  skus: SKUInput[];
}

export interface UpdateProductReq {
  name?: string;
  category_id?: number;
  brand_id?: number;
  main_image?: string;
  image_list?: string[];
  detail_html?: string;
  status?: SPUStatus;
}

export interface UpdateSKUReq {
  sku_code?: string;
  cover_image?: string;
  sale_price?: number;
  origin_price?: number;
  cost_price?: number;
  stock?: number;
  stock_warning?: number;
  weight?: number;
  volume?: number;
  status?: number; // 1=正常 2=停售
}

// ──────────────────────────────────────────────────────────────
// Responses
// ──────────────────────────────────────────────────────────────

export interface SpecValueResponse {
  id: number;
  name: string;
  image?: string;
  sort_order: number;
}

export interface SpecKeyResponse {
  id: number;
  name: string;
  sort_order: number;
  values: SpecValueResponse[];
}

export interface SpecEntry {
  key_id: number;
  key_name: string;
  value_id: number;
  value_name: string;
}

export interface SKUResponse {
  id: number;
  sku_no: string;
  sku_code?: string;
  specs: SpecEntry[];
  spec_combo_key: string;
  cover_image?: string;
  sale_price: number;
  origin_price: number;
  stock: number;
  is_available: boolean;
}

export interface SPUDetailResponse {
  id: number;
  spu_no: string;
  category_id: number;
  brand_id?: number;
  name: string;
  main_image: string;
  image_list: string[];
  detail_html?: string;
  min_price: number;
  max_price: number;
  sold_count: number;
  status: SPUStatus;
  spec_keys: SpecKeyResponse[];
  skus: SKUResponse[];
}

// ──────────────────────────────────────────────────────────────
// Endpoints
// ──────────────────────────────────────────────────────────────

const BASE = "/api/admin";

export interface ListProductsParams {
  page?: number;
  page_size?: number;
  category_id?: number;
  status?: SPUStatus;
  [key: string]: string | number | null | undefined;
}

/**
 * GET /api/admin/products
 * 返回格式: { list: ProductListItem[], total: number }
 */
export async function getProductList(
  params?: ListProductsParams,
): Promise<{ list: ProductListItem[]; total: number }> {
  return httpClient.get(`${BASE}/products`, { params });
}

/**
 * POST /api/admin/products
 * 创建商品
 */
export async function createProduct(
  req: CreateProductReq,
): Promise<{ spu_id: number; spu_no: string }> {
  return httpClient.post(`${BASE}/products`, req);
}

/**
 * GET /api/admin/products/:id
 * 返回商品完整详情（含规格矩阵）
 */
export async function getProduct(id: number): Promise<SPUDetailResponse> {
  return httpClient.get(`${BASE}/products/${id}`);
}

/**
 * PUT /api/admin/products/:id
 * 更新 SPU 基础信息
 */
export async function updateProduct(id: number, req: UpdateProductReq): Promise<void> {
  return httpClient.put(`${BASE}/products/${id}`, req);
}

/**
 * PUT /api/admin/products/:id/skus/:sku_id
 * 更新单个 SKU 信息
 */
export async function updateSKU(spuId: number, skuId: number, req: UpdateSKUReq): Promise<void> {
  return httpClient.put(`${BASE}/products/${spuId}/skus/${skuId}`, req);
}

export interface UpdateProductStatusReq {
  status: SPUStatus;
}

/**
 * PATCH /api/admin/products/:id/status
 * 修改 SPU 上下架状态
 */
export async function updateProductStatus(id: number, status: SPUStatus): Promise<void> {
  return httpClient.patch(`${BASE}/products/${id}/status`, { status });
}

/** DELETE /api/admin/products/:id */
export async function deleteProduct(id: number): Promise<void> {
  return httpClient.delete(`${BASE}/products/${id}`);
}
