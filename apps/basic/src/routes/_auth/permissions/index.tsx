import { createFileRoute } from "@tanstack/react-router";
import {
  Button,
  theme,
  Flex,
  Tag,
  Tree,
  Spin,
  App,
  Form,
  Input,
  InputNumber,
  Select,
  Dropdown,
} from "antd";
import type { DataNode } from "antd/es/tree";
import { useRef, useState } from "react";
import { Plus, Pencil, Trash2, MoreVertical } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPermissionTree,
  createPermission,
  updatePermission,
  deletePermission,
} from "@/api/permission";
import type { PermissionNode, CreatePermissionReq } from "@/api/permission";
import { BaseFormModal } from "@/components/FormModal";

export const Route = createFileRoute("/_auth/permissions/")({
  component: PermissionsPage,
});

const TYPE_LABEL: Record<number, { label: string; color: string }> = {
  1: { label: "菜单", color: "blue" },
  2: { label: "API", color: "green" },
  3: { label: "按钮", color: "orange" },
};

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => ({
  label: m,
  value: m,
}));

// ── Create / Edit Permission Modal ────────────────────────────────────────────

type PermFormValues = {
  parent_id?: number;
  type: number;
  name: string;
  code: string;
  api_path?: string;
  api_method?: string;
  icon?: string;
  sort?: number;
  status?: number;
};

type PermModalProps = {
  open: boolean;
  editNode: PermissionNode | null;
  /** When set, pre-fills parent_id (creating a child of this node) */
  parentNode: PermissionNode | null;
  onCancel: () => void;
  onSuccess: () => void;
};

