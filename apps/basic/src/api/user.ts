import { httpClient } from "@/utils/http";
import type { User, CreateUserRequest, UpdateUserRequest } from "./schemas";

export const USER_ENDPOINTS = {
  list: "/api/admin/users",
  create: "/api/admin/users",
  update: (id: string) => `/api/admin/users/${id}`,
  delete: (id: string) => `/api/admin/users/${id}`,
  assignRoles: (id: string) => `/api/admin/users/${id}/roles`,
} as const;

export const getUsers = async (params?: {
  limit?: number;
  offset?: number;
  keyword?: string;
  role?: string;
  sortField?: string;
  sortOrder?: string;
}): Promise<{ list: User[]; total: number }> => {
  return httpClient.get(USER_ENDPOINTS.list, { params });
};

export const createUser = async (req: CreateUserRequest): Promise<User> => {
  return httpClient.post<User>(USER_ENDPOINTS.create, req);
};

export const updateUser = async (id: string, req: UpdateUserRequest): Promise<void> => {
  return httpClient.put<void>(USER_ENDPOINTS.update(id), req);
};

export const deleteUser = async (id: string): Promise<void> => {
  return httpClient.delete<void>(USER_ENDPOINTS.delete(id));
};

export const assignUserRoles = async (id: string, roles: string[]): Promise<void> => {
  return httpClient.post<void>(USER_ENDPOINTS.assignRoles(id), { roles });
};
