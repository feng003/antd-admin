import { http } from "msw";
import { MOCK_USERS, GUEST_AUTH_USER_BODY } from "../data";
import {
  withDelay,
  errorResponse,
  ERROR_CODES,
  successWithSchema,
  successWithNullBody,
} from "../createHandler";
import {
  AuthTokensSchema,
  UserSchema,
  LoginRequestSchema,
  PermissionsListSchema,
  RegisterRequestSchema,
} from "@/api/schemas";

// MSW mock 中用 Cookie header 模拟 RT（仅供本地开发测试，生产由服务端 HttpOnly Cookie 处理）
const GUEST_REFRESH = "mock-guest-refresh";
const REGISTERED_ACCESS = "mock-registered-access";
const REGISTERED_REFRESH = "mock-registered-refresh";

/** Last successful register (in-memory) so /user matches the new account in MSW */
let mockRegisteredSession: { username: string; email: string | null } | null = null;

function isGuestAuth(authorization: string | null): boolean {
  return (authorization ?? "").includes("mock-guest-access");
}

function isRegisteredAuth(authorization: string | null): boolean {
  return (authorization ?? "").includes(REGISTERED_ACCESS);
}

export const authHandlers = [
  http.post("/api/admin/auth/login", async ({ request }) => {
    await withDelay(300);
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return errorResponse(ERROR_CODES.BAD_REQUEST, "Invalid JSON body");
    }
    const parsed = LoginRequestSchema.safeParse(json);
    if (!parsed.success) {
      return errorResponse(ERROR_CODES.BAD_REQUEST, "Invalid login body");
    }
    const { username, password } = parsed.data;
    if (username === "guest" && password === "guest") {
      return successWithSchema(AuthTokensSchema, {
        accessToken: "mock-guest-access",
        // RT 通过 Cookie 下发，此处仅返回 AT
      });
    }
    if (username === "admin" && password === "Admin@2024") {
      return successWithSchema(AuthTokensSchema, {
        accessToken: "mock-access-token",
      });
    }
    return errorResponse(ERROR_CODES.INVALID_CREDENTIALS, "Invalid username or password");
  }),

  http.post("/api/auth/register", async ({ request }) => {
    await withDelay(300);
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return errorResponse(ERROR_CODES.BAD_REQUEST, "Invalid JSON body");
    }
    const parsed = RegisterRequestSchema.safeParse(json);
    if (!parsed.success) {
      return errorResponse(ERROR_CODES.BAD_REQUEST, "Invalid register body");
    }
    const { username, password, email } = parsed.data;
    if (password.length < 6) {
      return errorResponse(ERROR_CODES.BAD_REQUEST, "Password must be at least 6 characters");
    }
    const taken = username === "guest" || MOCK_USERS.some((u) => u.username === username);
    if (taken) {
      return errorResponse(ERROR_CODES.BAD_REQUEST, "Username already taken");
    }
    mockRegisteredSession = {
      username,
      email: email ?? null,
    };
    return successWithSchema(AuthTokensSchema, {
      accessToken: REGISTERED_ACCESS,
    });
  }),

  // MSW 模拟刷新接口：从 Cookie 读取 RT（msw 环境中 Cookie 由 request.headers 获取）
  http.post("/api/admin/auth/refresh", ({ request }) => {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const rtMatch = cookieHeader.match(/admin_rt=([^;]+)/);
    const rt = rtMatch?.[1];

    if (!rt) {
      return errorResponse(ERROR_CODES.UNAUTHORIZED, "Refresh Token not found");
    }
    if (rt === GUEST_REFRESH) {
      return successWithSchema(AuthTokensSchema, {
        accessToken: "mock-guest-access-refreshed",
      });
    }
    if (rt === REGISTERED_REFRESH || rt.startsWith(`${REGISTERED_REFRESH}-`)) {
      return successWithSchema(AuthTokensSchema, {
        accessToken: `${REGISTERED_ACCESS}-refreshed`,
      });
    }
    return successWithSchema(AuthTokensSchema, {
      accessToken: "mock-new-access-token",
    });
  }),

  http.post("/api/admin/auth/logout", () => successWithNullBody()),

  http.get("/api/admin/profile", ({ request }) => {
    const auth = request.headers.get("authorization");
    if (isRegisteredAuth(auth)) {
      const session = mockRegisteredSession;
      if (session) {
        return successWithSchema(UserSchema, {
          id: "reg-mock",
          username: session.username,
          avatar: null,
          email: session.email,
          roles: ["editor"],
          permissions: ["user:view"],
        });
      }
    }
    if (isGuestAuth(auth)) {
      return successWithSchema(UserSchema, {
        ...GUEST_AUTH_USER_BODY,
        permissions: [],
      });
    }
    return successWithSchema(UserSchema, MOCK_USERS[0]!);
  }),

  http.get("/api/admin/permissions", ({ request }) => {
    const auth = request.headers.get("authorization");
    if (isRegisteredAuth(auth) && mockRegisteredSession) {
      return successWithSchema(PermissionsListSchema, ["user:view"] as string[]);
    }
    if (isGuestAuth(auth)) {
      return successWithSchema(PermissionsListSchema, [] as string[]);
    }
    return successWithSchema(PermissionsListSchema, MOCK_USERS[0]!.permissions);
  }),
];
