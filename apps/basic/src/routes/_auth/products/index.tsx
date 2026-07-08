import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Button, Space, App, Dropdown, theme, Badge, Flex } from "antd";
import type { TablePaginationConfig } from "antd/es/table/interface";
import { useMemo, useRef } from "react";
import { MoreVertical, Eye, ArrowUp, ArrowDown, Trash2, Plus, Pencil } from "lucide-react";
import { z } from "zod/v4";
import { DataTable } from "@/components/DataTable";
import { useTableFitHeight } from "@/hooks/useTableFitHeight";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProductList, updateProductStatus, deleteProduct } from "@/api/product";
import type { ProductListItem, SPUStatus } from "@/api/product";

const ProductSearchParamsSchema = z.object({
  page: z.number().int().positive().catch(1),
  page_size: z.number().int().positive().catch(20),
  status: z.number().nullable().catch(null),
  category_id: z.number().nullable().catch(null),
});

export const Route = createFileRoute("/_auth/products/")({
  validateSearch: (search) => ProductSearchParamsSchema.parse(search),
  component: ProductsPage,
});

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: "草稿", color: "default" },
  1: { label: "上架", color: "success" },
  2: { label: "下架", color: "warning" },
  3: { label: "封禁", color: "error" },
};

function ProductsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { message, modal } = App.useApp();
  const { token } = theme.useToken();
  const queryClient = useQueryClient();

  const pageShellRef = useRef<HTMLDivElement>(null);
  const toolbarRowRef = useRef<HTMLDivElement>(null);
  const middleSectionRef = useRef<HTMLDivElement>(null);
  const tableFrameRef = useRef<HTMLDivElement>(null);

  const queryKey = ["products", search.page, search.page_size, search.status, search.category_id];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      getProductList({
        page: search.page,
        page_size: search.page_size,
        status: search.status != null ? (search.status as SPUStatus) : undefined,
        category_id: search.category_id ?? undefined,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: SPUStatus }) =>
      updateProductStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void message.success("状态更新成功");
    },
    onError: (err) => void message.error(err instanceof Error ? err.message : "操作失败"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void message.success("商品已删除");
    },
    onError: (err) => void message.error(err instanceof Error ? err.message : "删除失败"),
  });

  const confirmDelete = (record: ProductListItem) => {
    modal.confirm({
      title: "确认删除商品？",
      content: `商品「${record.name}」将被软删除，操作不可逆。`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: () => deleteMutation.mutate(record.id),
    });
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "商品编号",
      dataIndex: "spu_no",
      key: "spu_no",
      width: 150,
    },
    {
      title: "商品名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 90,
      render: (status: number) => {
        const s = STATUS_MAP[status] ?? {
          label: String(status),
          color: "default",
        };
        return (
          <Badge status={s.color as "success" | "warning" | "error" | "default"} text={s.label} />
        );
      },
    },
    {
      title: "最低价(分)",
      dataIndex: "min_price",
      key: "min_price",
      width: 120,
      render: (v: number | null) => (v != null ? v.toLocaleString() : "—"),
    },
    {
      title: "总销量",
      dataIndex: "sold_count",
      key: "sold_count",
      width: 90,
      render: (v: number) => v.toLocaleString(),
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
      render: (_: unknown, record: ProductListItem) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "view",
                icon: <Eye size={token.fontSize} />,
                label: (
                  <Link to="/products/$id/edit" params={{ id: record.id.toString() }}>
                    查看详情
                  </Link>
                ),
              },
              {
                key: "edit",
                icon: <Pencil size={token.fontSize} />,
                label: (
                  <Link to="/products/$id/edit" params={{ id: record.id.toString() }}>
                    编辑
                  </Link>
                ),
              },
              {
                key: "on",
                icon: <ArrowUp size={token.fontSize} />,
                label: "上架",
                disabled: record.status === 1,
                onClick: () => statusMutation.mutate({ id: record.id, status: 1 }),
              },
              {
                key: "off",
                icon: <ArrowDown size={token.fontSize} />,
                label: "下架",
                disabled: record.status === 2,
                onClick: () => statusMutation.mutate({ id: record.id, status: 2 }),
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
                search: {
                  ...search,
                  page,
                  page_size: pageSize ?? search.page_size,
                },
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
      {/* 工具栏 */}
      <Flex ref={toolbarRowRef} justify="space-between" align="center">
        <Space>
          {([null, 1, 2, 0, 3] as (null | SPUStatus)[]).map((s) => (
            <Button
              key={String(s)}
              type={search.status === s ? "primary" : "default"}
              size="small"
              onClick={() => void navigate({ search: { ...search, status: s, page: 1 } })}
            >
              {s === null ? "全部" : (STATUS_MAP[s]?.label ?? String(s))}
            </Button>
          ))}
        </Space>
        <Space>
          <Link to="/products/create">
            <Button type="primary" icon={<Plus size={16} />}>
              新增商品
            </Button>
          </Link>
        </Space>
      </Flex>

      <DataTable<ProductListItem>
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
