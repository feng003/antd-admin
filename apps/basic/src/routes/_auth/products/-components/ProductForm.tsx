import { useEffect, useMemo } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  App,
  InputNumber,
  TreeSelect,
  Radio,
  Table,
  Flex,
  Divider,
  Typography,
  Select,
} from "antd";
import { Plus, MinusCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createProduct, updateProduct } from "@/api/product";
import { getCategoryTree } from "@/api/category";
import type {
  SPUDetailResponse,
  CreateProductReq,
  UpdateProductReq,
  SpecKeyInput,
  SKUInput,
  SPUStatus,
} from "@/api/product";
import { getBrands } from "@/api/brand";
import { getSpecTemplates } from "@/api/spec-template";

interface ProductFormProps {
  initialData?: SPUDetailResponse;
}

// 笛卡尔积计算
const cartesian = (...a: any[][]): any[][] =>
  a.reduce((a, b) => a.flatMap((d) => b.map((e) => [d, e].flat())));

export function ProductForm({ initialData }: ProductFormProps) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const isEdit = !!initialData;

  // 监听规格变化，用于生成 SKU 矩阵
  const specKeys: SpecKeyInput[] = Form.useWatch("spec_keys", form) || [];

  // 获取分类树
  const { data: categories } = useQuery({
    queryKey: ["categoryTree"],
    queryFn: () => getCategoryTree(),
  });

  // 获取品牌列表
  const { data: brands } = useQuery({
    queryKey: ["brands"],
    queryFn: () => getBrands(),
  });

  // 获取全局规格模板
  const { data: specTemplates } = useQuery({
    queryKey: ["specTemplates"],
    queryFn: () => getSpecTemplates(),
  });

  // 转换分类树为 TreeSelect 格式
  const treeData = useMemo(() => {
    if (!categories) return [];
    const mapNode = (node: any): any => ({
      title: node.name,
      value: node.id,
      children: node.children ? node.children.map(mapNode) : undefined,
    });
    return categories.map(mapNode);
  }, [categories]);

  // 根据规格生成 SKU
  const generatedSkus = useMemo(() => {
    const validKeys = specKeys.filter((k) => k && k.name && k.values && k.values.length > 0);
    if (validKeys.length === 0) return [];

    const valueArrays = validKeys.map((k) =>
      k.values.filter((v) => v && v.name).map((v) => ({ keyName: k.name, valueName: v.name })),
    );

    if (valueArrays.some((arr) => arr.length === 0)) return [];

    const combos = cartesian(...valueArrays);

    // 恢复之前的输入值
    const existingSkus: SKUInput[] = form.getFieldValue("skus") || [];
    const existingMap = new Map();
    existingSkus.forEach((s) => {
      const key = s.specs.map((sp) => `${sp.key_name}:${sp.value_name}`).join("|");
      existingMap.set(key, s);
    });

    return combos.map((combo: any[]) => {
      // 确保 combo 始终是数组（当只有一个规格时，cartesian 可能会返回一维数组，但在 reduce 中已使用 flat 包装）
      const specs = Array.isArray(combo) ? combo : [combo];
      const mapKey = specs.map((sp) => `${sp.keyName}:${sp.valueName}`).join("|");

      const existing = existingMap.get(mapKey);
      if (existing) return existing;

      return {
        specs: specs.map((sp) => ({ key_name: sp.keyName, value_name: sp.valueName })),
        sale_price: 0,
        stock: 0,
        sku_code: "",
        weight: 0,
        volume: 0,
      };
    });
  }, [specKeys, form]);

  // 当 generatedSkus 变化时，更新表单的 skus 字段
  useEffect(() => {
    // 仅在新增时，或者规格确实改变时覆盖
    form.setFieldValue("skus", generatedSkus);
  }, [generatedSkus, form]);

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      message.success("创建成功");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      window.history.back();
    },
    onError: (err: any) => message.error(err.message || "创建失败"),
  });

  const updateMutation = useMutation({
    mutationFn: (req: UpdateProductReq) => updateProduct(initialData!.id, req),
    onSuccess: () => {
      message.success("更新成功");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      window.history.back();
    },
    onError: (err: any) => message.error(err.message || "更新失败"),
  });

  const onFinish = (values: any) => {
    // 处理分类 ID 可能是数组的情况（如果 TreeSelect 选择了多个层级，取最后一个）
    let catId = values.category_id;
    if (Array.isArray(catId)) {
      catId = catId[catId.length - 1];
    }

    if (!isEdit) {
      if (!values.skus || values.skus.length === 0) {
        message.warning("请至少生成一个 SKU");
        return;
      }

      // 构建创建请求
      const req: CreateProductReq = {
        name: values.name,
        category_id: catId,
        brand_id: values.brand_id,
        main_image: values.main_image,
        detail_html: values.detail_html,
        status: values.status,
        spec_keys: values.spec_keys,
        skus: values.skus.map((s: any) => ({
          ...s,
          sale_price: Math.round(s.sale_price * 100), // 元转分
          origin_price: s.origin_price ? Math.round(s.origin_price * 100) : undefined,
          cost_price: s.cost_price ? Math.round(s.cost_price * 100) : undefined,
        })),
      };
      createMutation.mutate(req);
    } else {
      // 构建更新请求
      const req: UpdateProductReq = {
        name: values.name,
        category_id: catId,
        brand_id: values.brand_id,
        main_image: values.main_image,
        detail_html: values.detail_html,
        status: values.status,
      };
      updateMutation.mutate(req);

      // 注意：编辑模式下的 SKU 更新，应该是单独的 API，因为涉及到库存等复杂逻辑。
      // 这个简单的表单在此仅更新 SPU 基础信息。
      if (values.skus && values.skus.length > 0) {
        message.info("注意：当前表单仅更新 SPU 基础信息。SKU 修改需要在详情页单独操作。");
      }
    }
  };

  const initialValues = useMemo(() => {
    if (!initialData) {
      return {
        status: 0 as SPUStatus,
        spec_keys: [{ name: "默认规格", values: [{ name: "默认" }] }],
      };
    }

    // 回填数据
    return {
      name: initialData.name,
      // category_id: initialData.category_id, // backend doesn't return this in detail
      brand_id: initialData.brand_id,
      main_image: initialData.main_image,
      detail_html: initialData.detail_html,
      status: initialData.status,
      spec_keys: initialData.spec_keys,
      skus: initialData.skus.map((s) => ({
        ...s,
        sale_price: s.sale_price / 100,
        origin_price: s.origin_price / 100,
      })),
    };
  }, [initialData]);

  // SKU Table Columns
  const skuColumns = useMemo(() => {
    const validKeys = specKeys?.filter((k) => k && k.name && k.values && k.values.length > 0) || [];

    const cols: any[] = validKeys.map((k, i) => ({
      title: k.name,
      dataIndex: ["specs", i, "value_name"],
      key: `spec_${i}`,
      render: (text: string) => <b>{text}</b>,
    }));

    cols.push(
      {
        title: "销售价(元)",
        dataIndex: "sale_price",
        render: (_: any, __: any, index: number) => (
          <Form.Item
            name={["skus", index, "sale_price"]}
            rules={[{ required: true, message: "必填" }]}
            noStyle
          >
            <InputNumber min={0} precision={2} />
          </Form.Item>
        ),
      },
      {
        title: "划线价(元)",
        dataIndex: "origin_price",
        render: (_: any, __: any, index: number) => (
          <Form.Item name={["skus", index, "origin_price"]} noStyle>
            <InputNumber min={0} precision={2} />
          </Form.Item>
        ),
      },
      {
        title: "库存",
        dataIndex: "stock",
        render: (_: any, __: any, index: number) => (
          <Form.Item
            name={["skus", index, "stock"]}
            rules={[{ required: true, message: "必填" }]}
            noStyle
          >
            <InputNumber min={0} precision={0} disabled={isEdit} />
          </Form.Item>
        ),
      },
      {
        title: "SKU 编码",
        dataIndex: "sku_code",
        render: (_: any, __: any, index: number) => (
          <Form.Item name={["skus", index, "sku_code"]} noStyle>
            <Input placeholder="选填" />
          </Form.Item>
        ),
      },
    );

    return cols;
  }, [specKeys, isEdit]);

  return (
    <Card title={isEdit ? "编辑商品" : "新增商品"} bordered={false}>
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={initialValues}>
        <Typography.Title level={5}>基础信息</Typography.Title>
        <Flex gap="middle">
          <Form.Item
            label="商品名称"
            name="name"
            rules={[{ required: true, message: "请输入商品名称" }]}
            style={{ flex: 1 }}
          >
            <Input placeholder="输入商品名称" />
          </Form.Item>
          <Form.Item label="商品分类" name="category_id" style={{ flex: 1 }}>
            <TreeSelect
              treeData={treeData}
              placeholder="选择分类"
              allowClear
              treeDefaultExpandAll
            />
          </Form.Item>
          <Form.Item label="品牌" name="brand_id" style={{ flex: 1 }}>
            <Select
              placeholder="选择品牌"
              allowClear
              showSearch
              optionFilterProp="label"
              options={brands?.map((b) => ({ label: b.name, value: b.id })) || []}
            />
          </Form.Item>
          <Form.Item label="状态" name="status" style={{ flex: 1 }}>
            <Radio.Group>
              <Radio value={0}>草稿</Radio>
              <Radio value={1}>上架</Radio>
              <Radio value={2}>下架</Radio>
            </Radio.Group>
          </Form.Item>
        </Flex>

        <Form.Item
          label="商品主图 (URL)"
          name="main_image"
          rules={[{ required: true, message: "请输入主图 URL" }]}
        >
          <Input placeholder="输入主图 URL (临时使用 URL 输入)" />
        </Form.Item>

        <Form.Item label="图文详情" name="detail_html">
          <Input.TextArea rows={4} placeholder="支持 HTML" />
        </Form.Item>

        <Divider />

        <Typography.Title level={5}>商品规格</Typography.Title>
        <Typography.Text type="secondary">配置规格后将自动生成下方的 SKU 列表</Typography.Text>
        <br />
        <br />

        <Form.List name="spec_keys">
          {(fields, { add, remove }) => (
            <Flex vertical gap="middle">
              {fields.map((field) => (
                <Card key={field.key} size="small" type="inner">
                  <Flex justify="space-between" align="flex-start" gap="middle">
                    <Form.Item
                      {...field}
                      label="规格名"
                      name={[field.name, "name"]}
                      rules={[{ required: true, message: "规格名必填" }]}
                      style={{ width: 200 }}
                    >
                      <Select
                        placeholder="如：颜色"
                        disabled={isEdit}
                        mode="tags"
                        maxCount={1}
                        options={
                          specTemplates?.map((t) => ({ label: t.name, value: t.name })) || []
                        }
                        onChange={(val: any) => {
                          const v = Array.isArray(val) ? val[0] : val;
                          if (!v) return;
                          // If selected a known template, auto prefill values
                          const tpl = specTemplates?.find((t) => t.name === v);
                          if (tpl && tpl.values.length > 0) {
                            const currentVals = form.getFieldValue([
                              "spec_keys",
                              field.name,
                              "values",
                            ]);
                            if (
                              !currentVals ||
                              currentVals.length === 0 ||
                              currentVals[0]?.name === "默认"
                            ) {
                              const prefilledVals = tpl.values.map((tv) => ({ name: tv.name }));
                              form.setFieldValue(
                                ["spec_keys", field.name, "values"],
                                prefilledVals,
                              );
                            }
                          }
                        }}
                      />
                    </Form.Item>

                    <div style={{ flex: 1 }}>
                      <Form.List name={[field.name, "values"]}>
                        {(valueFields, { add: addValue, remove: removeValue }) => {
                          // 动态获取当前规格键选中的 template，以便在“值”输入框中给予提示
                          const currentKeyName = form.getFieldValue([
                            "spec_keys",
                            field.name,
                            "name",
                          ]);
                          const currentKeyStr = Array.isArray(currentKeyName)
                            ? currentKeyName[0]
                            : currentKeyName;
                          const tpl = specTemplates?.find((t) => t.name === currentKeyStr);

                          return (
                            <Flex wrap gap="small">
                              {valueFields.map((valField) => (
                                <Space.Compact key={valField.key}>
                                  <Form.Item
                                    {...valField}
                                    name={[valField.name, "name"]}
                                    rules={[{ required: true, message: "必填" }]}
                                    noStyle
                                  >
                                    <Select
                                      placeholder="如：红色"
                                      style={{ width: 120 }}
                                      disabled={isEdit}
                                      mode="tags"
                                      maxCount={1}
                                      options={
                                        tpl?.values?.map((tv) => ({
                                          label: tv.name,
                                          value: tv.name,
                                        })) || []
                                      }
                                    />
                                  </Form.Item>
                                  {!isEdit && (
                                    <Button
                                      icon={<MinusCircle size={16} />}
                                      onClick={() => removeValue(valField.name)}
                                    />
                                  )}
                                </Space.Compact>
                              ))}
                              {!isEdit && (
                                <Button
                                  type="dashed"
                                  onClick={() => addValue()}
                                  icon={<Plus size={16} />}
                                >
                                  添加值
                                </Button>
                              )}
                            </Flex>
                          );
                        }}
                      </Form.List>
                    </div>

                    {!isEdit && (
                      <Button
                        danger
                        icon={<MinusCircle size={16} />}
                        onClick={() => remove(field.name)}
                      >
                        删除规格
                      </Button>
                    )}
                  </Flex>
                </Card>
              ))}
              {!isEdit && (
                <Button type="dashed" onClick={() => add()} block icon={<Plus size={16} />}>
                  添加规格组
                </Button>
              )}
            </Flex>
          )}
        </Form.List>

        <Divider />

        <Typography.Title level={5}>SKU 明细</Typography.Title>
        <Form.Item name="skus">
          {/* 这里我们用一个自定义的 Table 来渲染 Form.Item 的内部状态 */}
          {/* 但是为了让 Form.Item name="skus" 能够工作，我们需要绑定 value 和 onChange */}
          {/* 由于我们是直接操作 form.setFieldValue，所以其实可以用 useWatch 监听 skus 渲染 Table */}
        </Form.Item>

        {/* 直接使用 form.getFieldValue("skus") 不会触发渲染，所以用 useWatch */}
        <Table
          dataSource={form.getFieldValue("skus") || []}
          columns={skuColumns}
          rowKey={(record: any) =>
            record.specs?.map((s: any) => s.value_name).join("|") || Math.random().toString()
          }
          pagination={false}
          size="small"
          bordered
        />
        <br />

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              保存
            </Button>
            <Button onClick={() => window.history.back()}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
