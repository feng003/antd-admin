import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Table, Card, Form, Input, Button, Space, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import { getTags } from "@/api/tag";
import type { ListTagsReq } from "@/api/tag";

export const Route = createFileRoute("/_auth/tags/")({
  component: TagsPage,
});

function TagsPage() {
  const [form] = Form.useForm();

  const [queryParams, setQueryParams] = useState<ListTagsReq>({
    limit: 50,
  });

  const { data: tags, isLoading } = useQuery({
    queryKey: ["tags", queryParams],
    queryFn: () => getTags(queryParams),
  });

  const handleSearch = (values: any) => {
    setQueryParams({
      ...queryParams,
      q: values.q || undefined,
    });
  };

  const handleReset = () => {
    form.resetFields();
    setQueryParams({ limit: 50 });
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "标签名称", dataIndex: "name", key: "name" },
    {
      title: "引用次数 (热度)",
      dataIndex: "usage_count",
      key: "usage_count",
      render: (count: number) => (
        <Typography.Text type={count > 10 ? "danger" : "secondary"}>{count} 次</Typography.Text>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      key: "created_at",
      render: (ts: number) => new Date(ts * 1000).toLocaleString("zh-CN"),
    },
  ];

  return (
    <Card title="标签列表" bordered={false}>
      <Form form={form} layout="inline" onFinish={handleSearch} style={{ marginBottom: 16 }}>
        <Form.Item name="q" label="标签名称">
          <Input placeholder="支持模糊搜索" allowClear />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        dataSource={tags || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={false} // Tag API only supports limit, not page. So we just show 50.
        size="small"
      />
    </Card>
  );
}
