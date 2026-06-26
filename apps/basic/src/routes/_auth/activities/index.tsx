import { useRef, useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Alert, Card, Col, Flex, Row, Statistic, Table, Tag, theme, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { z } from "zod/v4";
import { Activity, Heart, MapPin, Flame } from "lucide-react";

import { ActivitySessionSchema, SessionStatsPointSchema } from "@/api/schemas";
import type { ActivitySession, SessionStatsPoint } from "@/api/schemas";
import { fetchSessions, fetchStats } from "@/api/activity";
import { ActivityToolbar } from "./-Toolbar";
import { StatsChart } from "./-StatsChart";
import { RecordsDrawer } from "./-RecordsDrawer";

const { Text } = Typography;

export const Route = createFileRoute("/_auth/activities/")({
  component: ActivitiesPage,
});

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`;
}

const SPORT_COLORS: Record<string, string> = {
  running: "blue",
  cycling: "green",
  hiking: "orange",
  swimming: "cyan",
  walking: "purple",
};

function ActivitiesPage() {
  const { token } = theme.useToken();
  const toolbarRef = useRef<HTMLDivElement>(null);

  const [sport, setSport] = useState("");
  const [groupBy, setGroupBy] = useState<"month" | "week" | "day">("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchTick, setSearchTick] = useState(0);
  const [drawerSession, setDrawerSession] = useState<ActivitySession | null>(null);

  const triggerSearch = useCallback(() => setSearchTick((t) => t + 1), []);

  // ── Sessions list query ─────────────────────────────────────────
  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    isError: sessionsError,
    error: sessionsErr,
  } = useQuery({
    queryKey: ["activity-sessions", sport, searchTick],
    queryFn: async () => {
      const raw = await fetchSessions({ sport: sport || undefined, limit: 50 });
      return z.array(ActivitySessionSchema).parse((raw as { list: unknown[] }).list ?? raw);
    },
    staleTime: 10_000,
    retry: 1,
  });

  // ── Stats query ─────────────────────────────────────────────────
  const {
    data: statsData,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErr,
  } = useQuery<SessionStatsPoint[]>({
    queryKey: ["activity-stats", sport, groupBy, dateFrom, dateTo, searchTick],
    queryFn: async () => {
      const raw = await fetchStats({
        sport: sport || undefined,
        group_by: groupBy,
        from: dateFrom || undefined,
        to: dateTo || undefined,
      });
      return z.array(SessionStatsPointSchema).parse(raw);
    },
    staleTime: 10_000,
    retry: 1,
  });

  // ── Summary stats ───────────────────────────────────────────────
  const sessions = sessionsData ?? [];
  const totalSessions = sessions.length;
  const totalDistanceM = sessions.reduce((s, a) => s + a.distance_m, 0);
  const avgHR = sessions.length
    ? Math.round(sessions.reduce((s, a) => s + a.avg_heart_rate_bpm, 0) / sessions.length)
    : 0;
  const totalCalories = sessions.reduce((s, a) => s + a.calories_kcal, 0);

  // ── Table columns ───────────────────────────────────────────────
  const columns: ColumnsType<ActivitySession> = [
    {
      title: "Date",
      dataIndex: "activity_at",
      key: "activity_at",
      width: 160,
      render: (v: string) =>
        new Date(v).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      sorter: (a, b) => new Date(a.activity_at).getTime() - new Date(b.activity_at).getTime(),
      defaultSortOrder: "descend",
    },
    {
      title: "Sport",
      dataIndex: "sport",
      key: "sport",
      width: 110,
      render: (v: string) => (
        <Tag color={SPORT_COLORS[v] ?? "default"}>{v.charAt(0).toUpperCase() + v.slice(1)}</Tag>
      ),
    },
    {
      title: "Duration",
      dataIndex: "duration_sec",
      key: "duration_sec",
      width: 100,
      render: (v: number) => formatDuration(v),
      sorter: (a, b) => a.duration_sec - b.duration_sec,
    },
    {
      title: "Distance",
      dataIndex: "distance_m",
      key: "distance_m",
      width: 110,
      render: (v: number) => formatDistance(v),
      sorter: (a, b) => a.distance_m - b.distance_m,
    },
    {
      title: "Avg HR",
      dataIndex: "avg_heart_rate_bpm",
      key: "avg_heart_rate_bpm",
      width: 90,
      render: (v: number) => (
        <Text style={{ color: v > 150 ? token.colorError : token.colorText }}>{v} bpm</Text>
      ),
      sorter: (a, b) => a.avg_heart_rate_bpm - b.avg_heart_rate_bpm,
    },
    {
      title: "Calories",
      dataIndex: "calories_kcal",
      key: "calories_kcal",
      width: 95,
      render: (v: number) => `${v} kcal`,
      sorter: (a, b) => a.calories_kcal - b.calories_kcal,
    },
    {
      title: "Records",
      dataIndex: "records_count",
      key: "records_count",
      width: 85,
      render: (v: number) => <Text type="secondary">{v.toLocaleString()}</Text>,
    },
  ];

  return (
    <Flex vertical gap={token.marginMD} style={{ flex: "1 1 0%", minHeight: 0, overflow: "auto" }}>
      {/* Toolbar */}
      <ActivityToolbar
        ref={toolbarRef}
        sport={sport}
        groupBy={groupBy}
        onSportChange={setSport}
        onGroupByChange={setGroupBy}
        onDateRangeChange={(from, to) => {
          setDateFrom(from);
          setDateTo(to);
        }}
        onSearch={triggerSearch}
      />

      {/* Error banner */}
      {(sessionsError || statsError) && (
        <Alert
          type="error"
          showIcon
          message="Failed to load activity data"
          description={
            (sessionsErr as Error)?.message || (statsErr as Error)?.message || "Unknown error"
          }
          closable
        />
      )}

      <Row gutter={[16, 16]}>
        {[
          {
            title: "Total Sessions",
            value: totalSessions,
            icon: <Activity size={18} style={{ color: token.colorPrimary }} />,
            suffix: "",
          },
          {
            title: "Total Distance",
            value: (totalDistanceM / 1000).toFixed(1),
            icon: <MapPin size={18} style={{ color: token.colorSuccess }} />,
            suffix: " km",
          },
          {
            title: "Avg Heart Rate",
            value: avgHR,
            icon: <Heart size={18} style={{ color: token.colorError }} />,
            suffix: " bpm",
          },
          {
            title: "Total Calories",
            value: totalCalories.toLocaleString(),
            icon: <Flame size={18} style={{ color: token.colorWarning }} />,
            suffix: " kcal",
          },
        ].map((stat) => (
          <Col xs={24} sm={12} lg={6} key={stat.title}>
            <Card styles={{ body: { padding: token.paddingMD } }}>
              <Flex justify="space-between" align="flex-start">
                <Statistic
                  title={<Text style={{ fontSize: token.fontSizeSM }}>{stat.title}</Text>}
                  value={stat.value}
                  suffix={stat.suffix}
                  styles={{ content: { fontSize: 22, fontWeight: 600 } }}
                />
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: token.borderRadiusLG,
                    background: token.colorFillSecondary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {stat.icon}
                </div>
              </Flex>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Trend Chart */}
      <StatsChart data={statsData ?? []} loading={statsLoading} />

      {/* Sessions Table */}
      <Card
        title={
          <Flex align="center" gap={6}>
            <Activity size={14} style={{ color: token.colorPrimary }} />
            <Text strong>Activity Sessions</Text>
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              (click row to view records)
            </Text>
          </Flex>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Table<ActivitySession>
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={sessions}
          loading={sessionsLoading}
          pagination={{ pageSize: 10, size: "small", showTotal: (t) => `${t} sessions` }}
          scroll={{ x: "max-content" }}
          onRow={(record) => ({
            onClick: () => setDrawerSession(record),
            style: { cursor: "pointer" },
          })}
          rowClassName={() => "activity-row-hover"}
        />
      </Card>

      {/* Records Drawer */}
      <RecordsDrawer
        open={drawerSession != null}
        session={drawerSession}
        onClose={() => setDrawerSession(null)}
      />
    </Flex>
  );
}
