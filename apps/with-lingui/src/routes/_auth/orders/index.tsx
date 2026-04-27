import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, Form, App, Dropdown, theme, Tag, Flex } from "antd";
import type { TablePaginationConfig } from "antd/es/table/interface";
import { useLingui } from "@lingui/react/macro";
import { useMemo, useRef, useState } from "react";
import { httpClient } from "@/utils/http";
import { ORDER_ENDPOINTS } from "@/api/orders";
import { PaginatedResponseSchema, OrderSchema, CreateOrderRequestSchema } from "@/api/schemas";
import type { Order, CreateOrderRequest } from "@/api/schemas";
import { z } from "zod/v4";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { useResourceCRUD } from "@/hooks/useResourceCRUD";
import { useTableFitHeight } from "@/hooks/useTableFitHeight";
import { useCrudToasts } from "@/hooks/useCrudToasts";
import { useUrlSearchState } from "@/hooks/useUrlSearchState";
import { Toolbar } from "./-Toolbar";
import { FormModal } from "./-FormModal";

const SearchParamsSchema = z.object({
  limit: z.number().int().positive().catch(100),
  offset: z.number().int().nonnegative().catch(0),
  sortField: z.string().nullable().catch(null),
  sortOrder: z.enum(["ascend", "descend"]).nullable().catch(null),
  keyword: z.string().catch(""),
});

type RowSearch = z.infer<typeof SearchParamsSchema>;

export const Route = createFileRoute("/_auth/orders/")({
  validateSearch: (search) => SearchParamsSchema.parse(search),
  component: OrderListPage,
});

const paginatedSchema = PaginatedResponseSchema(OrderSchema);

function OrderListPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { message, modal } = App.useApp();
  const { t } = useLingui();
  const { token } = theme.useToken();
  const [modalOpen, setModalOpen] = useState(false);
  const pageShellRef = useRef<HTMLDivElement>(null);
  const toolbarRowRef = useRef<HTMLDivElement>(null);
  const middleSectionRef = useRef<HTMLDivElement>(null);
  const tableFrameRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState<Order | null>(null);
  const [form] = Form.useForm<CreateOrderRequest>();
  const currentPage = Math.floor(search.offset / search.limit) + 1;

  const setSearch = (next: RowSearch) => {
    void navigate({ search: next });
  };

  const { keywordInput, setKeywordInput, applyKeyword } = useUrlSearchState({
    search,
    setSearch,
  });

  const crudToasts = useCrudToasts<CreateOrderRequest, CreateOrderRequest & { id: string }>({
    message,
    resourceKey: "orders",
  });

  const { data, isLoading, createMutation, updateMutation, deleteMutation } = useResourceCRUD<
    { list: Order[]; total: number },
    CreateOrderRequest,
    CreateOrderRequest & { id: string }
  >({
    queryKey: ["orders", search.limit, search.offset, search.keyword, search.sortField, search.sortOrder],
    queryFn: () =>
      httpClient.get(ORDER_ENDPOINTS.list, {
        params: {
          limit: search.limit,
          offset: search.offset,
          keyword: search.keyword || undefined,
          sortField: search.sortField ?? undefined,
          sortOrder: search.sortOrder ?? undefined,
        },
      }),
    select: (raw) => paginatedSchema.shape.data.parse(raw),
    createFn: (values) => httpClient.post(ORDER_ENDPOINTS.create, CreateOrderRequestSchema.parse(values)),
    updateFn: ({ id, ...values }) => httpClient.put(ORDER_ENDPOINTS.update(id), values),
    deleteFn: (id) => httpClient.delete(ORDER_ENDPOINTS.delete(id)),
    optimistic: { update: true, delete: true },
    createLifecycle: {
      onSuccess: (values) => {
        crudToasts.createLifecycle?.onSuccess?.(values);
        setModalOpen(false);
        form.resetFields();
      },
      onError: crudToasts.createLifecycle?.onError,
    },
    updateLifecycle: {
      onMutate: crudToasts.updateLifecycle?.onMutate,
      onSuccess: (values) => {
        crudToasts.updateLifecycle?.onSuccess?.(values);
        setModalOpen(false);
        setEditing(null);
        form.resetFields();
      },
      onError: crudToasts.updateLifecycle?.onError,
    },
    deleteLifecycle: {
      onMutate: crudToasts.deleteLifecycle?.onMutate,
      onSuccess: crudToasts.deleteLifecycle?.onSuccess,
      onError: crudToasts.deleteLifecycle?.onError,
    },
  });

  const confirmDelete = (record: Order) => {
    modal.confirm({
      title: t`Are you absolutely sure?`,
      content: t`This action cannot be undone.`,
      okText: t`Delete`,
      okType: "danger",
      cancelText: t`Cancel`,
      onOk: () => deleteMutation.mutate(record.id),
    });
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: t`Title`, dataIndex: "title", key: "title" },
    {
      title: t`Status`,
      dataIndex: "status",
      key: "status",
      render: (s: Order["status"]) => <Tag>{s}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 60,
      align: "right" as const,
      render: (_: unknown, record: Order) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "edit",
                icon: <Pencil size={token.fontSize} />,
                label: t`Edit`,
                onClick: () => {
                  setEditing(record);
                  form.setFieldsValue(record);
                  setModalOpen(true);
                },
              },
              {
                key: "delete",
                icon: <Trash2 size={token.fontSize} />,
                label: t`Delete`,
                danger: true,
                onClick: () => confirmDelete(record),
              },
            ],
          }}
          placement="bottomRight"
        >
          <Button type="text" icon={<MoreVertical size={token.fontSize} />} aria-label={t`Row actions`} />
        </Dropdown>
      ),
    },
  ];

  const showPagination = (data?.total ?? 0) > search.limit;
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
            current: currentPage,
            pageSize: search.limit,
            showSizeChanger: true,
            showTotal: (total) => t`${total} rows`,
            onChange: (page, pageSize) => {
              void navigate({
                search: {
                  ...search,
                  limit: pageSize ?? search.limit,
                  offset: (page - 1) * (pageSize ?? search.limit),
                },
              });
            },
          }
        : false,
    [showPagination, data?.total, currentPage, search, navigate, t],
  );

  return (
    <Flex
      ref={pageShellRef}
      vertical
      gap={token.marginMD}
      style={{ flex: "1 1 0%", minHeight: 0, overflow: "hidden" }}
    >
      <Toolbar
        ref={toolbarRowRef}
        keywordInput={keywordInput}
        onKeywordChange={setKeywordInput}
        onSearch={applyKeyword}
        onClearSearch={() => {
          setKeywordInput("");
          setSearch({ ...search, keyword: "", offset: 0 });
        }}
        onCreateClick={() => {
          setEditing(null);
          form.resetFields();
          setModalOpen(true);
        }}
      />

      <DataTable<Order>
        layoutRef={middleSectionRef}
        frameRef={tableFrameRef}
        lockScrollHeight={lockScrollHeight}
        maxHeight={tableAreaMaxHeight}
        frameHeight={tableScrollY != null && tableAreaMaxHeight != null ? tableAreaMaxHeight : undefined}
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={data?.list ?? []}
        loading={isLoading}
        pagination={tablePagination}
        style={{ flex: 1, minHeight: 0 }}
        scroll={tableScrollY != null ? { x: "max-content", y: tableScrollY } : { x: "max-content" }}
      />

      <FormModal
        open={modalOpen}
        editing={editing}
        form={form}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
          form.resetFields();
        }}
        onFinish={(values) => {
          if (editing) {
            updateMutation.mutate({ ...values, id: editing.id });
          } else {
            createMutation.mutate(values);
          }
        }}
      />
    </Flex>
  );
}
