import { Button, DatePicker, Select, theme } from "antd";
import type { RangePickerProps } from "antd/es/date-picker";
import { RefreshCw } from "lucide-react";
import { forwardRef, useMemo } from "react";
import { FilterToolbar } from "@/components/FilterToolbar";

const { RangePicker } = DatePicker;

export type ChatDateRange = [string | null, string | null] | null;

export type ChatToolbarProps = {
  status: string;
  onStatusChange: (val: string) => void;
  dateRange: ChatDateRange;
  onDateRangeChange: (range: ChatDateRange) => void;
  onRefresh: () => void;
};

export const Toolbar = forwardRef<HTMLDivElement, ChatToolbarProps>(function Toolbar(props, ref) {
  const { token } = theme.useToken();

  const handleRangeChange: RangePickerProps["onChange"] = (_, dateStrings) => {
    if (!dateStrings[0] && !dateStrings[1]) {
      props.onDateRangeChange(null);
    } else {
      props.onDateRangeChange([dateStrings[0] || null, dateStrings[1] || null]);
    }
  };

  const slots = useMemo(
    () => [
      {
        key: "status",
        minWidth: 180,
        children: (
          <Select
            allowClear
            placeholder="Filter by Status"
            style={{ width: 180 }}
            value={props.status || undefined}
            onChange={(v) => props.onStatusChange(v ?? "")}
            options={[
              { label: "⏳ Waiting", value: "waiting" },
              { label: "💬 Active", value: "active" },
              { label: "✅ Resolved", value: "resolved" },
            ]}
          />
        ),
      },
      {
        key: "dateRange",
        minWidth: 300,
        children: (
          <RangePicker
            showTime={{ format: "HH:mm" }}
            format="YYYY-MM-DD HH:mm"
            style={{ width: 300 }}
            onChange={handleRangeChange}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.status, props.onStatusChange, props.onDateRangeChange],
  );

  return (
    <FilterToolbar
      ref={ref}
      slots={slots}
      moreFiltersLabel="More Filters"
      actions={
        <Button icon={<RefreshCw size={token.fontSize} />} onClick={props.onRefresh}>
          Refresh
        </Button>
      }
    />
  );
});
