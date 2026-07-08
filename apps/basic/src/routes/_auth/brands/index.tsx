import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, App, Dropdown, theme, Flex, Modal, Form, Input, InputNumber } from "antd";
import type { TablePaginationConfig } from "antd/es/table/interface";
import { useMemo, useRef, useState } from "react";
import { MoreVertical, Edit, Trash, Plus } from "lucide-react";
import { z } from "zod/v4";
import { DataTable } from "@/components/DataTable";
import { useTableFitHeight } from "@/hooks/useTableFitHeight";
import { useResourceCRUD } from "@/hooks/useResourceCRUD";
import { useCrudToasts } from "@/hooks/useCrudToasts";
import { getBrands, createBrand, updateBrand, deleteBrand } from "@/api/brand";
import type { Brand, CreateBrandReq } from "@/api/brand";

const BrandSearchParamsSchema = z.object({
  page: z.number().int().positive().catch(1),
  page_size: z.number().int().positive().catch(20),
});

export const Route = createFileRoute("/_auth/brands/")({
  validateSearch: (search) => BrandSearchParamsSchema.parse(search),
  component: BrandsPage,
});

type BrandListData = { list: Brand[]; total: number };

function BrandsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { message } = App.useApp();
  const { token } = theme.useToken();

  const pageShellRef = useRef<HTMLDivElement>(null);
  const toolbarRowRef = useRef<HTMLDivElement>(null);
  const middleSectionRef = useRef<HTMLDivElement>(null);
  const tableFrameRef = useRef<HTMLDivElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [form] = Form.useForm<CreateBrandReq>();

  const toastLifecycles = useCrudToasts<CreateBrandReq, CreateBrandReq>({
    message,
    resourceKey: "brands",
  });

  const crud = useResourceCRUD<BrandListData, CreateBrandReq, CreateBrandReq & { id: string }>({
    queryKey: ["brands"],
    queryFn: () => getBrands(),
    select: (raw) => {
      const arr = (raw as Brand[]) ?? [];
      return { list: arr, total: arr.length };
    },
    createFn: (values) => createBrand(values),
    updateFn: (values) => {
      const { id, ...req } = values;
      return updateBrand(Number(id), req);
    },
    deleteFn: (id) => deleteBrand(Number(id)),
    createLifecycle: toastLifecycles.createLifecycle,
    updateLifecycle: toastLifecycles.updateLifecycle,
    deleteLifecycle: toastLifecycles.deleteLifecycle,
  });

  const { data, isLoading } = crud;
  const createMutation = crud.createMutation!;
  const updateMutation = crud.updateMutation!;
  const deleteMutation = crud.deleteMutation!;

  const handleOpenModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      form.setFieldsValue({
        name: brand.name,
        logo: brand.logo,
        description: brand.description,
        sort_order: brand.sort_order,
      });
    } else {
      setEditingBrand(null);
      form.resetFields();
      form.setFieldsValue({ sort_order: 0 });
    }
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingBrand) {
        updateMutation.mutate({ ...values, id: editingBrand.id.toString() });
      } else {
        createMutation.mutate(values);
      }
    } catch {
      // form validation failed — AntD displays field errors
    }
  };

  const confirmDelete = (record: Brand) => {
    Modal.confirm({
      title: "确认删除？",
      content: `品牌「${record.name}」将被删除。`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: () => deleteMutation.mutate(record.id.toString()),
    });
  };

  const columns = useMemo(
    () => [
      { title: "ID", dataIndex: "id", key: "id", width: 80 },
      { title: "品牌名称", dataIndex: "name", key: "name" },
      {
        title: "Logo",
        dataIndex: "logo",
        key: "logo",
        width: 80,
        render: (logo: string) =>
          logo ? <img src={logo} alt="logo" style={{ height: 30 }} /> : "—",
      },
      { title: "描述", dataIndex: "description", key: "description" },
      {
        title: "排序权重",
        dataIndex: "sort_order",
        key: "sort_order",
        width: 100,
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
        width: 80,
        align: "right" as const,
        render: (_: unknown, record: Brand) => (
          <Dropdown
            menu={{
              items: [
                {
                  key: "edit",
                  icon: <Edit size={token.fontSize} />,
                  label: "编辑",
                  onClick: () => handleOpenModal(record),
                },
                { type: "divider" as const },
                {
                  key: "delete",
                  icon: <Trash size={token.fontSize} />,
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
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token.fontSize],
  );

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
      <Flex ref={toolbarRowRef} justify="flex-end">
        <Button type="primary" icon={<Plus size={16} />} onClick={() => handleOpenModal()}>
          新增品牌
        </Button>
      </Flex>

      <DataTable<Brand>
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

      <Modal
        title={editingBrand ? "编辑品牌" : "新增品牌"}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="品牌名称"
            rules={[{ required: true, message: "请输入品牌名称" }]}
          >
            <Input placeholder="例如：Apple" />
          </Form.Item>
          <Form.Item name="logo" label="Logo URL">
            <Input placeholder="输入图片地址" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="sort_order" label="排序权重">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </Flex>
  );
}
