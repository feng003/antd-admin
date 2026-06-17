import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, App, Dropdown, theme, Tag, Flex, Image, Modal, Form, Input, Space } from "antd";
import { useRef, useState } from "react";
import { MoreVertical, Trash2, ImageIcon } from "lucide-react";
import { z } from "zod/v4";
import { DataTable } from "@/components/DataTable";
import { useTableFitHeight } from "@/hooks/useTableFitHeight";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMomentList, forceDeleteMoment } from "@/api/moment";
import type { MomentItem, MomentMedia } from "@/api/moment";

// ──────────────────────────────────────────────────────────────
// Route
// ──────────────────────────────────────────────────────────────

const SearchParamsSchema = z.object({
  competition_id: z.string().catch(""),
  user_id: z.string().catch(""),
  last_id: z.number().int().catch(0),
  limit: z.number().int().catch(20),
});

export const Route = createFileRoute("/_auth/moments/")({
  validateSearch: (search) => SearchParamsSchema.parse(search),
  component: MomentsPage,
});

// ──────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────

const VISIBILITY_MAP: Record<number, { label: string; color: string }> = {
  0: { label: "公开", color: "blue" },
  1: { label: "好友可见", color: "cyan" },
  2: { label: "指定人", color: "purple" },
  3: { label: "仅自己", color: "default" },
};

// ──────────────────────────────────────────────────────────────
// Force Delete Modal
// ──────────────────────────────────────────────────────────────

interface ForceDeleteModalProps {
  open: boolean;
  targetId: number | null;
  targetContent?: string;
  onClose: () => void;
  onSuccess: () => void;
}

