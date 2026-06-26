import { Button, Select, Space, Spin, DatePicker, theme } from "antd";
import { forwardRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FilterToolbar } from "@/components/FilterToolbar";
import { Search } from "lucide-react";
import { fetchSports } from "@/api/activity";
import { z } from "zod/v4";

const { RangePicker } = DatePicker;

const GROUP_BY_OPTIONS = [
  { value: "month", label: "Monthly" },
  { value: "week", label: "Weekly" },
  { value: "day", label: "Daily" },
];

/** 将原始 sport 字符串格式化为友好显示名（stair_climbing → Stair Climbing） */
function formatSportLabel(sport: string): string {
  return sport.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export type ActivityToolbarProps = {
  sport: string;
  groupBy: "month" | "week" | "day";
  onSportChange: (val: string) => void;
  onGroupByChange: (val: "month" | "week" | "day") => void;
  onDateRangeChange: (from: string, to: string) => void;
  onSearch: () => void;
};

export const ActivityToolbar = forwardRef<HTMLDivElement, ActivityToolbarProps>(
  function ActivityToolbar(props, ref) {
    const { token } = theme.useToken();

    // 从后端动态拉取运动类型
    const { data: sportsRaw, isLoading: sportsLoading } = useQuery({
      queryKey: ["activity-sports"],
      queryFn: async () => {
        const raw = await fetchSports();
        return z.array(z.string()).parse(raw);
      },
      staleTime: 5 * 60_000, // 5 分钟，运动类型不常变
      retry: 1,
    });

    const sportOptions = useMemo(() => {
      const base = [{ value: "", label: "All Sports" }];
      if (!sportsRaw) return base;
      return [...base, ...sportsRaw.map((s) => ({ value: s, label: formatSportLabel(s) }))];
    }, [sportsRaw]);

    const slots = useMemo(
      () => [
        {
          key: "sport",
          minWidth: 180,
          children: (
            <Select
              style={{ width: 180 }}
              value={props.sport}
              options={sportOptions}
              onChange={props.onSportChange}
              placeholder="Sport type"
              loading={sportsLoading}
              notFoundContent={sportsLoading ? <Spin size="small" /> : "No sports found"}
              showSearch
              optionFilterProp="label"
            />
          ),
        },
        {
          key: "daterange",
          minWidth: 240,
          children: (
            <RangePicker
              style={{ width: 240 }}
              onChange={(_, strings) => {
                props.onDateRangeChange(strings[0], strings[1]);
              }}
            />
          ),
        },
        {
          key: "groupby",
          minWidth: 130,
          children: (
            <Select
              style={{ width: 130 }}
              value={props.groupBy}
              options={GROUP_BY_OPTIONS}
              onChange={props.onGroupByChange}
            />
          ),
        },
      ],
      [props, sportOptions, sportsLoading],
    );

    return (
      <FilterToolbar
        ref={ref}
        slots={slots}
        moreFiltersLabel="More Filters"
        actions={
          <Space>
            <Button type="primary" icon={<Search size={token.fontSize} />} onClick={props.onSearch}>
              Search
            </Button>
          </Space>
        }
      />
    );
  },
);
