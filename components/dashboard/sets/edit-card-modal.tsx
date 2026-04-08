"use client";

import type { FormInstance } from "antd/es/form";
import { Form, Input, Modal, Typography } from "@/components/antd-ui";

const { Text } = Typography;

export interface EditCardFormValues {
  front: string;
  back: string;
  example?: string;
}

export interface EditCardModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: () => void | Promise<void>;
  form: FormInstance<EditCardFormValues>;
  confirmLoading: boolean;
}

export function EditCardModal({
  open,
  onCancel,
  onOk,
  form,
  confirmLoading,
}: EditCardModalProps) {
  return (
    <Modal
      title="Chỉnh sửa thẻ"
      open={open}
      onCancel={onCancel}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={confirmLoading}
      onOk={onOk}
      destroyOnHidden
      width={520}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Form.Item
          label="Mặt trước"
          name="front"
          rules={[{ required: true, message: "Nhập mặt trước" }]}
        >
          <Input placeholder="こんにちは" />
        </Form.Item>
        <Form.Item
          label="Mặt sau"
          name="back"
          rules={[{ required: true, message: "Nhập mặt sau" }]}
        >
          <Input placeholder="Hello" />
        </Form.Item>
        <Form.Item
          label={
            <>
              Ví dụ <Text type="secondary">(tuỳ chọn)</Text>
            </>
          }
          name="example"
        >
          <Input placeholder="こんにちは、元気ですか？" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
