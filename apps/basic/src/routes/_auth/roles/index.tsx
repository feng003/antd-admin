import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Button,
  App,
  Dropdown,
  theme,
  Badge,
  Flex,
  Form,
  Input,
  InputNumber,
  Select,
  Modal,
  Tree,
  Spin,
  Tag,
} from "antd";
import type { TablePaginationConfig } from "antd/es/table/interface";
import type { DataNode } from "antd/es/tree";
import { useMemo, useRef, useState } from "react";
import { MoreVertical, Trash2, Pencil, ShieldCheck } from "lucide-react";
import { z } from "zod/v4";
import { DataTable } from "@/components/DataTable";
import { useTableFitHeight } from "@/hooks/useTableFitHeight";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRoleList,
  createRole,
  updateRole,
  deleteRole,
  assignPermissionsToRole,
  getRolePermissions,
  getPermissionTree,
} from "@/api/permission";
import type { Role, CreateRoleReq, PermissionNode } from "@/api/permission";
import { BaseFormModal } from "@/components/FormModal";

const RoleSearchParamsSchema = z.object({
  page: z.number().int().positive().catch(1),
  page_size: z.number().int().positive().catch(20),
  keyword: z.string().catch(""),
});

export const Route = createFileRoute("/_auth/roles/")({
  validateSearch: (search) => RoleSearchParamsSchema.parse(search),
  component: RolesPage,
});

// ── Create Modal ──────────────────────────────────────────────────────────────

type CreateModalProps = {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
};

