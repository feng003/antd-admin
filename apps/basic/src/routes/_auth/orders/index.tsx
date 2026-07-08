import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  Button,
  Space,
  App,
  Dropdown,
  theme,
  Badge,
  Flex,
  Modal,
  InputNumber,
  Input,
  Form,
} from "antd";
import type { TablePaginationConfig } from "antd/es/table/interface";
import { useMemo, useRef, useState } from "react";
import { MoreVertical, Eye, RefreshCcw } from "lucide-react";
import { z } from "zod/v4";
import { DataTable } from "@/components/DataTable";
import { useTableFitHeight } from "@/hooks/useTableFitHeight";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrderList, refundOrder } from "@/api/order";
import type { OrderItem, RefundReq } from "@/api/order";

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
  {
    label: string;
    color: "warning" | "success" | "default" | "error" | "processing";
  }
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
  const { message } = App.useApp();
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
    mutationFn: ({ orderNo, req }: { orderNo: string; req: RefundReq }) =>
      refundOrder(orderNo, req),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void message.success("退款申请已提交");
    },
    onError: (err) => void message.error(err instanceof Error ? err.message : "操作失败"),
  });

  // #5 退款金额由后台填写，通过 modal 采集金额 + 原因后提交
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundRecord, setRefundRecord] = useState<OrderItem | null>(null);
  const [refundForm] = Form.useForm<{
    refund_amount: number;
    reason: string;
  }>();

  const openRefundModal = (record: OrderItem) => {
    setRefundRecord(record);
    // 默认退款金额 = 订单总额（分转元）
    refundForm.setFieldsValue({
      refund_amount: record.total_amount / 100,
      reason: "管理员手动退款",
    });
    setRefundModalOpen(true);
  };

  const handleRefundOk = async () => {
    if (!refundRecord) return;
    try {
      const values = await refundForm.validateFields();
      refundMutation.mutate({
        orderNo: refundRecord.order_no,
        req: {
          refund_amount: Math.round(values.refund_amount * 100), // 元转分
          reason: values.reason,
        },
      });
      setRefundModalOpen(false);
    } catch {
      // form validation failed — AntD displays field errors
    }
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
        const s = ORDER_STATUS_MAP[status] ?? {
          label: String(status),
          color: "default" as const,
        };
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
                label: (
                  <Link to="/orders/$orderNo" params={{ orderNo: record.order_no }}>
                    查看详情
                  </Link>
                ),
              },
              {
                key: "refund",
                icon: <RefreshCcw size={token.fontSize} />,
                label: "退款",
                danger: true,
                disabled: record.status === 3 || record.status === 4,
                onClick: () => openRefundModal(record),
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
                search: {
                  ...search,
                  page,
                  page_size: pageSize ?? search.page_size,
                },
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

      {/* #5 退款金额由后台填写 */}
      <Modal
        title={`退款 — 订单 ${refundRecord?.order_no ?? ""}`}
        open={refundModalOpen}
        onOk={handleRefundOk}
        onCancel={() => setRefundModalOpen(false)}
        confirmLoading={refundMutation.isPending}
        okText="确认退款"
        okType="danger"
        cancelText="取消"
      >
        <Form form={refundForm} layout="vertical">
          <Form.Item
            name="refund_amount"
            label="退款金额（元）"
            rules={[
              { required: true, message: "请输入退款金额" },
              { type: "number", min: 0.01, message: "退款金额必须大于 0" },
            ]}
          >
            <InputNumber min={0.01} precision={2} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="reason"
            label="退款原因"
            rules={[{ required: true, message: "请输入退款原因" }]}
          >
            <Input.TextArea rows={3} placeholder="请输入退款原因" />
          </Form.Item>
        </Form>
      </Modal>
    </Flex>
  );
}
