import { httpClient } from "@/utils/http";

export interface Brand {
  id: number;
  name: string;
  logo: string;
  description: string;
  sort_order: number;
  created_at: string; // ISO 8601 字符串（与后端 pgx 默认一致）
}

export interface CreateBrandReq {
  name: string;
  logo?: string;
  description?: string;
  sort_order?: number;
}

export interface UpdateBrandReq extends CreateBrandReq {}

export const getBrands = async (): Promise<Brand[]> => {
  return httpClient.get<Brand[]>("/api/admin/brands");
};

export const createBrand = async (req: CreateBrandReq): Promise<{ id: number }> => {
  return httpClient.post<{ id: number }>("/api/admin/brands", req);
};

export const updateBrand = async (id: number, req: UpdateBrandReq): Promise<void> => {
  return httpClient.put<void>(`/api/admin/brands/${id}`, req);
};

export const deleteBrand = async (id: number): Promise<void> => {
  return httpClient.delete<void>(`/api/admin/brands/${id}`);
};