function CreateRoleModal({ open, onCancel, onSuccess }: CreateModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateRoleReq>();
  const mutation = useMutation({
    mutationFn: (values: CreateRoleReq) => createRole(values),
    onSuccess: () => {
      void message.success("角色创建成功");
      form.resetFields();
      onSuccess();
    },
    onError: (err) => void message.error(err instanceof Error ? err.message : "创建失败"),
  });

  return (
    <BaseFormModal
      open={open}
      title="新建角色"
      okText="创建"
      cancelText="取消"
      form={form}
      confirmLoading={mutation.isPending}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onFinish={(values) => mutation.mutate(values)}
    >
      <Form.Item name="code" label="角色 Code" rules={[{ required: true, message: "请输入 Code" }]}>
        <Input placeholder="例：super_admin" style={{ fontFamily: "monospace" }} />
      </Form.Item>
      <Form.Item name="name" label="角色名称" rules={[{ required: true, message: "请输入名称" }]}>
        <Input placeholder="例：超级管理员" />
      </Form.Item>
      <Form.Item name="description" label="描述">
        <Input.TextArea rows={2} placeholder="可选" />
      </Form.Item>
      <Flex gap={16}>
        <Form.Item name="status" label="状态" initialValue={1} style={{ flex: 1 }}>
          <Select
            options={[
              { label: "启用", value: 1 },
              { label: "禁用", value: 0 },
            ]}
          />
        </Form.Item>
        <Form.Item name="sort" label="排序" initialValue={0} style={{ flex: 1 }}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
      </Flex>
    </BaseFormModal>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

type EditModalProps = {
  open: boolean;
  record: Role | null;
  onCancel: () => void;
  onSuccess: () => void;
};

function EditRoleModal({ open, record, onCancel, onSuccess }: EditModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const mutation = useMutation({
    mutationFn: (values: { name: string; description?: string; status: number; sort: number }) =>
      updateRole(record!.id, values),
    onSuccess: () => {
      void message.success("角色更新成功");
      onSuccess();
    },
    onError: (err) => void message.error(err instanceof Error ? err.message : "更新失败"),
  });

  if (open && record && form.getFieldValue("name") === undefined) {
    form.setFieldsValue({
      name: record.name,
      description: record.description ?? "",
      status: record.status,
      sort: record.sort,
    });
  }

  return (
    <BaseFormModal
      open={open}
      title={`编辑角色 — ${record?.name ?? ""}`}
      okText="保存"
      cancelText="取消"
      form={form}
      confirmLoading={mutation.isPending}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onFinish={(values) => mutation.mutate(values)}
    >
      <Form.Item name="name" label="角色名称" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="description" label="描述">
        <Input.TextArea rows={2} />
      </Form.Item>
      <Flex gap={16}>
        <Form.Item name="status" label="状态" style={{ flex: 1 }}>
          <Select
            options={[
              { label: "启用", value: 1 },
              { label: "禁用", value: 0 },
            ]}
          />
        </Form.Item>
        <Form.Item name="sort" label="排序" style={{ flex: 1 }}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
      </Flex>
    </BaseFormModal>
  );
}

// ── Assign Permissions Modal ──────────────────────────────────────────────────

function buildTreeData(nodes: PermissionNode[]): DataNode[] {
  return nodes.map((n) => ({
    key: String(n.id),
    title: (
      <Flex gap={6} align="center">
        <Tag
          color={n.type === 1 ? "blue" : n.type === 2 ? "green" : "orange"}
          style={{ margin: 0, fontSize: 11 }}
        >
          {n.type === 1 ? "菜单" : n.type === 2 ? "API" : "按钮"}
        </Tag>
        <span>{n.name}</span>
        {n.api_path && (
          <span style={{ opacity: 0.45, fontFamily: "monospace", fontSize: 11 }}>
            {n.api_method} {n.api_path}
          </span>
        )}
      </Flex>
    ),
    children: n.children ? buildTreeData(n.children) : undefined,
  }));
}

type AssignPermsModalProps = {
  open: boolean;
  role: Role | null;
  onCancel: () => void;
  onSuccess: () => void;
};

function AssignPermissionsModal({ open, role, onCancel, onSuccess }: AssignPermsModalProps) {
  const { message } = App.useApp();
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);

  const { data: permTree, isLoading: treeLoading } = useQuery<PermissionNode[]>({
    queryKey: ["permissions"],
    queryFn: () => getPermissionTree(),
    enabled: open,
  });

  // 加载角色已绑定的权限 ID，开弹窗时预选
  const { data: currentPermsData } = useQuery({
    queryKey: ["role-permissions", role?.id],
    queryFn: () => getRolePermissions(role!.id),
    enabled: open && role != null,
  });

  const initializedRef = useRef(false);
  if (open && currentPermsData && !initializedRef.current) {
    const ids = (currentPermsData.permission_ids ?? []).map(String);
    setCheckedKeys(ids);
    initializedRef.current = true;
  }
  if (!open) {
    initializedRef.current = false;
  }

  const treeData = treeLoading || !permTree ? [] : buildTreeData(permTree);

  const mutation = useMutation({
    mutationFn: () =>
      assignPermissionsToRole(
        role!.id,
        checkedKeys.map((k) => Number(k)),
      ),
    onSuccess: () => {
      void message.success("权限分配成功，Casbin policy 已热重载");
      setCheckedKeys([]);
      onSuccess();
    },
    onError: (err) => void message.error(err instanceof Error ? err.message : "分配失败"),
  });

  const handleCancel = () => {
    setCheckedKeys([]);
    onCancel();
  };

  return (
    <Modal
      open={open}
      title={`分配权限 — ${role?.name ?? ""}`}
      okText="确认分配"
      cancelText="取消"
      confirmLoading={mutation.isPending}
      onCancel={handleCancel}
      onOk={() => mutation.mutate()}
      width={580}
      styles={{ body: { maxHeight: 460, overflowY: "auto" } }}
    >
      {treeLoading ? (
        <Flex justify="center" style={{ padding: 32 }}>
          <Spin />
        </Flex>
      ) : (
        <Tree
          checkable
          checkedKeys={checkedKeys}
          onCheck={(checked) =>
            setCheckedKeys(
              Array.isArray(checked) ? checked.map(String) : checked.checked.map(String),
            )
          }
          treeData={treeData}
          defaultExpandAll
          showLine={{ showLeafIcon: false }}
          style={{ background: "transparent" }}
        />
      )}
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function RolesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { message, modal } = App.useApp();
  const { token } = theme.useToken();
  const queryClient = useQueryClient();

  const pageShellRef = useRef<HTMLDivElement>(null);
  const toolbarRowRef = useRef<HTMLDivElement>(null);
  const middleSectionRef = useRef<HTMLDivElement>(null);
  const tableFrameRef = useRef<HTMLDivElement>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Role | null>(null);
  const [assignRole, setAssignRole] = useState<Role | null>(null);

  const queryKey = ["roles", search.page, search.page_size, search.keyword];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      getRoleList({
        page: search.page,
        page_size: search.page_size,
        keyword: search.keyword || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteRole(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roles"] });
      void message.success("角色已删除");
    },
    onError: (err) => void message.error(err instanceof Error ? err.message : "删除失败"),
  });

  const confirmDelete = (record: Role) => {
    modal.confirm({
      title: `确认删除角色「${record.name}」？`,
      content: "删除后已绑定该角色的管理员将失去对应权限。",
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: () => deleteMutation.mutate(record.id),
    });
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    {
      title: "角色 Code",
      dataIndex: "code",
      key: "code",
      width: 150,
      render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{v}</span>,
    },
    { title: "角色名称", dataIndex: "name", key: "name" },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      render: (v: string | null) => v ?? "—",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 80,
      render: (v: number) => (
        <Badge status={v === 1 ? "success" : "default"} text={v === 1 ? "启用" : "禁用"} />
      ),
    },
    { title: "排序", dataIndex: "sort", key: "sort", width: 80 },
    {
      title: "创建时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 170,
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      key: "actions",
      width: 60,
      align: "right" as const,
      render: (_: unknown, record: Role) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "edit",
                icon: <Pencil size={token.fontSize} />,
                label: "编辑",
                onClick: () => setEditRecord(record),
              },
              {
                key: "assign",
                icon: <ShieldCheck size={token.fontSize} />,
                label: "分配权限",
                onClick: () => setAssignRole(record),
              },
              { type: "divider" },
              {
                key: "delete",
                icon: <Trash2 size={token.fontSize} />,
                label: "删除",
                danger: true,
                onClick: () => confirmDelete(record),
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

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["roles"] });

  return (
    <Flex
      ref={pageShellRef}
      vertical
      gap={token.marginMD}
      style={{ flex: "1 1 0%", minHeight: 0, overflow: "hidden" }}
    >
      <Flex ref={toolbarRowRef} justify="flex-end">
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          新建角色
        </Button>
      </Flex>

      <DataTable<Role>
        layoutRef={middleSectionRef}
        frameRef={tableFrameRef}
        lockScrollHeight={lockScrollHeight}
        maxHeight={tableAreaMaxHeight}
        frameHeight={
          tableScrollY != null && tableAreaMaxHeight != null ? tableAreaMaxHeight : undefined
        }
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={data?.list ?? []}
        loading={isLoading}
        pagination={tablePagination}
        scroll={tableScrollY != null ? { x: "max-content", y: tableScrollY } : { x: "max-content" }}
      />

      <CreateRoleModal
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          invalidate();
        }}
      />

      {editRecord && (
        <EditRoleModal
          open
          record={editRecord}
          onCancel={() => setEditRecord(null)}
          onSuccess={() => {
            setEditRecord(null);
            invalidate();
          }}
        />
      )}

      {assignRole && (
        <AssignPermissionsModal
          open
          role={assignRole}
          onCancel={() => setAssignRole(null)}
          onSuccess={() => {
            setAssignRole(null);
          }}
        />
      )}
    </Flex>
  );
}
