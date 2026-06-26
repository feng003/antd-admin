import { http } from "msw";
import {
  ActivitySessionSchema,
  SessionStatsPointSchema,
  ActivityRecordPointSchema,
} from "@/api/schemas";
import { withDelay, successResponse } from "../createHandler";

// ── 随机种子数据 ──────────────────────────────────────
const SPORTS = ["running", "cycling", "hiking", "swimming", "walking"];

function rnd(min: number, max: number, decimal = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimal));
}

function isoDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

const mockSessions = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  file_name: `activity_${i + 1}.fit`,
  activity_at: isoDate(i * 6),
  sport: SPORTS[i % SPORTS.length],
  duration_sec: rnd(1200, 7200, 0),
  distance_m: rnd(2000, 25000, 1),
  calories_kcal: Math.floor(rnd(150, 900, 0)),
  avg_heart_rate_bpm: Math.floor(rnd(110, 165, 0)),
  max_heart_rate_bpm: Math.floor(rnd(165, 195, 0)),
  avg_speed_kmh: rnd(4, 30, 2),
  floors: Math.floor(rnd(0, 40, 0)),
  records_count: Math.floor(rnd(500, 5000, 0)),
}));

// 月度统计
function buildStats(groupBy = "month") {
  const fmt = groupBy === "day" ? "day" : groupBy === "week" ? "week" : "month";
  const periods: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    if (fmt === "month") {
      d.setMonth(d.getMonth() - i);
      periods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
    } else {
      d.setDate(d.getDate() - i * 7);
      periods.push(d.toISOString().slice(0, 10));
    }
  }
  return periods.map((period) => ({
    period,
    count: Math.floor(rnd(2, 12, 0)),
    total_distance_m: rnd(8000, 80000, 1),
    total_duration_sec: rnd(5000, 50000, 0),
    avg_heart_rate: Math.floor(rnd(120, 155, 0)),
  }));
}

// 逐秒记录
function buildRecords(sessionId: number) {
  const count = 300 + (sessionId % 5) * 50;
  return Array.from({ length: count }, (_, i) => {
    const base = new Date("2025-06-01T08:00:00Z");
    base.setSeconds(base.getSeconds() + i);
    return {
      timestamp: base.toISOString(),
      heart_rate_bpm: Math.floor(rnd(110, 170, 0) + Math.sin(i / 20) * 10),
      speed_kmh: parseFloat((rnd(6, 14, 2) + Math.cos(i / 15) * 2).toFixed(2)),
      altitude_m: parseFloat((rnd(50, 200, 1) + Math.sin(i / 30) * 20).toFixed(1)),
    };
  });
}

export const activityHandlers = [
  // 运动类型列表
  http.get("/api/admin/activities/sports", async () => {
    await withDelay(200);
    return successResponse(SPORTS);
  }),

  // 会话列表
  http.get("/api/admin/activities/sessions", async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const sport = url.searchParams.get("sport");
    let list = sport ? mockSessions.filter((s) => s.sport === sport) : [...mockSessions];
    const parsed = list.map((s) => ActivitySessionSchema.parse(s));
    return successResponse({ list: parsed, total: parsed.length });
  }),

  // 趋势统计
  http.get("/api/admin/activities/sessions/stats", async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const groupBy = url.searchParams.get("group_by") ?? "month";
    const raw = buildStats(groupBy);
    const parsed = raw.map((p) => SessionStatsPointSchema.parse(p));
    return successResponse(parsed);
  }),

  // 逐秒记录
  http.get("/api/admin/activities/sessions/:id/records", async ({ params }) => {
    await withDelay(400);
    const id = parseInt(String(params.id), 10);
    const raw = buildRecords(id);
    const parsed = raw.map((r) => ActivityRecordPointSchema.parse(r));
    return successResponse(parsed);
  }),
];
