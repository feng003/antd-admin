import { Form, Input, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import { useLingui } from "@lingui/react/macro";
import type { CreateUserRequest, User } from "@/api/schemas";
import { BaseFormModal } from "@/components/FormModal";

export type FormModalProps = {
  open: boolean;
  editingUser: User | null;
  form: FormInstance<CreateUserRequest>;
  confirmLoading: boolean;
  onCancel: () => void;
  onFinish: (values: CreateUserRequest) => void;
};

export function FormModal({
  open,
  editingUser,
  form,
  confirmLoading,
  onCancel,
  onFinish,
}: FormModalProps) {
  const { t } = useLingui();

  return (
    <BaseFormModal<CreateUserRequest>
      open={open}
      title={editingUser ? t`Edit User` : t`New User`}
      okText={t`OK`}
      cancelText={t`Cancel`}
      form={form}
      confirmLoading={confirmLoading}
      onCancel={onCancel}
      onFinish={onFinish}
    >
      <Form.Item
        name="username"
        label={t`Username`}
        rules={[{ required: true, message: t`Please enter username` }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="roles"
        label={t`Roles`}
        rules={[{ required: true, message: t`Please select roles` }]}
      >
        <Select
          mode="multiple"
          options={[
            { label: t`Admin`, value: "admin" },
            { label: t`Editor`, value: "editor" },
          ]}
        />
      </Form.Item>
      <Form.Item name="email" label={t`Email`}>
        <Input />
      </Form.Item>
    </BaseFormModal>
  );
}
