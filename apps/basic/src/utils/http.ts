import { API_BASE_URL } from "./constants";
import { AUTH_ENDPOINTS } from "@/api/auth";
import { AuthTokensSchema } from "@/api/schemas";
import { getAccessToken, useAuthStore } from "@/stores/auth";

export class ApiError extends Error {
  code: number | string;
  constructor(code: number | string, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

type RequestOptions = Omit<RequestInit, "method" | "body"> & {
  params?: Record<string, string | number | null | undefined>;
};

type HttpRouter = {
  navigate: (opts: { to: string }) => void | Promise<void>;
};

let httpRouter: HttpRouter | null = null;

export function installHttpRouter(router: HttpRouter): void {
  httpRouter = router;
}

let inflightRefresh: Promise<boolean> | null = null;

/**
 * 使用 HttpOnly Cookie 中的 Refresh Token 换取新的 Access Token。
 * 浏览器通过 credentials: 'include' 自动携带 Cookie，前端无需读取/传递 RT。
 */
async function doRefreshSessionTokens(): Promise<boolean> {
  const { setTokens, logout } = useAuthStore.getState();
  const url = buildUrl(AUTH_ENDPOINTS.refresh);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // credentials: 'include' 确保浏览器发送 HttpOnly Cookie
      credentials: "include",
      // 无需 body：RT 在 Cookie 中自动携带
    });

    if (!res.ok) {
      logout();
      navigateToLogin();
      return false;
    }

    const json: unknown = await res.json();
    const envelope = json as { code?: number | string; data?: unknown; message?: string };
    if (envelope.code !== undefined && envelope.code !== 0 && envelope.code !== "OK") {
      logout();
      navigateToLogin();
      return false;
    }

    const next = AuthTokensSchema.parse(envelope.data ?? envelope);
    setTokens(next);
    return true;
  } catch {
    logout();
    navigateToLogin();
    return false;
  }
}

async function refreshSessionTokens(): Promise<boolean> {
  if (inflightRefresh) return inflightRefresh;

  inflightRefresh = doRefreshSessionTokens().finally(() => {
    inflightRefresh = null;
  });
  return inflightRefresh;
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const base = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  if (!params) return base;
  const url = new URL(base, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value != null) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
}

function navigateTo403(): void {
  void httpRouter?.navigate({ to: "/403" });
}

function navigateToLogin(): void {
  void httpRouter?.navigate({ to: "/login" });
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
  isAfterRefresh = false,
): Promise<T> {
  const url = buildUrl(path, options?.params);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...(options?.headers as Record<string, string>),
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    // credentials: 'include' 使浏览器在所有请求中携带 HttpOnly Cookie
    // （刷新端点依赖此行为；普通接口携带无妨，后端仅在刷新接口读取 Cookie）
    credentials: "include",
    ...options,
  });

  if (res.status === 401 && !isAfterRefresh && path !== AUTH_ENDPOINTS.refresh) {
    // AT 过期 → 尝试用 Cookie 中的 RT 静默刷新
    // 若刷新失败（RT 不存在/过期），doRefreshSessionTokens 内部会 logout + 跳登录页
    const refreshed = await refreshSessionTokens();
    if (refreshed) {
      return request<T>(method, path, body, options, true);
    }
    throw new HttpError(401, "Unauthorized");
  }

  if (res.status === 403) {
    navigateTo403();
    throw new HttpError(403, "Forbidden");
  }

  if (!res.ok) {
    throw new HttpError(res.status, `HTTP ${res.status}: ${res.statusText}`);
  }

  const json: unknown = await res.json();
  const envelope = json as { code?: number | string; data?: unknown; message?: string };

  if (envelope.code !== undefined && envelope.code !== 0 && envelope.code !== "OK") {
    throw new ApiError(envelope.code, envelope.message ?? "Unknown error");
  }

  return (envelope.data !== undefined ? envelope.data : json) as T;
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),
};
