import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, App, Dropdown, theme, Tag, Flex, Modal, Form, Input, Select, Space } from "antd";
import type { TablePaginationConfig } from "antd/es/table/interface";
import { useEffect, useRef, useState } from "react";
import { MoreVertical, Trash2, CheckCircle, XCircle, Plus, PenLine } from "lucide-react";
import { z } from "zod/v4";
import { DataTable } from "@/components/DataTable";
import { useTableFitHeight } from "@/hooks/useTableFitHeight";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCompetitionList,
  createCompetition,
  updateCompetition,
  approveCompetition,
  rejectCompetition,
  deleteCompetition,
  getCompetition,
} from "@/api/competition";
import type {
  CompetitionItem,
  CreateCompetitionReq,
  UpdateCompetitionReq,
} from "@/api/competition";

// ──────────────────────────────────────────────────────────────
// Route
// ──────────────────────────────────────────────────────────────

const SearchParamsSchema = z.object({
  keyword: z.string().catch(""),
  course_type: z.string().catch(""),
  status: z.string().catch(""),
  last_id: z.number().int().catch(0),
  limit: z.number().int().catch(20),
});

export const Route = createFileRoute("/_auth/competitions/")({
  validateSearch: (search) => SearchParamsSchema.parse(search),
  component: CompetitionsPage,
});

// ──────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: "待审核", color: "warning" },
  1: { label: "已发布", color: "success" },
  2: { label: "已驳回", color: "error" },
};

const COURSE_TYPE_OPTIONS = [
  { label: "越野 (Trail)", value: "trail" },
  { label: "公路 (Road)", value: "road" },
  { label: "竞速 (Race)", value: "race" },
  { label: "其他 (Other)", value: "other" },
];

const COURSE_TYPE_LABELS: Record<string, string> = {
  trail: "越野",
  road: "公路",
  race: "竞速",
  other: "其他",
};

/** 将 ISO 8601 时间字符串转为 datetime-local input 的值格式 */
function isoToDatetimeLocal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  // datetime-local 格式: YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 将 datetime-local input 值转为 ISO 8601 */
function datetimeLocalToISO(val: string): string {
  if (!val) return "";
  return new Date(val).toISOString();
}

// ──────────────────────────────────────────────────────────────
// Create / Edit Form Modal
// ──────────────────────────────────────────────────────────────

interface CompetitionFormModalProps {
  open: boolean;
  editId?: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

function CompetitionFormModal({ open, editId, onClose, onSuccess }: CompetitionFormModalProps) {
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const { data: detail, isLoading: loadingDetail } = useQuery({
    queryKey: ["competition-detail", editId],
    queryFn: () => (editId ? getCompetition(editId) : null),
    enabled: open && !!editId,
  });

  // 填入编辑数据
  useEffect(() => {
    if (open && detail && editId) {
      form.setFieldsValue({
        name: detail.name,
        course_type: detail.course_type,
        location: detail.location,
        start_at: isoToDatetimeLocal(detail.start_at),
        end_at: isoToDatetimeLocal(detail.end_at),
        ext_link: detail.ext_link,
      });
    } else if (open && !editId) {
      form.resetFields();
    }
  }, [open, detail, editId, form]);

  const createMutation = useMutation({
    mutationFn: (req: CreateCompetitionReq) => createCompetition(req),
    onSuccess: () => {
      void message.success("赛事创建成功");
      onSuccess();
    },
    onError: (err) => void message.error(err instanceof Error ? err.message : "创建失败"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: number; req: UpdateCompetitionReq }) =>
      updateCompetition(id, req),
    onSuccess: () => {
      void message.success("赛事更新成功");
      onSuccess();
    },
    onError: (err) => void message.error(err instanceof Error ? err.message : "更新失败"),
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        const payload = {
          name: String(values.name),
          course_type: String(values.course_type) as "trail" | "road" | "race" | "other",
          location: String(values.location ?? ""),
          start_at: datetimeLocalToISO(String(values.start_at ?? "")),
          end_at: datetimeLocalToISO(String(values.end_at ?? "")),
          ext_link: String(values.ext_link ?? ""),
        };
        if (editId) {
          updateMutation.mutate({ id: editId, req: payload });
        } else {
          createMutation.mutate(payload);
        }
      })
      .catch(() => {
        // validation error – antd already shows inline errors
      });
  };

  return (
    <Modal
      title={editId ? "编辑赛事" : "新建赛事"}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={isLoading}
      width={580}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }} disabled={loadingDetail}>
        <Form.Item
          name="name"
          label="赛事名称"
          rules={[
            { required: true, message: "请填写赛事名称" },
            { max: 200, message: "最多200字符" },
          ]}
        >
          <Input placeholder="请输入赛事名称" />
        </Form.Item>
        <Form.Item
          name="course_type"
          label="赛事类型"
          rules={[{ required: true, message: "请选择赛事类型" }]}
        >
          <Select options={COURSE_TYPE_OPTIONS} placeholder="选择类型" />
        </Form.Item>
        <Form.Item name="location" label="举办地点" rules={[{ max: 300, message: "最多300字符" }]}>
          <Input placeholder="请输入举办地点" />
        </Form.Item>
        <Form.Item
          name="start_at"
          label="开始时间"
          rules={[{ required: true, message: "请选择开始时间" }]}
        >
          <Input type="datetime-local" />
        </Form.Item>
        <Form.Item
          name="end_at"
          label="结束时间"
          rules={[{ required: true, message: "请选择结束时间" }]}
        >
          <Input type="datetime-local" />
        </Form.Item>
        <Form.Item name="ext_link" label="外部链接">
          <Input placeholder="赛事报名/详情链接（选填）" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────────
