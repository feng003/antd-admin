import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Table, Card, Form, Input, Button, Tag, Space } from "antd";
import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "@/api/audit-log";
import type { AuditLog, ListAuditLogsReq } from "@/api/audit-log";

export const Route = createFileRoute("/_auth/audit-logs/")({
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const [form] = Form.useForm();

  const [queryParams, setQueryParams] = useState<ListAuditLogsReq>({
    page: 1,
    page_size: 20,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["auditLogs", queryParams],
    queryFn: () => getAuditLogs(queryParams),
  });

  const handleSearch = (values: any) => {
    setQueryParams({
      ...queryParams,
      page: 1,
      operator_name: values.operator_name || undefined,
      action: values.action || undefined,
      resource_type: values.resource_type || undefined,
    });
  };

  const handleReset = () => {
    form.resetFields();
    setQueryParams({ page: 1, page_size: 20 });
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    {
      title: "操作人",
      dataIndex: "operator_name",
      key: "operator_name",
      width: 150,
      render: (text: string, record: AuditLog) => (
        <Space direction="vertical" size={0}>
          <span>{text}</span>
          <span style={{ fontSize: 12, color: "#999" }}>ID: {record.operator_id}</span>
        </Space>
      ),
    },
    {
      title: "操作动作",
      dataIndex: "action",
      key: "action",
      width: 150,
      render: (action: string) => <Tag color="blue">{action}</Tag>,
    },
    {
      title: "资源类型",
      dataIndex: "resource_type",
      key: "resource_type",
      width: 120,
    },
    {
      title: "资源 ID",
      dataIndex: "resource_id",
      key: "resource_id",
      width: 180,
    },
    {
      title: "操作原因",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
    },
    {
      title: "备注",
      dataIndex: "remark",
      key: "remark",
      ellipsis: true,
    },
    {
      title: "操作时间",
      dataIndex: "operated_at",
      key: "operated_at",
      width: 180,
      render: (text: string) => new Date(text).toLocaleString("zh-CN"),
    },
  ];

  return (
    <Card title="审计日志" bordered={false}>
      <Form form={form} layout="inline" onFinish={handleSearch} style={{ marginBottom: 16 }}>
        <Form.Item name="operator_name" label="操作人">
          <Input placeholder="输入操作人名称" allowClear />
        </Form.Item>
        <Form.Item name="action" label="操作动作">
          <Input placeholder="如: force_cancel_order" allowClear />
        </Form.Item>
        <Form.Item name="resource_type" label="资源类型">
          <Input placeholder="如: order" allowClear />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        dataSource={data?.items || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: queryParams.page,
          pageSize: queryParams.page_size,
          total: data?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) =>
            setQueryParams({ ...queryParams, page, page_size: pageSize }),
        }}
        size="small"
      />
    </Card>
  );
}
