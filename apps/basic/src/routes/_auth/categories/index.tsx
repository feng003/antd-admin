import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Table, Button, Card, Space, Modal, Form, Input, InputNumber, App, Tabs } from "antd";
import { Plus, Edit, Trash } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCategoryTree, createCategory, updateCategory, deleteCategory } from "@/api/category";
import type { Category, CreateCategoryReq, UpdateCategoryReq } from "@/api/category";

export const Route = createFileRoute("/_auth/categories/")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const [activeType, setActiveType] = useState("product");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [form] = Form.useForm<CreateCategoryReq & UpdateCategoryReq>();

  // Fetch Categories for active tab
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories", activeType],
    queryFn: () => getCategoryTree(activeType),
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      message.success("创建分类成功");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categoryTree"] }); // product form usage
      handleCloseModal();
    },
    onError: (err: any) => message.error(err.message || "创建失败"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: number; req: UpdateCategoryReq }) => updateCategory(id, req),
    onSuccess: () => {
      message.success("更新分类成功");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categoryTree"] });
      handleCloseModal();
    },
    onError: (err: any) => message.error(err.message || "更新失败"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      message.success("删除分类成功");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categoryTree"] });
    },
    onError: (err: any) => message.error(err.message || "删除失败"),
  });

  const handleOpenModal = (category?: Category, parent?: Category) => {
    if (category) {
      setEditingCategory(category);
      setParentCategory(null);
      form.setFieldsValue({ name: category.name, sort: category.sort });
    } else {
      setEditingCategory(null);
      setParentCategory(parent || null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setParentCategory(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingCategory) {
        updateMutation.mutate({
          id: editingCategory.id,
          req: { name: values.name, sort: values.sort },
        });
      } else {
        createMutation.mutate({
          name: values.name,
          sort: values.sort || 0,
          type: activeType,
          parent_id: parentCategory ? parentCategory.id : undefined,
        });
      }
    } catch (e) {
      // Validate Failed
    }
  };

  const handleDelete = (record: Category) => {
    modal.confirm({
      title: "确认删除该分类？",
      content: "删除后无法恢复，且如果有子分类也会受到影响或无法删除。",
      onOk: () => deleteMutation.mutate(record.id),
    });
  };

  const columns = [
    { title: "分类名称", dataIndex: "name", key: "name" },
    { title: "排序", dataIndex: "sort", key: "sort", width: 100 },
    {
      title: "操作",
      key: "action",
      width: 250,
      render: (_: unknown, record: Category) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<Plus size={14} />}
            onClick={() => handleOpenModal(undefined, record)}
          >
            添加子级
          </Button>
          <Button
            type="link"
            size="small"
            icon={<Edit size={14} />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Button
            type="text"
            danger
            size="small"
            icon={<Trash size={14} />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const tabItems = [
    { key: "product", label: "商品分类" },
    { key: "article", label: "文章分类" },
  ];

  return (
    <Card
      title="分类管理"
      extra={
        <Button type="primary" icon={<Plus size={16} />} onClick={() => handleOpenModal()}>
          新增顶级分类
        </Button>
      }
    >
      <Tabs activeKey={activeType} onChange={setActiveType} items={tabItems} />

      <Table
        dataSource={categories || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={false}
      />

      <Modal
        title={
          editingCategory
            ? "编辑分类"
            : parentCategory
              ? `新增 [${parentCategory.name}] 的子分类`
              : "新增顶级分类"
        }
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: "请输入分类名称" }]}
          >
            <Input placeholder="输入分类名称" />
          </Form.Item>
          <Form.Item name="sort" label="排序权重" initialValue={0}>
            <InputNumber placeholder="数字越大越靠后" style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