// Reject Modal
// ──────────────────────────────────────────────────────────────

interface RejectModalProps {
  open: boolean;
  targetId: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

function RejectModal({ open, targetId, onClose, onSuccess }: RejectModalProps) {
  const [remark, setRemark] = useState("");
  const { message } = App.useApp();

  const rejectMutation = useMutation({
    mutationFn: ({ id, remark: r }: { id: number; remark: string }) =>
      rejectCompetition(id, { remark: r }),
    onSuccess: () => {
      void message.success("已驳回");
      setRemark("");
      onSuccess();
    },
    onError: (err) => void message.error(err instanceof Error ? err.message : "操作失败"),
  });

  return (
    <Modal
      title="驳回赛事"
      open={open}
      onOk={() => {
        if (!targetId) return;
        rejectMutation.mutate({ id: targetId, remark });
      }}
      onCancel={() => {
        setRemark("");
        onClose();
      }}
      confirmLoading={rejectMutation.isPending}
      okButtonProps={{ danger: true }}
      okText="确认驳回"
      cancelText="取消"
      destroyOnHidden
    >
      <Form layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label="驳回理由（可选）">
          <Input.TextArea
            rows={3}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="请填写驳回理由..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────

function CompetitionsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { message, modal } = App.useApp();
  const { token } = theme.useToken();
  const queryClient = useQueryClient();

  const pageShellRef = useRef<HTMLDivElement>(null);
  const toolbarRowRef = useRef<HTMLDivElement>(null);
  const middleSectionRef = useRef<HTMLDivElement>(null);
  const tableFrameRef = useRef<HTMLDivElement>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);

  const queryKey = [
    "competitions",
    search.keyword,
    search.course_type,
    search.status,
    search.last_id,
    search.limit,
  ];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      getCompetitionList({
        keyword: search.keyword || undefined,
        course_type: search.course_type || undefined,
        status: search.status !== "" ? Number(search.status) : undefined,
        last_id: search.last_id || undefined,
        limit: search.limit,
      }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => approveCompetition(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["competitions"] });
      void message.success("审核通过");
    },
    onError: (err) => void message.error(err instanceof Error ? err.message : "操作失败"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCompetition(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["competitions"] });
      void message.success("删除成功");
    },
    onError: (err) => void message.error(err instanceof Error ? err.message : "删除失败"),
  });

  const confirmDelete = (record: CompetitionItem) => {
    modal.confirm({
      title: `确认删除赛事「${record.name}」？`,
      content: "软删除后，赛事将对用户不可见，此操作可撤销。",
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: () => deleteMutation.mutate(record.id),
    });
  };

  const openCreate = () => {
    setEditId(null);
    setFormOpen(true);
  };

  const openEdit = (record: CompetitionItem) => {
    setEditId(record.id);
    setFormOpen(true);
  };

  const openReject = (record: CompetitionItem) => {
    setRejectTargetId(record.id);
    setRejectModalOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditId(null);
    void queryClient.invalidateQueries({ queryKey: ["competitions"] });
  };

  const handleRejectSuccess = () => {
    setRejectModalOpen(false);
    setRejectTargetId(null);
    void queryClient.invalidateQueries({ queryKey: ["competitions"] });
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 70 },
    {
      title: "赛事名称",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
    },
    {
      title: "类型",
      dataIndex: "course_type",
      key: "course_type",
      width: 90,
      render: (v: string) => COURSE_TYPE_LABELS[v] ?? v,
    },
    {
      title: "地点",
      dataIndex: "location",
      key: "location",
      ellipsis: true,
      width: 160,
      render: (v: string) => v || "—",
    },
    {
      title: "开始时间",
      dataIndex: "start_at",
      key: "start_at",
      width: 160,
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
    {
      title: "结束时间",
      dataIndex: "end_at",
      key: "end_at",
      width: 160,
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 90,
      render: (v: number) => {
        const s = STATUS_MAP[v] ?? { label: String(v), color: "default" };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: "标签",
      dataIndex: "tags",
      key: "tags",
      width: 180,
      render: (tags: CompetitionItem["tags"]) =>
        tags?.length ? (
          <Flex wrap gap={4}>
            {tags.map((t) => (
              <Tag key={t.id}>{t.name}</Tag>
            ))}
          </Flex>
        ) : (
          "—"
        ),
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      key: "actions",
      width: 60,
      align: "right" as const,
      render: (_: unknown, record: CompetitionItem) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "edit",
                icon: <PenLine size={token.fontSize} />,
                label: "编辑",
                onClick: () => openEdit(record),
              },
              ...(record.status === 0
                ? [
                    {
                      key: "approve",
                      icon: <CheckCircle size={token.fontSize} />,
                      label: "审核通过",
                      onClick: () => approveMutation.mutate(record.id),
                    },
                    {
                      key: "reject",
                      icon: <XCircle size={token.fontSize} />,
                      label: "驳回",
                      danger: true,
                      onClick: () => openReject(record),
                    },
                  ]
                : []),
              { type: "divider" as const },
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

  const competitions = data?.competitions ?? [];
  const hasMore = data?.has_more ?? false;

  const paginationInfo = hasMore
    ? `已加载 ${competitions.length} 条，还有更多`
    : `共 ${competitions.length} 条`;

  const showPagination = false;

  const { tableAreaMaxHeight, tableScrollY, lockScrollHeight } = useTableFitHeight({
    pageShellRef,
    toolbarRef: toolbarRowRef,
    middleRef: middleSectionRef,
    tableFrameRef,
    marginLG: token.marginLG,
    rowCount: competitions.length,
    isLoading,
    showPagination,
  });

  const tablePagination: false | TablePaginationConfig = false;

  const statusFilters = [
    { value: "", label: "全部" },
    { value: "0", label: "待审核" },
    { value: "1", label: "已发布" },
    { value: "2", label: "已驳回" },
  ];

  return (
    <Flex
      ref={pageShellRef}
      vertical
      gap={token.marginMD}
      style={{ flex: "1 1 0%", minHeight: 0, overflow: "hidden" }}
    >
      {/* Toolbar */}
      <Flex ref={toolbarRowRef} justify="space-between" align="center">
        <Space>
          {statusFilters.map((f) => (
            <Button
              key={f.value}
              type={search.status === f.value ? "primary" : "default"}
              size="small"
              onClick={() =>
                void navigate({
                  search: { ...search, status: f.value, last_id: 0 },
                })
              }
            >
              {f.label}
            </Button>
          ))}
        </Space>
        <Button
          type="primary"
          icon={<Plus size={14} />}
          onClick={openCreate}
          id="competition-create-btn"
        >
          新建赛事
        </Button>
      </Flex>

      {/* Table */}
      <DataTable<CompetitionItem>
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
        dataSource={competitions}
        loading={isLoading}
        pagination={tablePagination}
        scroll={tableScrollY != null ? { x: "max-content", y: tableScrollY } : { x: "max-content" }}
        footer={() => (
          <Flex justify="flex-end" align="center" gap={8}>
            <span
              style={{
                color: token.colorTextSecondary,
                fontSize: token.fontSizeSM,
              }}
            >
              {paginationInfo}
            </span>
            {hasMore && (
              <Button
                size="small"
                onClick={() => {
                  const lastItem = competitions.at(-1);
                  if (lastItem) {
                    void navigate({
                      search: { ...search, last_id: lastItem.id },
                    });
                  }
                }}
              >
                加载更多
              </Button>
            )}
          </Flex>
        )}
      />

      {/* Create / Edit Modal */}
      <CompetitionFormModal
        open={formOpen}
        editId={editId}
        onClose={() => {
          setFormOpen(false);
          setEditId(null);
        }}
        onSuccess={handleFormSuccess}
      />

      {/* Reject Modal */}
      <RejectModal
        open={rejectModalOpen}
        targetId={rejectTargetId}
        onClose={() => {
          setRejectModalOpen(false);
          setRejectTargetId(null);
        }}
        onSuccess={handleRejectSuccess}
      />
    </Flex>
  );
}
