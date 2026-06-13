import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, App, Dropdown, theme, Image, Flex } from "antd";
import type { TablePaginationConfig } from "antd/es/table/interface";
import { useMemo, useRef } from "react";
import { MoreVertical, Trash2 } from "lucide-react";
import { z } from "zod/v4";
import { DataTable } from "@/components/DataTable";
import { useTableFitHeight } from "@/hooks/useTableFitHeight";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMediaList, deleteMedia } from "@/api/cms";
import type { MediaItem } from "@/api/cms";

const MediaSearchParamsSchema = z.object({
  page: z.number().int().positive().catch(1),
  page_size: z.number().int().positive().catch(20),
  mime_type: z.string().catch(""),
});

export const Route = createFileRoute("/_auth/cms/media/")({
  validateSearch: (search) => MediaSearchParamsSchema.parse(search),
  component: CmsMediaPage,
});

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function CmsMediaPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { message, modal } = App.useApp();
  const { token } = theme.useToken();
  const queryClient = useQueryClient();

  const pageShellRef = useRef<HTMLDivElement>(null);
  const toolbarRowRef = useRef<HTMLDivElement>(null);
  const middleSectionRef = useRef<HTMLDivElement>(null);
  const tableFrameRef = useRef<HTMLDivElement>(null);

  const queryKey = ["cms-media", search.page, search.page_size, search.mime_type];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      getMediaList({
        page: search.page,
        page_size: search.page_size,
        mime_type: search.mime_type || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMedia(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cms-media"] });
      void message.success("媒体文件已删除");
    },
    onError: (err) => void message.error(err instanceof Error ? err.message : "删除失败"),
  });

  const confirmDelete = (record: MediaItem) => {
    modal.confirm({
      title: `确认删除文件「${record.original_name ?? record.filename}」？`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: () => deleteMutation.mutate(record.id),
    });
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    {
      title: "预览",
      key: "preview",
      width: 80,
      render: (_: unknown, record: MediaItem) =>
        record.mime_type?.startsWith("image/") ? (
          <Image
            src={record.url}
            width={48}
            height={48}
            style={{ objectFit: "cover", borderRadius: 4 }}
          />
        ) : (
          <span style={{ opacity: 0.4, fontSize: 12 }}>{record.mime_type}</span>
        ),
    },
    {
      title: "文件名",
      dataIndex: "original_name",
      key: "original_name",
      render: (v: string | null, record: MediaItem) => v ?? record.filename,
    },
    {
      title: "类型",
      dataIndex: "mime_type",
      key: "mime_type",
      width: 140,
      render: (v: string | null) => (
        <span style={{ fontFamily: "monospace", fontSize: 12 }}>{v ?? "—"}</span>
      ),
    },
    {
      title: "大小",
      dataIndex: "size",
      key: "size",
      width: 100,
      render: (v: number | null) => formatBytes(v),
    },
    {
      title: "上传时间",
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
      render: (_: unknown, record: MediaItem) => (
        <Dropdown
          menu={{
            items: [
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

  return (
    <Flex
      ref={pageShellRef}
      vertical
      gap={token.marginMD}
      style={{ flex: "1 1 0%", minHeight: 0, overflow: "hidden" }}
    >
      <Flex ref={toolbarRowRef} justify="flex-end">
        <Button type="primary">上传媒体</Button>
      </Flex>

      <DataTable<MediaItem>
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