function ForceDeleteModal({
  open,
  targetId,
  targetContent,
  onClose,
  onSuccess,
}: ForceDeleteModalProps) {
  const [reason, setReason] = useState("");
  const { message } = App.useApp();

  const deleteMutation = useMutation({
    mutationFn: ({ id, r }: { id: number; r: string }) => forceDeleteMoment(id, r),
    onSuccess: () => {
      void message.success("动态已强制下线");
      setReason("");
      onSuccess();
    },
    onError: (err) => void message.error(err instanceof Error ? err.message : "操作失败"),
  });

  return (
    <Modal
      title="强制下线动态"
      open={open}
      onOk={() => {
        if (!targetId) return;
        deleteMutation.mutate({ id: targetId, r: reason });
      }}
      onCancel={() => {
        setReason("");
        onClose();
      }}
      confirmLoading={deleteMutation.isPending}
      okButtonProps={{ danger: true }}
      okText="确认下线"
      cancelText="取消"
      destroyOnHidden
    >
      {targetContent && (
        <p
          style={{
            background: "#f5f5f5",
            borderRadius: 6,
            padding: "8px 12px",
            marginBottom: 12,
            fontSize: 13,
            color: "#555",
            maxHeight: 80,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {targetContent}
        </p>
      )}
      <Form layout="vertical">
        <Form.Item label="下线理由（将记录至审计日志）">
          <Input.TextArea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="请填写下线理由..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────

function MomentsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { token } = theme.useToken();
  const queryClient = useQueryClient();

  const pageShellRef = useRef<HTMLDivElement>(null);
  const toolbarRowRef = useRef<HTMLDivElement>(null);
  const middleSectionRef = useRef<HTMLDivElement>(null);
  const tableFrameRef = useRef<HTMLDivElement>(null);

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    id: number | null;
    content?: string;
  }>({ open: false, id: null });

  const queryKey = ["moments", search.competition_id, search.user_id, search.last_id, search.limit];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      getMomentList({
        competition_id: search.competition_id ? Number(search.competition_id) : undefined,
        user_id: search.user_id ? Number(search.user_id) : undefined,
        last_id: search.last_id || undefined,
        limit: search.limit,
      }),
  });

  const moments = data?.moments ?? [];
  const hasMore = data?.has_more ?? false;

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 70 },
    {
      title: "用户 ID",
      dataIndex: "user_id",
      key: "user_id",
      width: 90,
    },
    {
      title: "赛事 ID",
      dataIndex: "competition_id",
      key: "competition_id",
      width: 90,
      render: (v: number) => v || "—",
    },
    {
      title: "内容",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
      render: (v: string) =>
        v || <span style={{ color: token.colorTextDisabled }}>（无文字）</span>,
    },
    {
      title: "图片",
      dataIndex: "medias",
      key: "medias",
      width: 120,
      render: (medias: MomentMedia[] | null) => {
        if (!medias?.length) return <span style={{ color: token.colorTextDisabled }}>—</span>;
        return (
          <Flex gap={4} wrap>
            <Image.PreviewGroup>
              {medias.slice(0, 3).map((m) => (
                <Image
                  key={m.id}
                  src={m.url}
                  width={32}
                  height={32}
                  style={{ objectFit: "cover", borderRadius: 4 }}
                  fallback=""
                  preview={{ src: m.url }}
                />
              ))}
              {medias.length > 3 && (
                <Flex
                  align="center"
                  justify="center"
                  style={{
                    width: 32,
                    height: 32,
                    background: token.colorFillSecondary,
                    borderRadius: 4,
                    fontSize: 11,
                    color: token.colorTextSecondary,
                  }}
                >
                  <ImageIcon size={14} />
                  <span>+{medias.length - 3}</span>
                </Flex>
              )}
            </Image.PreviewGroup>
          </Flex>
        );
      },
    },
    {
      title: "可见性",
      dataIndex: "visibility",
      key: "visibility",
      width: 90,
      render: (v: number) => {
        const vis = VISIBILITY_MAP[v] ?? { label: String(v), color: "default" };
        return <Tag color={vis.color}>{vis.label}</Tag>;
      },
    },
    {
      title: "点赞",
      dataIndex: "like_count",
      key: "like_count",
      width: 70,
      align: "right" as const,
    },
    {
      title: "评论",
      dataIndex: "comment_count",
      key: "comment_count",
      width: 70,
      align: "right" as const,
    },
    {
      title: "发布时间",
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
      render: (_: unknown, record: MomentItem) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "delete",
                icon: <Trash2 size={token.fontSize} />,
                label: "强制下线",
                danger: true,
                onClick: () =>
                  setDeleteModal({
                    open: true,
                    id: record.id,
                    content: record.content,
                  }),
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

  const showPagination = false;

  const { tableAreaMaxHeight, tableScrollY, lockScrollHeight } = useTableFitHeight({
    pageShellRef,
    toolbarRef: toolbarRowRef,
    middleRef: middleSectionRef,
    tableFrameRef,
    marginLG: token.marginLG,
    rowCount: moments.length,
    isLoading,
    showPagination,
  });

  const paginationInfo = hasMore
    ? `已加载 ${moments.length} 条，还有更多`
    : `共 ${moments.length} 条`;

  return (
    <Flex
      ref={pageShellRef}
      vertical
      gap={token.marginMD}
      style={{ flex: "1 1 0%", minHeight: 0, overflow: "hidden" }}
    >
      {/* Toolbar: filter by competition / user */}
      <Flex ref={toolbarRowRef} align="center" gap={8}>
        <Input
          allowClear
          placeholder="赛事 ID 过滤"
          value={search.competition_id}
          onChange={(e) =>
            void navigate({
              search: {
                ...search,
                competition_id: e.target.value,
                last_id: 0,
              },
            })
          }
          style={{ width: 160 }}
          id="moments-competition-filter"
        />
        <Input
          allowClear
          placeholder="用户 ID 过滤"
          value={search.user_id}
          onChange={(e) =>
            void navigate({
              search: { ...search, user_id: e.target.value, last_id: 0 },
            })
          }
          style={{ width: 160 }}
          id="moments-user-filter"
        />
        <Space style={{ marginLeft: "auto" }}>
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
                const lastItem = moments.at(-1);
                if (lastItem) {
                  void navigate({ search: { ...search, last_id: lastItem.id } });
                }
              }}
            >
              加载更多
            </Button>
          )}
        </Space>
      </Flex>

      {/* Table */}
      <DataTable<MomentItem>
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
        dataSource={moments}
        loading={isLoading}
        pagination={false}
        scroll={tableScrollY != null ? { x: "max-content", y: tableScrollY } : { x: "max-content" }}
      />

      {/* Force Delete Modal */}
      <ForceDeleteModal
        open={deleteModal.open}
        targetId={deleteModal.id}
        targetContent={deleteModal.content}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onSuccess={() => {
          setDeleteModal({ open: false, id: null });
          void queryClient.invalidateQueries({ queryKey: ["moments"] });
        }}
      />
    </Flex>
  );
}
