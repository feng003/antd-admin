import { useMemo, useState } from "react";
import { Card, Flex, Segmented, theme, Typography, Empty } from "antd";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { SessionStatsPoint } from "@/api/schemas";
import { BarChart2, TrendingUp } from "lucide-react";

const { Text } = Typography;

type ChartMode = "bar" | "line";

type Props = {
  data: SessionStatsPoint[];
  loading?: boolean;
};

function formatPeriod(period: string): string {
  // "2025-06-01" → "Jun 25" (month) or "Jun 1" (day/week)
  const d = new Date(period);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function StatsChart({ data, loading }: Props) {
  const { token } = theme.useToken();
  const [mode, setMode] = useState<ChartMode>("bar");

  const chartData = useMemo(
    () =>
      data.map((p) => ({
        ...p,
        period_label: formatPeriod(p.period),
        distance_km: parseFloat((p.total_distance_m / 1000).toFixed(2)),
        duration_h: parseFloat((p.total_duration_sec / 3600).toFixed(2)),
      })),
    [data],
  );

  const isEmpty = !loading && data.length === 0;

  return (
    <Card
      title={
        <Flex align="center" justify="space-between" style={{ width: "100%" }}>
          <Flex align="center" gap={token.marginSM}>
            <TrendingUp size={16} style={{ color: token.colorPrimary }} />
            <Text strong>Activity Trends</Text>
          </Flex>
          <Segmented
            size="small"
            value={mode}
            onChange={(v) => setMode(v as ChartMode)}
            options={[
              { value: "bar", icon: <BarChart2 size={14} /> },
              { value: "line", icon: <TrendingUp size={14} /> },
            ]}
          />
        </Flex>
      }
      styles={{ body: { paddingTop: token.paddingSM } }}
    >
      {isEmpty ? (
        <Empty description="No activity data" style={{ padding: token.paddingLG }} />
      ) : mode === "bar" ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={token.colorBorderSecondary} />
            <XAxis dataKey="period_label" tick={{ fontSize: 11, fill: token.colorTextSecondary }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: token.colorTextSecondary }} />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: token.colorTextSecondary }}
              unit=" bpm"
            />
            <Tooltip
              contentStyle={{
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: token.borderRadius,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              yAxisId="left"
              dataKey="count"
              name="Sessions"
              fill={token.colorPrimary}
              radius={[3, 3, 0, 0]}
            />
            <Bar
              yAxisId="left"
              dataKey="distance_km"
              name="Distance (km)"
              fill={token.colorSuccess}
              radius={[3, 3, 0, 0]}
            />
            <Bar
              yAxisId="right"
              dataKey="avg_heart_rate"
              name="Avg Heart Rate"
              fill={token.colorError}
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={token.colorBorderSecondary} />
            <XAxis dataKey="period_label" tick={{ fontSize: 11, fill: token.colorTextSecondary }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: token.colorTextSecondary }} />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: token.colorTextSecondary }}
              unit=" bpm"
            />
            <Tooltip
              contentStyle={{
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: token.borderRadius,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="count"
              name="Sessions"
              stroke={token.colorPrimary}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="distance_km"
              name="Distance (km)"
              stroke={token.colorSuccess}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avg_heart_rate"
              name="Avg Heart Rate (bpm)"
              stroke={token.colorError}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
