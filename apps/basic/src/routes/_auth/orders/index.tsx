import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, Space, App, Dropdown, theme, Badge, Flex } from "antd";
import type { TablePaginationConfig } from "antd/es/table/interface";
import { useMemo, useRef } from "react";
import { MoreVertical, Eye, RefreshCcw } from "lucide-react";
import { z } from "zod/v4";
import { DataTable } from "@/components/DataTable";
import { useTableFitHeight } from "@/hooks/useTableFitHeight";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrderList, refundOrder } from "@/api/order";
import type { OrderItem } from "@/api/order";

const OrderSearchParamsSchema = z.object({
  page: z.number().int().positive().catch(1),
  page_size: z.number().int().positive().catch(20),
  status: z.string().catch(""),
  order_no: z.string().catch(""),
  user_keyword: z.string().catch(""),
});

export const Route = createFileRoute("/_auth/orders/")({
  validateSearch: (search) => OrderSearchParamsSchema.parse(search),
  component: OrdersPage,
});

const ORDER_STATUS_MAP: Record<
  number,
  { label: string; color: "warning" | "success" | "default" | "error" | "processing" }
> = {
  0: { label: "待付款", color: "warning" },
  1: { label: "已付款", color: "processing" },
  2: { label: "已完成", color: "success" },
  3: { label: "已取消", color: "default" },
  4: { label: "退款中", color: "error" },
};

function OrdersPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { message, modal } = App.useApp();
  const { token } = theme.useToken();
  const queryClient = useQueryClient();

  const pageShellRef = useRef<HTMLDivElement>(null);
  const toolbarRowRef = useRef<HTMLDivElement>(null);
  const middleSectionRef = useRef<HTMLDivElement>(null);
  const tableFrameRef = useRef<HTMLDivElement>(null);

  const queryKey = [
    "orders",
    search.page,
    search.page_size,
    search.status,
    search.order_no,
    search.user_keyword,
  ];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      getOrderList({
        page: search.page,
        page_size: search.page_size,
        status: search.status || undefined,
        order_no: search.order_no || undefined,
        user_keyword: search.user_keyword || undefined,
      }),
  });

  const refundMutation = useMutation({
    mutationFn: ({ orderNo, reason }: { orderNo: string; reason: string }) =>
      refundOrder(orderNo, { refund_amount: 0, reason }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void message.success("退款申请已提交");
    },
    onError: (err) => void message.error(err instanceof Error ? err.message : "操作失败"),
  });

  const confirmRefund = (record: OrderItem) => {
    modal.confirm({
      title: `确认对订单 ${record.order_no} 发起退款？`,
      content: "该操作将强制取消订单并触发退款流程。",
      okText: "确认退款",
      okType: "danger",
      cancelText: "取消",
      onOk: () => refundMutation.mutate({ orderNo: record.order_no, reason: "管理员手动退款" }),
    });
  };

  const columns = [
    {
      title: "订单号",
      dataIndex: "order_no",
      key: "order_no",
      width: 200,
    },
    {
      title: "用户 ID",
      dataIndex: "user_id",
      key: "user_id",
      width: 100,
    },
    {
      title: "金额(分)",
      dataIndex: "total_amount",
      key: "total_amount",
      width: 120,
      render: (v: number) => `¥ ${(v / 100).toFixed(2)}`,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: number) => {
        const s = ORDER_STATUS_MAP[status] ?? { label: String(status), color: "default" as const };
        return <Badge status={s.color} text={s.label} />;
      },
    },
    {
      title: "下单时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 170,
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
    {
      title: "付款时间",
      dataIndex: "paid_at",
      key: "paid_at",
      width: 170,
      render: (v: string | null) => (v ? new Date(v).toLocaleString("zh-CN") : "—"),
    },
    {
      title: "操作",
      key: "actions",
      width: 60,
      align: "right" as const,
      render: (_: unknown, record: OrderItem) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "view",
                icon: <Eye size={token.fontSize} />,
                label: "查看详情",
                onClick: () => console.log("navigate to order", record.order_no),
              },
              {
                key: "refund",
                icon: <RefreshCcw size={token.fontSize} />,
                label: "退款",
                danger: true,
                disabled: record.status === 3 || record.status === 4,
                onClick: () => confirmRefund(record),
              },
            ],
          }}
          placement="bottomRight"
        >
          <Button type="text" icon={<MoreVertical size={token.fontSize} />} aria-label="操作" />
        </Dropdown>
      ),
    },
  ];

  const showPagination = (data?.total ?? 0) > search.page_size;

  const { tableAreaMaxHeight, tableScrollY, lockScrollHeight } = useTableFitHeight({
    pageShellRef,
    toolbarRef: toolbarRowRef,
    middleRef: middleSectionRef,
    tableFrameRef,
    marginLG: token.marginLG,
    rowCount: data?.list?.length ?? 0,
    isLoading,
    showPagination,
  });

  const tablePagination: false | TablePaginationConfig = useMemo(
    () =>
      showPagination
        ? {
            total: data?.total ?? 0,
            current: search.page,
            pageSize: search.page_size,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              void navigate({
                search: { ...search, page, page_size: pageSize ?? search.page_size },
              });
            },
          }
        : false,
    [showPagination, data?.total, search, navigate],
  );

  return (
    <Flex
      ref={pageShellRef}
      vertical
      gap={token.marginMD}
      style={{ flex: "1 1 0%", minHeight: 0, overflow: "hidden" }}
    >
      {/* 状态筛选 */}
      <Flex ref={toolbarRowRef} justify="space-between" align="center">
        <Space>
          {(["", "0", "1", "2", "3", "4"] as string[]).map((s) => (
            <Button
              key={s}
              type={search.status === s ? "primary" : "default"}
              size="small"
              onClick={() => void navigate({ search: { ...search, status: s, page: 1 } })}
            >
              {s === "" ? "全部" : (ORDER_STATUS_MAP[Number(s)]?.label ?? s)}
            </Button>
          ))}
        </Space>
      </Flex>

      <DataTable<OrderItem>
        layoutRef={middleSectionRef}
        frameRef={tableFrameRef}
        lockScrollHeight={lockScrollHeight}
        maxHeight={tableAreaMaxHeight}
        frameHeight={
          tableScrollY != null && tableAreaMaxHeight != null ? tableAreaMaxHeight : undefined
        }
        rowKey="order_no"
        size="small"
        columns={columns}
        dataSource={data?.list ?? []}
        loading={isLoading}
        pagination={tablePagination}
        scroll={tableScrollY != null ? { x: "max-content", y: tableScrollY } : { x: "max-content" }}
      />
    </Flex>
  );
}
