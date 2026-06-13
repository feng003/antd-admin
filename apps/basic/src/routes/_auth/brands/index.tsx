import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Table, Card, Button, Space, Modal, Form, Input, InputNumber, App, Popconfirm } from "antd";
import { Plus, Edit, Trash } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBrands, createBrand, updateBrand, deleteBrand } from "@/api/brand";
import type { Brand, CreateBrandReq } from "@/api/brand";

export const Route = createFileRoute("/_auth/brands/")({
  component: BrandsPage,
});

function BrandsPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [form] = Form.useForm<CreateBrandReq>();

  const { data: brands, isLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: getBrands,
  });

  const createMutation = useMutation({
    mutationFn: createBrand,
    onSuccess: () => {
      message.success("创建品牌成功");
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      setIsModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: number; req: CreateBrandReq }) => updateBrand(id, req),
    onSuccess: () => {
      message.success("更新品牌成功");
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      setIsModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBrand,
    onSuccess: () => {
      message.success("删除成功");
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });

  const handleOpenModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      form.setFieldsValue({
        name: brand.name,
        logo: brand.logo,
        description: brand.description,
        sort_order: brand.sort_order,
      });
    } else {
      setEditingBrand(null);
      form.resetFields();
      form.setFieldsValue({ sort_order: 0 });
    }
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingBrand) {
        updateMutation.mutate({ id: editingBrand.id, req: values });
      } else {
        createMutation.mutate(values);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 80 },
    { title: "品牌名称", dataIndex: "name" },
    {
      title: "Logo",
      dataIndex: "logo",
      render: (logo: string) => (logo ? <img src={logo} alt="logo" style={{ height: 30 }} /> : "—"),
    },
    { title: "描述", dataIndex: "description" },
    { title: "排序权重", dataIndex: "sort_order", width: 100 },
    {
      title: "创建时间",
      dataIndex: "created_at",
      render: (v: number) => new Date(v * 1000).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      key: "actions",
      width: 120,
      render: (_: unknown, record: Brand) => (
        <Space>
          <Button type="text" icon={<Edit size={16} />} onClick={() => handleOpenModal(record)} />
          <Popconfirm title="确认删除？" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button type="text" danger icon={<Trash size={16} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="品牌管理"
      extra={
        <Button type="primary" icon={<Plus size={16} />} onClick={() => handleOpenModal()}>
          新增品牌
        </Button>
      }
    >
      <Table
        rowKey="id"
        dataSource={brands || []}
        columns={columns}
        loading={isLoading}
        pagination={{ defaultPageSize: 20 }}
      />

      <Modal
        title={editingBrand ? "编辑品牌" : "新增品牌"}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="品牌名称"
            rules={[{ required: true, message: "请输入品牌名称" }]}
          >
            <Input placeholder="例如：Apple" />
          </Form.Item>
          <Form.Item name="logo" label="Logo URL">
            <Input placeholder="输入图片地址" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="sort_order" label="排序权重">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
