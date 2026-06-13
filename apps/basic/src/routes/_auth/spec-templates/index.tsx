import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Table, Card, Button, Space, Modal, Form, Input, InputNumber, App, Popconfirm } from "antd";
import { Plus, Edit, Trash } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSpecTemplates,
  createSpecTemplate,
  updateSpecTemplate,
  deleteSpecTemplate,
  createSpecTemplateValue,
  updateSpecTemplateValue,
  deleteSpecTemplateValue,
} from "@/api/spec-template";
import type {
  SpecTemplate,
  SpecTemplateValue,
  CreateSpecTemplateReq,
  CreateSpecTemplateValueReq,
} from "@/api/spec-template";

export const Route = createFileRoute("/_auth/spec-templates/")({
  component: SpecTemplatesPage,
});

function SpecTemplatesPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  // Tpl Modal
  const [isTplModalOpen, setIsTplModalOpen] = useState(false);
  const [editingTpl, setEditingTpl] = useState<SpecTemplate | null>(null);
  const [tplForm] = Form.useForm<CreateSpecTemplateReq>();

  // Val Modal
  const [isValModalOpen, setIsValModalOpen] = useState(false);
  const [editingVal, setEditingVal] = useState<SpecTemplateValue | null>(null);
  const [currentTplId, setCurrentTplId] = useState<number | null>(null);
  const [valForm] = Form.useForm<CreateSpecTemplateValueReq>();

  const { data: templates, isLoading } = useQuery({
    queryKey: ["spec-templates"],
    queryFn: getSpecTemplates,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["spec-templates"] });

  // Tpl Mutations
  const createTplMut = useMutation({
    mutationFn: createSpecTemplate,
    onSuccess: () => {
      message.success("操作成功");
      invalidate();
      setIsTplModalOpen(false);
    },
  });
  const updateTplMut = useMutation({
    mutationFn: ({ id, req }: any) => updateSpecTemplate(id, req),
    onSuccess: () => {
      message.success("操作成功");
      invalidate();
      setIsTplModalOpen(false);
    },
  });
  const deleteTplMut = useMutation({
    mutationFn: deleteSpecTemplate,
    onSuccess: () => {
      message.success("删除成功");
      invalidate();
    },
  });

  // Val Mutations
  const createValMut = useMutation({
    mutationFn: createSpecTemplateValue,
    onSuccess: () => {
      message.success("操作成功");
      invalidate();
      setIsValModalOpen(false);
    },
  });
  const updateValMut = useMutation({
    mutationFn: ({ id, req }: any) => updateSpecTemplateValue(id, req),
    onSuccess: () => {
      message.success("操作成功");
      invalidate();
      setIsValModalOpen(false);
    },
  });
  const deleteValMut = useMutation({
    mutationFn: deleteSpecTemplateValue,
    onSuccess: () => {
      message.success("删除成功");
      invalidate();
    },
  });

  const handleOpenTpl = (tpl?: SpecTemplate) => {
    if (tpl) {
      setEditingTpl(tpl);
      tplForm.setFieldsValue(tpl);
    } else {
      setEditingTpl(null);
      tplForm.resetFields();
      tplForm.setFieldsValue({ sort_order: 0 });
    }
    setIsTplModalOpen(true);
  };

  const handleOpenVal = (tplId: number, val?: SpecTemplateValue) => {
    setCurrentTplId(tplId);
    if (val) {
      setEditingVal(val);
      valForm.setFieldsValue(val);
    } else {
      setEditingVal(null);
      valForm.resetFields();
      valForm.setFieldsValue({ sort_order: 0 });
    }
    setIsValModalOpen(true);
  };

  const tplColumns = [
    { title: "ID", dataIndex: "id", width: 80 },
    { title: "规格名称", dataIndex: "name" },
    { title: "排序权重", dataIndex: "sort_order", width: 100 },
    {
      title: "创建时间",
      dataIndex: "created_at",
      render: (v: number) => new Date(v * 1000).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      key: "actions",
      width: 150,
      render: (_: unknown, record: SpecTemplate) => (
        <Space>
          <Button type="text" size="small" onClick={() => handleOpenVal(record.id)}>
            添加值
          </Button>
          <Button
            type="text"
            size="small"
            icon={<Edit size={16} />}
            onClick={() => handleOpenTpl(record)}
          />
          <Popconfirm
            title="确认删除？将级联删除其所有值！"
            onConfirm={() => deleteTplMut.mutate(record.id)}
          >
            <Button type="text" size="small" danger icon={<Trash size={16} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const valColumns = [
    { title: "值ID", dataIndex: "id", width: 80 },
    { title: "值名称", dataIndex: "name" },
    { title: "排序权重", dataIndex: "sort_order", width: 100 },
    {
      title: "操作",
      key: "actions",
      width: 100,
      render: (_: unknown, record: SpecTemplateValue) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<Edit size={16} />}
            onClick={() => handleOpenVal(currentTplId!, record)}
          />
          <Popconfirm title="确认删除？" onConfirm={() => deleteValMut.mutate(record.id)}>
            <Button type="text" size="small" danger icon={<Trash size={16} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="全局规格模板"
      extra={
        <Button type="primary" icon={<Plus size={16} />} onClick={() => handleOpenTpl()}>
          新增规格键
        </Button>
      }
    >
      <Table
        rowKey="id"
        dataSource={templates || []}
        columns={tplColumns}
        loading={isLoading}
        pagination={false}
        expandable={{
          expandedRowRender: (record) => (
            <Table
              rowKey="id"
              dataSource={record.values || []}
              columns={valColumns}
              pagination={false}
              size="small"
              onRow={() => ({ onClick: () => setCurrentTplId(record.id) })} // Ensure currentTplId is set for val actions if clicked
            />
          ),
        }}
      />

      {/* Tpl Modal */}
      <Modal
        title={editingTpl ? "编辑规格键" : "新增规格键"}
        open={isTplModalOpen}
        onOk={async () => {
          const values = await tplForm.validateFields();
          if (editingTpl) updateTplMut.mutate({ id: editingTpl.id, req: values });
          else createTplMut.mutate(values);
        }}
        onCancel={() => setIsTplModalOpen(false)}
        confirmLoading={createTplMut.isPending || updateTplMut.isPending}
      >
        <Form form={tplForm} layout="vertical">
          <Form.Item name="name" label="规格键名称" rules={[{ required: true, message: "请输入" }]}>
            <Input placeholder="例如：颜色、尺码、内存" />
          </Form.Item>
          <Form.Item name="sort_order" label="排序权重">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Val Modal */}
      <Modal
        title={editingVal ? "编辑规格值" : "新增规格值"}
        open={isValModalOpen}
        onOk={async () => {
          const values = await valForm.validateFields();
          const req = { ...values, template_id: currentTplId! };
          if (editingVal) updateValMut.mutate({ id: editingVal.id, req });
          else createValMut.mutate(req);
        }}
        onCancel={() => setIsValModalOpen(false)}
        confirmLoading={createValMut.isPending || updateValMut.isPending}
      >
        <Form form={valForm} layout="vertical">
          <Form.Item name="name" label="规格值名称" rules={[{ required: true, message: "请输入" }]}>
            <Input placeholder="例如：红色、XL、16GB" />
          </Form.Item>
          <Form.Item name="sort_order" label="排序权重">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
