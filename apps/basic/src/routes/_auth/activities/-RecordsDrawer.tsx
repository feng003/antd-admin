import { useMemo } from "react";
import { Drawer, Flex, Typography, Spin, Empty, Tag, theme } from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import type { ActivitySession, ActivityRecordPoint } from "@/api/schemas";
import { ActivityRecordPointSchema } from "@/api/schemas";
import { fetchSessionRecords } from "@/api/activity";
import { Heart, Zap, Clock, MapPin } from "lucide-react";
import { z } from "zod/v4";

const { Text, Title } = Typography;

type Props = {
  open: boolean;
  session: ActivitySession | null;
  onClose: () => void;
};

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
}

function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`;
}

function formatTime(iso: string): string {
  // "2025-06-01T08:00:30Z" → "08:00:30"
  return iso.slice(11, 19);
}

export function RecordsDrawer({ open, session, onClose }: Props) {
  const { token } = theme.useToken();

  const { data: records, isLoading } = useQuery<ActivityRecordPoint[]>({
    queryKey: ["activity-records", session?.id],
    enabled: open && session != null,
    queryFn: async () => {
      const raw = await fetchSessionRecords(session!.id);
      return z.array(ActivityRecordPointSchema).parse(raw);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Sample down to max 300 points for render perf
  const chartData = useMemo(() => {
    if (!records) return [];
    const step = Math.max(1, Math.floor(records.length / 300));
    return records
      .filter((_, i) => i % step === 0)
      .map((r) => ({
        ...r,
        time: formatTime(r.timestamp),
      }));
  }, [records]);

  const sportColor: Record<string, string> = {
    running: "blue",
    cycling: "green",
    hiking: "orange",
    swimming: "cyan",
    walking: "purple",
  };

  return (
    <Drawer
      title={
        <Flex vertical gap={4}>
          <Flex align="center" gap={token.marginSM}>
            <Title level={5} style={{ margin: 0 }}>
              Activity Detail
            </Title>
            {session && (
              <Tag color={sportColor[session.sport] ?? "default"}>
                {session.sport.charAt(0).toUpperCase() + session.sport.slice(1)}
              </Tag>
            )}
          </Flex>
          {session && (
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              {new Date(session.activity_at).toLocaleString()}
            </Text>
          )}
        </Flex>
      }
      open={open}
      onClose={onClose}
      size="large"
      styles={{ body: { paddingTop: token.paddingMD } }}
    >
      {session && (
        <Flex gap={token.marginLG} style={{ marginBottom: token.marginLG }} wrap>
          <Flex align="center" gap={6}>
            <Clock size={14} style={{ color: token.colorTextSecondary }} />
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              {formatDuration(session.duration_sec)}
            </Text>
          </Flex>
          <Flex align="center" gap={6}>
            <MapPin size={14} style={{ color: token.colorTextSecondary }} />
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              {formatDistance(session.distance_m)}
            </Text>
          </Flex>
          <Flex align="center" gap={6}>
            <Heart size={14} style={{ color: token.colorError }} />
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              {session.avg_heart_rate_bpm} bpm avg / {session.max_heart_rate_bpm} bpm max
            </Text>
          </Flex>
          <Flex align="center" gap={6}>
            <Zap size={14} style={{ color: token.colorWarning }} />
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              {session.calories_kcal} kcal
            </Text>
          </Flex>
        </Flex>
      )}

      {isLoading ? (
        <Flex justify="center" align="center" style={{ height: 320 }}>
          <Spin size="large" />
        </Flex>
      ) : chartData.length === 0 ? (
        <Empty description="No records for this session" style={{ padding: token.paddingXL }} />
      ) : (
        <Flex vertical gap={token.marginLG}>
          {/* Heart Rate Chart */}
          <Flex vertical gap={6}>
            <Flex align="center" gap={6}>
              <Heart size={14} style={{ color: token.colorError }} />
              <Text strong style={{ fontSize: token.fontSizeSM }}>
                Heart Rate (bpm)
              </Text>
            </Flex>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={token.colorBorderSecondary} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: token.colorTextSecondary }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 10, fill: token.colorTextSecondary }}
                  unit=" bpm"
                />
                <Tooltip
                  contentStyle={{
                    background: token.colorBgContainer,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    borderRadius: token.borderRadius,
                    fontSize: 11,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="heart_rate_bpm"
                  name="HR"
                  stroke={token.colorError}
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Flex>

          {/* Speed + Altitude Chart */}
          <Flex vertical gap={6}>
            <Flex align="center" gap={6}>
              <Zap size={14} style={{ color: token.colorPrimary }} />
              <Text strong style={{ fontSize: token.fontSizeSM }}>
                Speed & Altitude
              </Text>
            </Flex>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={token.colorBorderSecondary} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: token.colorTextSecondary }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="speed"
                  tick={{ fontSize: 10, fill: token.colorTextSecondary }}
                  unit=" km/h"
                />
                <YAxis
                  yAxisId="alt"
                  orientation="right"
                  tick={{ fontSize: 10, fill: token.colorTextSecondary }}
                  unit=" m"
                />
                <Tooltip
                  contentStyle={{
                    background: token.colorBgContainer,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    borderRadius: token.borderRadius,
                    fontSize: 11,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  yAxisId="speed"
                  type="monotone"
                  dataKey="speed_kmh"
                  name="Speed"
                  stroke={token.colorPrimary}
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  yAxisId="alt"
                  type="monotone"
                  dataKey="altitude_m"
                  name="Altitude"
                  stroke={token.colorWarning}
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Flex>
        </Flex>
      )}
    </Drawer>
  );
}
