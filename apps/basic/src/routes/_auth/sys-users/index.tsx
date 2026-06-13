import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, App, Dropdown, theme, Badge, Flex, Form, Input, Select, Modal, Tag } from "antd";
import type { TablePaginationConfig } from "antd/es/table/interface";
import { useMemo, useRef, useState } from "react";
import { MoreVertical, Trash2, Pencil, UserCog } from "lucide-react";
import { z } from "zod/v4";
import { DataTable } from "@/components/DataTable";
import { useTableFitHeight } from "@/hooks/useTableFitHeight";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSysUserList,
  createSysUser,
  updateSysUser,
  deleteSysUser,
  assignRolesToUser,
  getUserRoles,
  getRoleList,
} from "@/api/permission";
import type { SysUser, CreateSysUserReq, UpdateSysUserReq } from "@/api/permission";
import { BaseFormModal } from "@/components/FormModal";

const SysUserSearchParamsSchema = z.object({
  page: z.number().int().positive().catch(1),
  page_size: z.number().int().positive().catch(20),
  keyword: z.string().catch(""),
  status: z.number().nullable().catch(null),
});

export const Route = createFileRoute("/_auth/sys-users/")({
  validateSearch: (search) => SysUserSearchParamsSchema.parse(search),
  component: SysUsersPage,
});

// ── Create Modal ─────────────────────────────────────────────────────────────

type CreateModalProps = {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
};

