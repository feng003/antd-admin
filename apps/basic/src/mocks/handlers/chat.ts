import { http, HttpResponse } from "msw";
import { withDelay } from "../createHandler";

// ── Mock Data ──────────────────────────────────────────────────

const mockStats = {
  total: 128,
  total_waiting: 12,
  total_active: 34,
  total_resolved: 82,
  total_messages: 1540,
};

const mockConversations = Array.from({ length: 30 }, (_, i) => {
  const statuses = ["waiting", "active", "resolved"] as const;
  const priorities = ["low", "normal", "high"] as const;
  const id = 30 - i;
  return {
    id,
    user_id: 1000 + id,
    user_name: `User ${1000 + id}`,
    user_avatar: null,
    assigned_agent_id: id % 3 === 0 ? null : (id % 2) + 1,
    status: statuses[id % 3],
    priority: priorities[id % 3],
    created_at: new Date(Date.now() - id * 3_600_000).toISOString(),
    updated_at: new Date(Date.now() - id * 1_800_000).toISOString(),
    resolved_at:
      statuses[id % 3] === "resolved" ? new Date(Date.now() - id * 900_000).toISOString() : null,
    last_message_at: new Date(Date.now() - id * 600_000).toISOString(),
  };
});

const mockMessages = (convId: number) =>
  Array.from({ length: 20 }, (_, i) => ({
    id: convId * 1000 + i + 1,
    conversation_id: convId,
    sender_type: i % 3 === 0 ? "agent" : i % 5 === 0 ? "system" : "user",
    sender_id: i % 3 === 0 ? 1 : convId + 1000,
    content:
      i % 5 === 0
        ? "Conversation started"
        : i % 3 === 0
          ? `Hello! How can I help you today? (msg #${i + 1})`
          : `I have a question about my order #${convId}00${i + 1}. (msg #${i + 1})`,
    msg_type: "text",
    is_read: true,
    created_at: new Date(Date.now() - (20 - i) * 120_000).toISOString(),
  }));

// ── Handlers ───────────────────────────────────────────────────

export const chatHandlers = [
  // GET /api/admin/chat/stats
  http.get("/api/admin/chat/stats", async () => {
    await withDelay();
    return HttpResponse.json({ code: 0, data: mockStats, message: "ok" });
  }),

  // GET /api/admin/chat/conversations
  http.get("/api/admin/chat/conversations", async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? "";
    const cursorId = parseInt(url.searchParams.get("cursor_id") ?? "0");
    const limit = parseInt(url.searchParams.get("limit") ?? "20");

    let filtered = mockConversations;
    if (status) filtered = filtered.filter((c) => c.status === status);
    if (cursorId > 0) filtered = filtered.filter((c) => c.id < cursorId);
    const page = filtered.slice(0, limit);

    return HttpResponse.json({ code: 0, data: page, message: "ok" });
  }),

  // GET /api/admin/chat/conversations/:id/history
  http.get("/api/admin/chat/conversations/:id/history", async ({ params }) => {
    await withDelay();
    const convId = parseInt(params.id as string);
    return HttpResponse.json({ code: 0, data: mockMessages(convId), message: "ok" });
  }),

  // GET /api/admin/chat/c2c/conversations
  http.get("/api/admin/chat/c2c/conversations", async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const typeFilter = parseInt(url.searchParams.get("type") ?? "0");
    const cursorId = parseInt(url.searchParams.get("cursor_id") ?? "0");
    const limit = parseInt(url.searchParams.get("limit") ?? "20");

    const mockC2CConversations = Array.from({ length: 35 }, (_, i) => {
      const id = 35 - i;
      const convType = id % 3 === 0 ? 2 : 1; // every 3rd is group
      return {
        id,
        type: convType,
        type_label: convType === 2 ? "group" : "direct",
        name: convType === 2 ? `Group Chat #${id}` : "",
        member_count: convType === 2 ? 3 + (id % 8) : 2,
        last_msg_at: new Date(Date.now() - id * 900_000).toISOString(),
        created_at: new Date(Date.now() - id * 7_200_000).toISOString(),
        updated_at: new Date(Date.now() - id * 900_000).toISOString(),
      };
    });

    let filtered = mockC2CConversations;
    if (typeFilter === 1) filtered = filtered.filter((c) => c.type === 1);
    else if (typeFilter === 2) filtered = filtered.filter((c) => c.type === 2);
    if (cursorId > 0) filtered = filtered.filter((c) => c.id < cursorId);
    const page = filtered.slice(0, limit);

    return HttpResponse.json({ code: 0, data: page, message: "ok" });
  }),

  // GET /api/admin/chat/c2c/conversations/:id/messages
  http.get("/api/admin/chat/c2c/conversations/:id/messages", async ({ params, request }) => {
    await withDelay();
    const convId = parseInt(params.id as string);
    const url = new URL(request.url);
    const cursorId = parseInt(url.searchParams.get("cursor_id") ?? "0");
    const limit = parseInt(url.searchParams.get("limit") ?? "30");

    const total = 40;
    const allMsgs = Array.from({ length: total }, (_, i) => ({
      id: convId * 10000 + (total - i),
      conversation_id: convId,
      sender_id: i % 3 === 0 ? convId + 1001 : convId + 1000,
      msg_type: "text",
      content:
        i % 3 === 0
          ? `Sure! Let me check that for you. (msg #${total - i})`
          : i % 7 === 0
            ? `[image attached]`
            : `Hello, I need help with order #${convId}00${total - i}. (msg #${total - i})`,
      status: 2,
      created_at: new Date(Date.now() - (total - i) * 180_000).toISOString(),
    }));

    let page = allMsgs;
    if (cursorId > 0) page = page.filter((m) => m.id < cursorId);
    page = page.slice(0, limit);

    return HttpResponse.json({ code: 0, data: page, message: "ok" });
  }),

  // GET /api/admin/chat/c2c/conversations/:id/members
  http.get("/api/admin/chat/c2c/conversations/:id/members", async ({ params }) => {
    await withDelay();
    const convId = parseInt(params.id as string);
    const memberCount = convId % 3 === 0 ? 5 + (convId % 6) : 2; // group has more members, direct=2

    const members = Array.from({ length: memberCount }, (_, i) => ({
      user_id: convId * 100 + i + 1,
      name: i === 0 ? `Owner_${convId}` : `Member_${convId}_${i}`,
      role: i === 0 ? 1 : i === 1 ? 2 : 3,
    }));

    return HttpResponse.json({ code: 0, data: members, message: "ok" });
  }),
];