function PermissionFormModal({ open, editNode, parentNode, onCancel, onSuccess }: PermModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<PermFormValues>();
  const isEdit = editNode !== null;

  const createMutation = useMutation({
    mutationFn: (values: CreatePermissionReq) => createPermission(values),
    onSuccess: () => {
      void message.success("权限创建成功");
      form.resetFields();
      onSuccess();
    },
    onError: (err) => void message.error(err instanceof Error ? err.message : "创建失败"),
  });

  const updateMutation = useMutation({
    mutationFn: (values: Partial<CreatePermissionReq>) => updatePermission(editNode!.id, values),
    onSuccess: () => {
      void message.success("权限更新成功");
      onSuccess();
    },
    onError: (err) => void message.error(err instanceof Error ? err.message : "更新失败"),
  });

  // Populate on open
  if (open && isEdit && form.getFieldValue("name") === undefined) {
    form.setFieldsValue({
      parent_id: editNode.parent_id || undefined,
      type: editNode.type,
      name: editNode.name,
      code: editNode.code,
      api_path: editNode.api_path ?? "",
      api_method: editNode.api_method ?? undefined,
      icon: editNode.icon ?? "",
      sort: editNode.sort,
      status: editNode.status,
    });
  }
  if (open && !isEdit && parentNode) {
    const current = form.getFieldValue("parent_id");
    if (current === undefined) {
      form.setFieldValue("parent_id", parentNode.id);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleFinish = (values: PermFormValues) => {
    if (isEdit) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values as CreatePermissionReq);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const watchType = Form.useWatch("type", form);
  const showApiFields = watchType === 2;

  return (
    <BaseFormModal
      open={open}
      title={isEdit ? `编辑权限 — ${editNode?.name}` : "新建权限"}
      okText={isEdit ? "保存" : "创建"}
      cancelText="取消"
      form={form}
      confirmLoading={isPending}
      onCancel={handleCancel}
      onFinish={handleFinish}
    >
      <Form.Item name="parent_id" label="上级节点 ID">
        <InputNumber min={0} style={{ width: "100%" }} placeholder="0 表示顶层节点" />
      </Form.Item>

      <Form.Item
        name="type"
        label="类型"
        rules={[{ required: true, message: "请选择类型" }]}
        initialValue={1}
      >
        <Select
          options={[
            { label: "菜单", value: 1 },
            { label: "API", value: 2 },
            { label: "按钮", value: 3 },
          ]}
        />
      </Form.Item>

      <Form.Item name="name" label="名称" rules={[{ required: true, message: "请输入名称" }]}>
        <Input placeholder="例：用户管理" />
      </Form.Item>

      <Form.Item name="code" label="Code" rules={[{ required: true, message: "请输入 Code" }]}>
        <Input placeholder="例：user:list" style={{ fontFamily: "monospace" }} />
      </Form.Item>

      {showApiFields && (
        <Flex gap={8}>
          <Form.Item name="api_method" label="HTTP 方法" style={{ flex: 1 }}>
            <Select options={HTTP_METHODS} placeholder="GET" />
          </Form.Item>
          <Form.Item name="api_path" label="API 路径" style={{ flex: 2 }}>
            <Input placeholder="/api/admin/users" style={{ fontFamily: "monospace" }} />
          </Form.Item>
        </Flex>
      )}

      <Form.Item name="icon" label="图标">
        <Input placeholder="可选，图标名称" />
      </Form.Item>

      <Flex gap={16}>
        <Form.Item name="sort" label="排序" initialValue={0} style={{ flex: 1 }}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="status" label="状态" initialValue={1} style={{ flex: 1 }}>
          <Select
            options={[
              { label: "启用", value: 1 },
              { label: "禁用", value: 0 },
            ]}
          />
        </Form.Item>
      </Flex>
    </BaseFormModal>
  );
}

// ── Tree Node with action buttons ─────────────────────────────────────────────

type NodeActionsProps = {
  node: PermissionNode;
  tokenFontSize: number;
  onEdit: (n: PermissionNode) => void;
  onAddChild: (n: PermissionNode) => void;
  onDelete: (n: PermissionNode) => void;
};

function NodeTitle({ node, tokenFontSize, onEdit, onAddChild, onDelete }: NodeActionsProps) {
  const typeInfo = TYPE_LABEL[node.type] ?? { label: String(node.type), color: "default" };
  return (
    <Flex gap={8} align="center" justify="space-between" style={{ width: "100%" }}>
      <Flex gap={6} align="center" style={{ flex: 1, minWidth: 0 }}>
        <Tag color={typeInfo.color} style={{ margin: 0, flexShrink: 0 }}>
          {typeInfo.label}
        </Tag>
        <span style={{ fontWeight: 500 }}>{node.name}</span>
        <span style={{ opacity: 0.45, fontSize: 12, fontFamily: "monospace" }}>{node.code}</span>
        {node.api_path && (
          <Tag color="default" style={{ margin: 0, fontFamily: "monospace", fontSize: 11 }}>
            {node.api_method} {node.api_path}
          </Tag>
        )}
      </Flex>
      <Dropdown
        menu={{
          items: [
            {
              key: "add-child",
              icon: <Plus size={tokenFontSize} />,
              label: "添加子节点",
              onClick: (info) => {
                info.domEvent.stopPropagation();
                onAddChild(node);
              },
            },
            {
              key: "edit",
              icon: <Pencil size={tokenFontSize} />,
              label: "编辑",
              onClick: (info) => {
                info.domEvent.stopPropagation();
                onEdit(node);
              },
            },
            { type: "divider" },
            {
              key: "delete",
              icon: <Trash2 size={tokenFontSize} />,
              label: "删除",
              danger: true,
              onClick: (info) => {
                info.domEvent.stopPropagation();
                onDelete(node);
              },
            },
          ],
        }}
        placement="bottomRight"
        trigger={["click"]}
      >
        <Button
          type="text"
          size="small"
          icon={<MoreVertical size={tokenFontSize} />}
          aria-label="节点操作"
          onClick={(e) => e.stopPropagation()}
          style={{ flexShrink: 0 }}
        />
      </Dropdown>
    </Flex>
  );
}

function buildTreeData(
  nodes: PermissionNode[],
  tokenFontSize: number,
  onEdit: (n: PermissionNode) => void,
  onAddChild: (n: PermissionNode) => void,
  onDelete: (n: PermissionNode) => void,
): DataNode[] {
  return nodes.map((n) => ({
    key: String(n.id),
    title: (
      <NodeTitle
        node={n}
        tokenFontSize={tokenFontSize}
        onEdit={onEdit}
        onAddChild={onAddChild}
        onDelete={onDelete}
      />
    ),
    children: n.children
      ? buildTreeData(n.children, tokenFontSize, onEdit, onAddChild, onDelete)
      : undefined,
  }));
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function PermissionsPage() {
  const { token } = theme.useToken();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const toolbarRef = useRef<HTMLDivElement>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editNode, setEditNode] = useState<PermissionNode | null>(null);
  const [parentNode, setParentNode] = useState<PermissionNode | null>(null);

  const { data, isLoading } = useQuery<PermissionNode[]>({
    queryKey: ["permissions"],
    queryFn: () => getPermissionTree(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePermission(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["permissions"] });
      void message.success("权限节点已删除");
    },
    onError: (err) => void message.error(err instanceof Error ? err.message : "删除失败"),
  });

  const handleOpenCreate = () => {
    setEditNode(null);
    setParentNode(null);
    setFormOpen(true);
  };

  const handleEdit = (node: PermissionNode) => {
    setEditNode(node);
    setParentNode(null);
    setFormOpen(true);
  };

  const handleAddChild = (node: PermissionNode) => {
    setEditNode(null);
    setParentNode(node);
    setFormOpen(true);
  };

  const handleDelete = (node: PermissionNode) => {
    modal.confirm({
      title: `确认删除权限节点「${node.name}」？`,
      content: "若该节点有子节点，需先删除子节点，否则将级联删除。",
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: () => deleteMutation.mutate(node.id),
    });
  };

  const treeData = isLoading
    ? []
    : buildTreeData(data ?? [], token.fontSize, handleEdit, handleAddChild, handleDelete);

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["permissions"] });

  return (
    <Flex vertical gap={token.marginMD} style={{ flex: "1 1 0%", minHeight: 0, overflow: "auto" }}>
      <Flex ref={toolbarRef} justify="space-between" align="center">
        <span style={{ fontWeight: 600, fontSize: token.fontSizeLG }}>权限树</span>
        <Button type="primary" icon={<Plus size={14} />} onClick={handleOpenCreate}>
          新建权限
        </Button>
      </Flex>

      {isLoading ? (
        <Flex justify="center" style={{ paddingTop: token.paddingXL }}>
          <Spin size="large" />
        </Flex>
      ) : (
        <Tree
          treeData={treeData}
          defaultExpandAll
          showLine={{ showLeafIcon: false }}
          style={{ background: "transparent" }}
          blockNode
        />
      )}

      <PermissionFormModal
        open={formOpen}
        editNode={editNode}
        parentNode={parentNode}
        onCancel={() => {
          setFormOpen(false);
          setEditNode(null);
          setParentNode(null);
        }}
        onSuccess={() => {
          setFormOpen(false);
          setEditNode(null);
          setParentNode(null);
          invalidate();
        }}
      />
    </Flex>
  );
}
