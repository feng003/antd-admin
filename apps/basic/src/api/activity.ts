import { httpClient } from "@/utils/http";

export const ACTIVITY_ENDPOINTS = {
  sports: "/api/admin/activities/sports",
  sessions: "/api/admin/activities/sessions",
  stats: "/api/admin/activities/sessions/stats",
  records: (id: number) => `/api/admin/activities/sessions/${id}/records`,
};

export type SessionsQuery = {
  sport?: string;
  last_id?: number;
  limit?: number;
};

export type StatsQuery = {
  sport?: string;
  from?: string;
  to?: string;
  group_by?: "month" | "week" | "day";
};

export function fetchSports() {
  return httpClient.get<string[]>(ACTIVITY_ENDPOINTS.sports);
}

export function fetchSessions(q: SessionsQuery = {}) {
  return httpClient.get(ACTIVITY_ENDPOINTS.sessions, { params: q });
}

export function fetchStats(q: StatsQuery = {}) {
  return httpClient.get(ACTIVITY_ENDPOINTS.stats, { params: q });
}

export function fetchSessionRecords(id: number) {
  return httpClient.get(ACTIVITY_ENDPOINTS.records(id));
}
