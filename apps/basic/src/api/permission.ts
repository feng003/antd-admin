/**
 * 权限 / 角色 / 系统管理员 API
 * 后端前缀: /api/admin/
 */
import { httpClient } from "@/utils/http";
import { z } from "zod/v4";

// ──────────────────────────────────────────────────────────────
// Schemas
// ──────────────────────────────────────────────────────────────

/** 权限节点（支持递归 children）*/
export interface PermissionNode {
  id: number;
  parent_id: number;
  type: number; // 1=菜单 2=API 3=按钮
  name: string;
  code: string;
  api_path: string | null;
  api_method: string | null;
  icon: string | null;
  sort: number;
  status: number;
  children: PermissionNode[] | null;
}

// zod schema 仅用于校验（非类型推断来源）
export const PermissionNodeSchema = z.object({
  id: z.number(),
  parent_id: z.number(),
  type: z.number(),
  name: z.string(),
  code: z.string(),
  api_path: z.string().nullable().default(""),
  api_method: z.string().nullable().default(""),
  icon: z.string().nullable().default(""),
  sort: z.number(),
  status: z.number(),
});

export const RoleSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().default(""),
  status: z.number(),
  sort: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Role = z.infer<typeof RoleSchema>;

export const SysUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  real_name: z.string().nullable().default(""),
  email: z.string().nullable().default(""),
  phone: z.string().nullable().default(""),
  avatar_url: z.string().nullable().default(""),
  status: z.number(),
  last_login_at: z.string().nullable(),
  last_login_ip: z.string().nullable().default(""),
  created_at: z.string(),
  updated_at: z.string(),
});

export type SysUser = z.infer<typeof SysUserSchema>;

// ──────────────────────────────────────────────────────────────
// Endpoints
// ──────────────────────────────────────────────────────────────

const BASE = "/api/admin";

// ── 权限 ──────────────────────────────────────────────────────

/** GET /api/admin/permissions — 完整权限树 */
export async function getPermissionTree(): Promise<PermissionNode[]> {
  return httpClient.get(`${BASE}/permissions`);
}

export interface CreatePermissionReq {
  parent_id?: number;
  type: number;
  name: string;
  code: string;
  api_path?: string;
  api_method?: string;
  icon?: string;
  sort?: number;
  status?: number;
}

/** POST /api/admin/permissions */
export async function createPermission(req: CreatePermissionReq): Promise<void> {
  return httpClient.post(`${BASE}/permissions`, req);
}

/** PUT /api/admin/permissions/:id */
export async function updatePermission(
  id: number,
  req: Partial<CreatePermissionReq>,
): Promise<void> {
  return httpClient.put(`${BASE}/permissions/${id}`, req);
}

/** DELETE /api/admin/permissions/:id */
export async function deletePermission(id: number): Promise<void> {
  return httpClient.delete(`${BASE}/permissions/${id}`);
}

// ── 角色 ──────────────────────────────────────────────────────

export interface ListRolesParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  [key: string]: string | number | null | undefined;
}

/** GET /api/admin/roles */
export async function getRoleList(
  params?: ListRolesParams,
): Promise<{ list: Role[]; total: number }> {
  return httpClient.get(`${BASE}/roles`, { params });
}

export interface CreateRoleReq {
  code: string;
  name: string;
  description?: string;
  status?: number;
  sort?: number;
}

/** POST /api/admin/roles */
export async function createRole(req: CreateRoleReq): Promise<void> {
  return httpClient.post(`${BASE}/roles`, req);
}

/** PUT /api/admin/roles/:id */
export async function updateRole(id: number, req: Partial<CreateRoleReq>): Promise<void> {
  return httpClient.put(`${BASE}/roles/${id}`, req);
}

/** DELETE /api/admin/roles/:id */
export async function deleteRole(id: number): Promise<void> {
  return httpClient.delete(`${BASE}/roles/${id}`);
}

/** POST /api/admin/roles/:id/permissions — 为角色分配权限 */
export async function assignPermissionsToRole(
  roleId: number,
  permissionIds: number[],
): Promise<void> {
  return httpClient.post(`${BASE}/roles/${roleId}/permissions`, { permission_ids: permissionIds });
}

/** GET /api/admin/roles/:id/permissions — 查询角色已绑定的权限（含 permission_ids 用于预选） */
export async function getRolePermissions(
  roleId: number,
): Promise<{ permission_ids: number[]; permissions: PermissionNode[] }> {
  return httpClient.get(`${BASE}/roles/${roleId}/permissions`);
}

// ── 系统管理员 ────────────────────────────────────────────────

export interface ListSysUsersParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  status?: number;
  [key: string]: string | number | null | undefined;
}

/** GET /api/admin/users */
export async function getSysUserList(
  params?: ListSysUsersParams,
): Promise<{ list: SysUser[]; total: number }> {
  return httpClient.get(`${BASE}/users`, { params });
}

export interface CreateSysUserReq {
  username: string;
  password: string;
  real_name?: string;
  email?: string;
  phone?: string;
  status?: number;
}

/** POST /api/admin/users */
export async function createSysUser(req: CreateSysUserReq): Promise<void> {
  return httpClient.post(`${BASE}/users`, req);
}

export interface UpdateSysUserReq {
  real_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  status?: number;
}

/** PUT /api/admin/users/:id */
export async function updateSysUser(id: number, req: UpdateSysUserReq): Promise<void> {
  return httpClient.put(`${BASE}/users/${id}`, req);
}

/** DELETE /api/admin/users/:id */
export async function deleteSysUser(id: number): Promise<void> {
  return httpClient.delete(`${BASE}/users/${id}`);
}

/** POST /api/admin/users/:id/roles — 为管理员分配角色 */
export async function assignRolesToUser(userId: number, roleIds: number[]): Promise<void> {
  return httpClient.post(`${BASE}/users/${userId}/roles`, { role_ids: roleIds });
}

/** GET /api/admin/users/:id/roles — 查询管理员已绑定的角色列表 */
export async function getUserRoles(userId: number): Promise<{ list: Role[] }> {
  return httpClient.get(`${BASE}/users/${userId}/roles`);
}
