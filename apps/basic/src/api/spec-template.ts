import { httpClient } from "@/utils/http";

export interface SpecTemplateValue {
  id: number;
  name: string;
  sort_order: number;
}

export interface SpecTemplate {
  id: number;
  name: string;
  sort_order: number;
  created_at: number;
  values: SpecTemplateValue[];
}

export interface CreateSpecTemplateReq {
  name: string;
  sort_order?: number;
}

export interface UpdateSpecTemplateReq extends CreateSpecTemplateReq {}

export interface CreateSpecTemplateValueReq {
  template_id: number;
  name: string;
  sort_order?: number;
}

export interface UpdateSpecTemplateValueReq {
  template_id: number;
  name: string;
  sort_order?: number;
}

export const getSpecTemplates = async (): Promise<SpecTemplate[]> => {
  return httpClient.get<SpecTemplate[]>("/api/admin/spec-templates");
};

export const createSpecTemplate = async (req: CreateSpecTemplateReq): Promise<{ id: number }> => {
  return httpClient.post<{ id: number }>("/api/admin/spec-templates", req);
};

export const updateSpecTemplate = async (id: number, req: UpdateSpecTemplateReq): Promise<void> => {
  return httpClient.put<void>(`/api/admin/spec-templates/${id}`, req);
};

export const deleteSpecTemplate = async (id: number): Promise<void> => {
  return httpClient.delete<void>(`/api/admin/spec-templates/${id}`);
};

export const createSpecTemplateValue = async (
  req: CreateSpecTemplateValueReq,
): Promise<{ id: number }> => {
  return httpClient.post<{ id: number }>("/api/admin/spec-templates/values", req);
};

export const updateSpecTemplateValue = async (
  id: number,
  req: UpdateSpecTemplateValueReq,
): Promise<void> => {
  return httpClient.put<void>(`/api/admin/spec-templates/values/${id}`, req);
};

export const deleteSpecTemplateValue = async (id: number): Promise<void> => {
  return httpClient.delete<void>(`/api/admin/spec-templates/values/${id}`);
};
