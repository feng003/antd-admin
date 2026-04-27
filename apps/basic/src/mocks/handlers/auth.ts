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
  AuthUserResponseSchema,
  LoginRequestSchema,
  PermissionsListSchema,
  RefreshTokenRequestSchema,
} from "@/api/schemas";

const GUEST_REFRESH = "mock-guest-refresh";

function isGuestAuth(authorization: string | null): boolean {
  return (authorization ?? "").includes("mock-guest-access");
}

export const authHandlers = [
  http.post("/api/auth/login", async ({ request }) => {
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
        refreshToken: GUEST_REFRESH,
      });
    }
    if (username === "admin" && password === "admin") {
      return successWithSchema(AuthTokensSchema, {
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      });
    }
    return errorResponse(ERROR_CODES.INVALID_CREDENTIALS, "Invalid username or password");
  }),

  http.post("/api/auth/refresh", async ({ request }) => {
    await withDelay(100);
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return errorResponse(ERROR_CODES.BAD_REQUEST, "Invalid JSON body");
    }
    const parsed = RefreshTokenRequestSchema.safeParse(json);
    if (!parsed.success) {
      return errorResponse(ERROR_CODES.BAD_REQUEST, "refreshToken is required");
    }
    if (parsed.data.refreshToken === GUEST_REFRESH) {
      return successWithSchema(AuthTokensSchema, {
        accessToken: "mock-guest-access-refreshed",
        refreshToken: "mock-guest-refresh-refreshed",
      });
    }
    return successWithSchema(AuthTokensSchema, {
      accessToken: "mock-new-access-token",
      refreshToken: "mock-new-refresh-token",
    });
  }),

  http.post("/api/auth/logout", () => successWithNullBody()),

  http.get("/api/auth/user", ({ request }) => {
    const auth = request.headers.get("authorization");
    if (isGuestAuth(auth)) {
      return successWithSchema(AuthUserResponseSchema, GUEST_AUTH_USER_BODY);
    }
    const { permissions: _permissions, ...userWithoutPermissions } = MOCK_USERS[0]!;
    return successWithSchema(AuthUserResponseSchema, userWithoutPermissions);
  }),

  http.get("/api/auth/permissions", ({ request }) => {
    const auth = request.headers.get("authorization");
    if (isGuestAuth(auth)) {
      return successWithSchema(PermissionsListSchema, [] as string[]);
    }
    return successWithSchema(PermissionsListSchema, MOCK_USERS[0]!.permissions);
  }),
];