function CreateSysUserModal({ open, onCancel, onSuccess }: CreateModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateSysUserReq>();
  const mutation = useMutation({
    mutationFn: (values: CreateSysUserReq) => createSysUser(values),
    onSuccess: () => {
      void message.success("管理员创建成功");
      form.resetFields();
      onSuccess();
    },
    onError: (err) => void message.error(err instanceof Error ? err.message : "创建失败"),
  });

  return (
    <BaseFormModal
      open={open}
      title="新建管理员"
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
      <Form.Item name="username" label="用户名" rules={[{ required: true, min: 3, max: 64 }]}>
        <Input placeholder="3–64 字符" autoComplete="off" />
      </Form.Item>
      <Form.Item name="password" label="密码" rules={[{ required: true, min: 8, max: 128 }]}>
        <Input.Password placeholder="至少 8 位" autoComplete="new-password" />
      </Form.Item>
      <Form.Item name="real_name" label="真实姓名">
        <Input placeholder="可选" />
      </Form.Item>
      <Form.Item name="email" label="邮箱" rules={[{ type: "email", message: "邮箱格式不正确" }]}>
        <Input placeholder="可选" />
      </Form.Item>
      <Form.Item name="phone" label="手机号">
        <Input placeholder="可选" />
      </Form.Item>
      <Form.Item name="status" label="状态" initialValue={1}>
        <Select
          options={[
            { label: "启用", value: 1 },
            { label: "禁用", value: 0 },
          ]}
        />
      </Form.Item>
    </BaseFormModal>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

type EditModalProps = {
  open: boolean;
  record: SysUser | null;
  onCancel: () => void;
  onSuccess: () => void;
};

function EditSysUserModal({ open, record, onCancel, onSuccess }: EditModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<UpdateSysUserReq>();
  const mutation = useMutation({
    mutationFn: (values: UpdateSysUserReq) => updateSysUser(record!.id, values),
    onSuccess: () => {
      void message.success("更新成功");
      onSuccess();
    },
    onError: (err) => void message.error(err instanceof Error ? err.message : "更新失败"),
  });

  // Populate form when record changes
  if (open && record && form.getFieldValue("real_name") === undefined) {
    form.setFieldsValue({
      real_name: record.real_name ?? "",
      email: record.email ?? "",
      phone: record.phone ?? "",
      status: record.status,
    });
  }

  return (
    <BaseFormModal
      open={open}
      title={`编辑管理员 — ${record?.username ?? ""}`}
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
      <Form.Item name="real_name" label="真实姓名">
        <Input />
      </Form.Item>
      <Form.Item name="email" label="邮箱" rules={[{ type: "email", message: "邮箱格式不正确" }]}>
        <Input />
      </Form.Item>
      <Form.Item name="phone" label="手机号">
        <Input />
      </Form.Item>
      <Form.Item name="status" label="状态">
        <Select
          options={[
            { label: "启用", value: 1 },
            { label: "禁用", value: 0 },
          ]}
        />
      </Form.Item>
    </BaseFormModal>
  );
}

// ── Assign Roles Modal ────────────────────────────────────────────────────────

type AssignRolesModalProps = {
  open: boolean;
  user: SysUser | null;
  onCancel: () => void;
  onSuccess: () => void;
};

function AssignRolesModal({ open, user, onCancel, onSuccess }: AssignRolesModalProps) {
  const { message } = App.useApp();
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);

  const { data: rolesData } = useQuery({
    queryKey: ["roles-all"],
    queryFn: () => getRoleList({ page: 1, page_size: 200 }),
    enabled: open,
  });

  // 加载该账号已绑定的角色，开弹窗时预选
  const { data: currentRolesData } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: () => getUserRoles(user!.id),
    enabled: open && user != null,
  });

  // 当当前角色加载完成时，初始化已选项（只初始化一次）
  const initializedRef = useRef(false);
  if (open && currentRolesData && !initializedRef.current) {
    const ids = (currentRolesData.list ?? []).map((r) => r.id);
    if (ids.length > 0 || selectedKeys.length === 0) {
      setSelectedKeys(ids);
      initializedRef.current = true;
    }
  }
  // 关闭时重置初始化标记
  if (!open) {
    initializedRef.current = false;
  }

  const allRoles = rolesData?.list ?? [];

  const mutation = useMutation({
    mutationFn: () => assignRolesToUser(user!.id, selectedKeys),
    onSuccess: () => {
      void message.success("角色分配成功");
      setSelectedKeys([]);
      onSuccess();
    },
    onError: (err) => void message.error(err instanceof Error ? err.message : "分配失败"),
  });

  const handleCancel = () => {
    setSelectedKeys([]);
    onCancel();
  };

  return (
    <Modal
      open={open}
      title={`分配角色 — ${user?.username ?? ""}`}
      okText="确认分配"
      cancelText="取消"
      confirmLoading={mutation.isPending}
      onCancel={handleCancel}
      onOk={() => mutation.mutate()}
      width={480}
    >
      <p style={{ marginBottom: 12, opacity: 0.6, fontSize: 13 }}>
        点击标签切换选中状态，蓝色为已选角色：
      </p>
      <Flex wrap gap={8} style={{ minHeight: 60 }}>
        {allRoles.length === 0 && (
          <span style={{ opacity: 0.5, fontSize: 13 }}>暂无角色，请先创建角色</span>
        )}
        {allRoles.map((r) => (
          <Tag
            key={r.id}
            color={selectedKeys.includes(r.id) ? "blue" : "default"}
            style={{ cursor: "pointer", userSelect: "none", padding: "2px 10px" }}
            onClick={() =>
              setSelectedKeys((prev) =>
                prev.includes(r.id) ? prev.filter((k) => k !== r.id) : [...prev, r.id],
              )
            }
          >
            {r.name}
          </Tag>
        ))}
      </Flex>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function SysUsersPage() {
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
  const [editRecord, setEditRecord] = useState<SysUser | null>(null);
  const [assignUser, setAssignUser] = useState<SysUser | null>(null);

  const queryKey = ["sys-users", search.page, search.page_size, search.keyword, search.status];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      getSysUserList({
        page: search.page,
        page_size: search.page_size,
        keyword: search.keyword || undefined,
        status: search.status ?? undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSysUser(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sys-users"] });
      void message.success("管理员账号已删除");
    },
    onError: (err) => void message.error(err instanceof Error ? err.message : "删除失败"),
  });

  const confirmDelete = (record: SysUser) => {
    modal.confirm({
      title: `确认删除管理员「${record.username}」？`,
      content: "该账号将被软删除，无法再登录后台。",
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: () => deleteMutation.mutate(record.id),
    });
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "用户名", dataIndex: "username", key: "username", width: 140 },
    {
      title: "姓名",
      dataIndex: "real_name",
      key: "real_name",
      render: (v: string | null) => v || "—",
    },
    {
      title: "邮箱",
      dataIndex: "email",
      key: "email",
      render: (v: string | null) => v || "—",
    },
    {
      title: "手机",
      dataIndex: "phone",
      key: "phone",
      render: (v: string | null) => v || "—",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 80,
      render: (v: number) => (
        <Badge status={v === 1 ? "success" : "error"} text={v === 1 ? "启用" : "禁用"} />
      ),
    },
    {
      title: "最后登录",
      dataIndex: "last_login_at",
      key: "last_login_at",
      width: 170,
      render: (v: string | null) => (v ? new Date(v).toLocaleString("zh-CN") : "从未登录"),
    },
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
      render: (_: unknown, record: SysUser) => (
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
                icon: <UserCog size={token.fontSize} />,
                label: "分配角色",
                onClick: () => setAssignUser(record),
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

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["sys-users"] });

  return (
    <Flex
      ref={pageShellRef}
      vertical
      gap={token.marginMD}
      style={{ flex: "1 1 0%", minHeight: 0, overflow: "hidden" }}
    >
      <Flex ref={toolbarRowRef} justify="flex-end">
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          新建管理员
        </Button>
      </Flex>

      <DataTable<SysUser>
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

      <CreateSysUserModal
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          invalidate();
        }}
      />

      {editRecord && (
        <EditSysUserModal
          open
          record={editRecord}
          onCancel={() => setEditRecord(null)}
          onSuccess={() => {
            setEditRecord(null);
            invalidate();
          }}
        />
      )}

      {assignUser && (
        <AssignRolesModal
          open
          user={assignUser}
          onCancel={() => setAssignUser(null)}
          onSuccess={() => {
            setAssignUser(null);
            invalidate();
          }}
        />
      )}
    </Flex>
  );
}
