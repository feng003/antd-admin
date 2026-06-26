import type {
  AuthTokens,
  LoginRequest,
  User,
  MenuItem,
  PermissionsList,
  RegisterRequest,
} from "./schemas";

/** B 端管理后台 Auth 相关端点（前缀 /api/admin/） */
export const AUTH_ENDPOINTS = {
  login: "/api/admin/auth/login",
  /** B 端无注册，此端点保留但不使用 */
  register: "/api/auth/register",
  /** B 端 Refresh Token 换新 Access Token 端点（AT 过期时自动调用） */
  refresh: "/api/admin/auth/refresh",
  logout: "/api/admin/auth/logout",
  /** 获取当前管理员信息（含 permissions 字段） */
  profile: "/api/admin/profile",
  /** 兼容旧调用，实际 B 端 profile 接口已包含 permissions */
  user: "/api/admin/profile",
  permissions: "/api/admin/permissions",
} as const;

export type { AuthTokens, LoginRequest, User, MenuItem, PermissionsList, RegisterRequest };
