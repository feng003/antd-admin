import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, App, Dropdown, theme, Tag, Flex } from "antd";
import type { TablePaginationConfig } from "antd/es/table/interface";
import { useMemo, useRef } from "react";
import { MoreVertical, Trash2 } from "lucide-react";
import { z } from "zod/v4";
import { DataTable } from "@/components/DataTable";
import { useTableFitHeight } from "@/hooks/useTableFitHeight";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getArticleList, deleteArticle, updateArticleStatus } from "@/api/cms";
import type { ArticleListItem, ArticleStatus } from "@/api/cms";

const ArticleSearchParamsSchema = z.object({
  page: z.number().int().positive().catch(1),
  page_size: z.number().int().positive().catch(20),
  status: z.string().catch(""),
  keyword: z.string().catch(""),
});

export const Route = createFileRoute("/_auth/cms/articles/")({
  validateSearch: (search) => ArticleSearchParamsSchema.parse(search),
  component: CmsArticlesPage,
});

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "default" },
  pending: { label: "审批中", color: "processing" },
  published: { label: "已发布", color: "success" },
  archived: { label: "已归档", color: "warning" },
};

function CmsArticlesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { message, modal } = App.useApp();
  const { token } = theme.useToken();
  const queryClient = useQueryClient();

  const pageShellRef = useRef<HTMLDivElement>(null);
  const toolbarRowRef = useRef<HTMLDivElement>(null);
  const middleSectionRef = useRef<HTMLDivElement>(null);
  const tableFrameRef = useRef<HTMLDivElement>(null);

  const queryKey = ["cms-articles", search.page, search.page_size, search.status, search.keyword];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      getArticleList({
        page: search.page,
        page_size: search.page_size,
        status: (search.status as ArticleStatus) || undefined,
        keyword: search.keyword || undefined,
      }),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ArticleStatus }) =>
      updateArticleStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cms-articles"] });
      void message.success("状态更新成功");
    },
    onError: (err) => void message.error(err instanceof Error ? err.message : "操作失败"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteArticle(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cms-articles"] });
      void message.success("文章已删除");
    },
    onError: (err) => void message.error(err instanceof Error ? err.message : "删除失败"),
  });

  const confirmDelete = (record: ArticleListItem) => {
    modal.confirm({
      title: `确认删除文章「${record.title}」？`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: () => deleteMutation.mutate(record.id),
    });
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "标题", dataIndex: "title", key: "title" },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (v: string) => {
        const s = STATUS_MAP[v] ?? { label: v, color: "default" };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: "作者",
      dataIndex: "author_name",
      key: "author_name",
      width: 120,
      render: (v: string | null) => v ?? "—",
    },
    {
      title: "发布时间",
      dataIndex: "published_at",
      key: "published_at",
      width: 170,
      render: (v: string | null) => (v ? new Date(v).toLocaleString("zh-CN") : "—"),
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
      render: (_: unknown, record: ArticleListItem) => (
        <Dropdown
          menu={{
            items: [
              record.status !== "published"
                ? {
                    key: "publish",
                    label: "发布",
                    onClick: () => publishMutation.mutate({ id: record.id, status: "published" }),
                  }
                : {
                    key: "archive",
                    label: "归档",
                    onClick: () => publishMutation.mutate({ id: record.id, status: "archived" }),
                  },
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

  const statusFilters = ["", "draft", "pending", "published", "archived"] as const;

  return (
    <Flex
      ref={pageShellRef}
      vertical
      gap={token.marginMD}
      style={{ flex: "1 1 0%", minHeight: 0, overflow: "hidden" }}
    >
      <Flex ref={toolbarRowRef} justify="space-between" align="center">
        <Flex gap={8}>
          {statusFilters.map((s) => (
            <Button
              key={s}
              type={search.status === s ? "primary" : "default"}
              size="small"
              onClick={() => void navigate({ search: { ...search, status: s, page: 1 } })}
            >
              {s === "" ? "全部" : (STATUS_MAP[s]?.label ?? s)}
            </Button>
          ))}
        </Flex>
        <Button type="primary">新建文章</Button>
      </Flex>

      <DataTable<ArticleListItem>
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
    </Flex>
  );
}
