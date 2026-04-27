import { Form, Input, Modal, Select } from "antd";
import { useLingui } from "@lingui/react/macro";
import type { Order, CreateOrderRequest } from "@/api/schemas";

export type FormModalProps = {
  open: boolean;
  editing: Order | null;
  form: ReturnType<typeof Form.useForm<CreateOrderRequest>>[0];
  confirmLoading: boolean;
  onCancel: () => void;
  onFinish: (values: CreateOrderRequest) => void;
};

export function FormModal({ open, editing, form, confirmLoading, onCancel, onFinish }: FormModalProps) {
  const { t } = useLingui();
  return (
    <Modal
      open={open}
      title={editing ? t`Edit Order` : t`New Order`}
      onCancel={onCancel}
      onOk={() => {
        form.submit();
      }}
      confirmLoading={confirmLoading}
      destroyOnHidden
    >
      <Form layout="vertical" form={form} onFinish={onFinish} requiredMark={false}>
        <Form.Item name="title" label={t`Title`} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="status" label={t`Status`} rules={[{ required: true }]}>
          <Select
            options={[
              { value: "draft", label: t`Draft` },
              { value: "open", label: t`Open` },
              { value: "done", label: t`Done` },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
