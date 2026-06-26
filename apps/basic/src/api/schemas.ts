import { z } from "zod/v4";

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatar: z.string().nullable(),
  email: z.string().nullable(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
});

export type User = z.infer<typeof UserSchema>;

/** GET `/api/auth/user` body (no `permissions`; load via `/api/auth/permissions`). */
export const AuthUserResponseSchema = UserSchema.omit({ permissions: true });
export type AuthUserResponse = z.infer<typeof AuthUserResponseSchema>;

// AuthTokensSchema: Refresh Token 已改为 HttpOnly Cookie，此处仅含 Access Token
export const AuthTokensSchema = z.object({
  accessToken: z.string().min(1),
  // Access Token 过期 Unix 时间戳（秒），可用于前端计划提前刷新
  accessTokenExpiresAt: z.number().optional(),
});

export type AuthTokens = z.infer<typeof AuthTokensSchema>;

export const LoginRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/** Ant Design Form may submit `""` for an empty optional email */
const registerOptionalEmailSchema = z
  .union([z.string(), z.undefined()])
  .transform((v) => {
    if (v === undefined) return undefined;
    const t = String(v).trim();
    return t === "" ? undefined : t;
  })
  .pipe(z.union([z.string().email(), z.undefined()]));

export const RegisterRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  email: registerOptionalEmailSchema,
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const PermissionsListSchema = z.array(z.string());

export type PermissionsList = z.infer<typeof PermissionsListSchema>;

const BaseMenuNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
  permissions: z.array(z.string()).nullable(),
  sort: z.int(),
  hidden: z.boolean(),
});

export type MenuItem =
  | (z.infer<typeof BaseMenuNodeSchema> & {
      kind: "item";
      path: string;
      children: MenuItem[] | null;
    })
  | (z.infer<typeof BaseMenuNodeSchema> & {
      kind: "group";
      path: null;
      children: MenuItem[];
    });

export const MenuItemSchema: z.ZodType<MenuItem> = z.lazy(() =>
  z.discriminatedUnion("kind", [
    BaseMenuNodeSchema.extend({
      kind: z.literal("item"),
      path: z.string(),
      children: z.array(MenuItemSchema).nullable(),
    }),
    BaseMenuNodeSchema.extend({
      kind: z.literal("group"),
      path: z.null(),
      children: z.array(MenuItemSchema),
    }),
  ]),
);

export function ApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    code: z.int(),
    data: dataSchema,
    message: z.string(),
  });
}

export type ApiResponse<T> = {
  code: number;
  data: T;
  message: string;
};

export function PaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    code: z.int(),
    data: z.object({
      list: z.array(itemSchema),
      total: z.int(),
    }),
    message: z.string(),
  });
}

export type PaginatedData<T> = {
  list: T[];
  total: number;
};

export const SearchParamsSchema = z.object({
  page: z.number().int().positive().catch(1),
  pageSize: z.number().int().positive().catch(10),
  sortField: z.string().nullable().catch(null),
  sortOrder: z.enum(["ascend", "descend"]).nullable().catch(null),
});

export type SearchParams = z.infer<typeof SearchParamsSchema>;

/** Ant Design Input submits `""` when empty; treat as null for optional email */
const createUserEmailSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v == null) return null;
    const t = String(v).trim();
    return t === "" ? null : t;
  })
  .pipe(z.union([z.string().email(), z.null()]));

export const CreateUserRequestSchema = z.object({
  username: z.string().min(1),
  email: createUserEmailSchema,
  roles: z.array(z.string()).min(1),
});

export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

export const UpdateUserRequestSchema = CreateUserRequestSchema.partial();

export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

// ─────────────────────────────────────────────
// Activity (Sports) Schemas
// ─────────────────────────────────────────────

export const ActivitySessionSchema = z.object({
  id: z.number().int(),
  file_name: z.string(),
  activity_at: z.string(),
  sport: z.string(),
  duration_sec: z.number(),
  distance_m: z.number(),
  calories_kcal: z.number().int(),
  avg_heart_rate_bpm: z.number().int(),
  max_heart_rate_bpm: z.number().int(),
  avg_speed_kmh: z.number(),
  floors: z.number().int(),
  records_count: z.number().int(),
});

export type ActivitySession = z.infer<typeof ActivitySessionSchema>;

export const SessionStatsPointSchema = z.object({
  period: z.string(),
  count: z.number().int(),
  total_distance_m: z.number(),
  total_duration_sec: z.number(),
  avg_heart_rate: z.number().int(),
});

export type SessionStatsPoint = z.infer<typeof SessionStatsPointSchema>;

export const ActivityRecordPointSchema = z.object({
  timestamp: z.string(),
  heart_rate_bpm: z.number().int(),
  speed_kmh: z.number(),
  altitude_m: z.number(),
});

export type ActivityRecordPoint = z.infer<typeof ActivityRecordPointSchema>;

// ─────────────────────────────────────────────
// Chat Schemas
// ─────────────────────────────────────────────

export const ChatStatsSchema = z.object({
  total: z.number().int(),
  total_waiting: z.number().int(),
  total_active: z.number().int(),
  total_resolved: z.number().int(),
  total_messages: z.number().int(),
});

export type ChatStats = z.infer<typeof ChatStatsSchema>;

export const ChatConversationSchema = z.object({
  id: z.number().int(),
  user_id: z.number().int(),
  user_name: z.string().optional(),
  user_avatar: z.string().optional(),
  assigned_agent_id: z.number().int().nullable().optional(),
  status: z.enum(["waiting", "active", "resolved"]),
  priority: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  resolved_at: z.string().nullable().optional(),
  last_message_at: z.string(),
});

export type ChatConversation = z.infer<typeof ChatConversationSchema>;

export const ChatMessageSchema = z.object({
  id: z.number().int(),
  conversation_id: z.number().int(),
  sender_type: z.enum(["user", "agent", "system"]),
  sender_id: z.number().int(),
  content: z.string(),
  msg_type: z.enum(["text", "image", "file", "event"]),
  is_read: z.boolean(),
  created_at: z.string(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// C2C 单聊 / 群聊（管理员视角）
export const C2CConversationSchema = z.object({
  id: z.number().int(),
  type: z.number().int(), // 1=单聊 2=群聊
  type_label: z.enum(["direct", "group"]),
  name: z.string(),
  member_count: z.number().int(),
  last_msg_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type C2CConversation = z.infer<typeof C2CConversationSchema>;

// C2C 消息（管理员视角）
export const C2CMessageSchema = z.object({
  id: z.number().int(),
  conversation_id: z.number().int(),
  sender_id: z.number().int(),
  msg_type: z.string(),
  content: z.string(),
  status: z.number().int(), // 1=已送达 2=已读
  created_at: z.string(),
});

export type C2CMessage = z.infer<typeof C2CMessageSchema>;

// C2C 成员（管理员视角）
export const C2CMemberSchema = z.object({
  user_id: z.number().int(),
  name: z.string(),
  role: z.number().int(), // 1=群主 2=管理员 3=普通成员
});

export type C2CMember = z.infer<typeof C2CMemberSchema>;
