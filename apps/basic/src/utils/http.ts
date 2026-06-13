import { API_BASE_URL } from "./constants";
import { AUTH_ENDPOINTS } from "@/api/auth";
import { AuthTokensSchema, RefreshTokenRequestSchema } from "@/api/schemas";
import { getAccessToken, useAuthStore } from "@/stores/auth";

export class ApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
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

async function doRefreshSessionTokens(): Promise<boolean> {
  const { tokens, setTokens, logout } = useAuthStore.getState();
  const refreshToken = tokens?.refreshToken;
  if (!refreshToken) {
    logout();
    navigateToLogin();
    return false;
  }

  const body = RefreshTokenRequestSchema.parse({ refreshToken });
  const url = buildUrl(AUTH_ENDPOINTS.refresh);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      logout();
      navigateToLogin();
      return false;
    }

    const json: unknown = await res.json();
    const envelope = json as { code?: number; data?: unknown; message?: string };
    if (envelope.code !== undefined && envelope.code !== 0) {
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
    ...options,
  });

  if (res.status === 401 && !isAfterRefresh && path !== AUTH_ENDPOINTS.refresh) {
    const { tokens } = useAuthStore.getState();
    // B 端无 Refresh Token（空串），401 直接登出跳登录页
    if (!tokens?.refreshToken) {
      useAuthStore.getState().logout();
      navigateToLogin();
      throw new HttpError(401, "Unauthorized");
    }
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
  const envelope = json as { code?: number; data?: unknown; message?: string };

  if (envelope.code !== undefined && envelope.code !== 0) {
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
