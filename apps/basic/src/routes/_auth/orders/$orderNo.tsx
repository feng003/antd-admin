import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card, Descriptions, Table, Button, Flex, theme, Tag, Image } from "antd";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getOrderDetail } from "@/api/order";
import type { OrderDetailItem } from "@/api/order";

export const Route = createFileRoute("/_auth/orders/$orderNo")({
  component: OrderDetailPage,
});

const ORDER_STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: "待付款", color: "warning" },
  1: { label: "已付款", color: "processing" },
  2: { label: "已完成", color: "success" },
  3: { label: "已取消", color: "default" },
  4: { label: "退款中", color: "error" },
};

function OrderDetailPage() {
  const { orderNo } = Route.useParams();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const { data, isLoading } = useQuery({
    queryKey: ["order-detail", orderNo],
    queryFn: () => getOrderDetail(orderNo),
    enabled: !!orderNo,
  });

  if (isLoading) {
    return (
      <Card>
        <div>加载中...</div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <Flex vertical align="center" gap={token.marginMD}>
          <div>订单不存在或已被删除</div>
          <Button
            icon={<ArrowLeft size={16} />}
            onClick={() =>
              void navigate({
                to: "/orders",
                search: {
                  page: 1,
                  page_size: 20,
                  status: "",
                  order_no: "",
                  user_keyword: "",
                },
              })
            }
          >
            返回订单列表
          </Button>
        </Flex>
      </Card>
    );
  }

  const statusInfo = ORDER_STATUS_MAP[data.status] ?? {
    label: String(data.status),
    color: "default",
  };

  const itemColumns = [
    {
      title: "商品封面",
      dataIndex: "cover_image",
      key: "cover_image",
      width: 80,
      render: (v: string | null | undefined) =>
        v ? <Image src={v} width={48} height={48} style={{ objectFit: "cover" }} /> : "—",
    },
    {
      title: "商品名称",
      dataIndex: "product_name",
      key: "product_name",
    },
    {
      title: "单价(元)",
      dataIndex: "unit_price",
      key: "unit_price",
      width: 120,
      render: (v: number) => `¥ ${(v / 100).toFixed(2)}`,
    },
    {
      title: "数量",
      dataIndex: "quantity",
      key: "quantity",
      width: 80,
    },
    {
      title: "小计(元)",
      dataIndex: "sub_total",
      key: "sub_total",
      width: 120,
      render: (v: number) => `¥ ${(v / 100).toFixed(2)}`,
    },
    {
      title: "实时价格",
      dataIndex: "current_price",
      key: "current_price",
      width: 120,
      render: (v: number | null | undefined) => (v != null ? `¥ ${(v / 100).toFixed(2)}` : "—"),
    },
    {
      title: "可售",
      dataIndex: "is_available",
      key: "is_available",
      width: 80,
      render: (v: boolean | null | undefined) =>
        v == null ? "—" : v ? <Tag color="green">是</Tag> : <Tag color="red">否</Tag>,
    },
  ];

  return (
    <Flex vertical gap={token.marginMD} style={{ flex: "1 1 0%", minHeight: 0 }}>
      <Flex justify="space-between" align="center">
        <Button
          type="text"
          icon={<ArrowLeft size={16} />}
          onClick={() =>
            void navigate({
              to: "/orders",
              search: {
                page: 1,
                page_size: 20,
                status: "",
                order_no: "",
                user_keyword: "",
              },
            })
          }
        >
          返回订单列表
        </Button>
      </Flex>

      <Card title={`订单 ${data.order_no}`} bordered={false}>
        <Descriptions column={3} bordered size="small">
          <Descriptions.Item label="订单号">{data.order_no}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="订单金额">
            ¥ {(data.total_amount / 100).toFixed(2)}
          </Descriptions.Item>
          <Descriptions.Item label="下单时间">
            {new Date(data.created_at).toLocaleString("zh-CN")}
          </Descriptions.Item>
          <Descriptions.Item label="付款时间">
            {data.paid_at ? new Date(data.paid_at).toLocaleString("zh-CN") : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="取消原因">{data.cancel_reason ?? "—"}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="订单明细" bordered={false}>
        <Table<OrderDetailItem>
          rowKey={(item) => `${item.product_id}-${item.quantity}`}
          columns={itemColumns}
          dataSource={data.items}
          pagination={false}
          size="small"
          scroll={{ x: "max-content" }}
        />
      </Card>
    </Flex>
  );
}
