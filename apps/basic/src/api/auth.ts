import type {
  AuthTokens,
  LoginRequest,
  User,
  MenuItem,
  PermissionsList,
  RegisterRequest,
} from "./schemas";

export const AUTH_ENDPOINTS = {
  login: "/api/auth/login",
  register: "/api/auth/register",
  refresh: "/api/auth/refresh",
  logout: "/api/auth/logout",
  user: "/api/auth/user",
  permissions: "/api/auth/permissions",
} as const;

export type { AuthTokens, LoginRequest, User, MenuItem, PermissionsList, RegisterRequest };
