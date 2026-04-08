"use client";

import type { FormInstance } from "antd/es/form";
import { Form, Input, Modal, Select } from "@/components/antd-ui";

export interface EditSetFormValues {
  title: string;
  description?: string;
  language: string;
  visibility: "public" | "private";
}

export interface EditSetModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: () => void | Promise<void>;
  form: FormInstance<EditSetFormValues>;
  confirmLoading: boolean;
}

export function EditSetModal({
  open,
  onCancel,
  onOk,
  form,
  confirmLoading,
}: EditSetModalProps) {
  return (
    <Modal
      title="Chỉnh sửa bộ từ"
      open={open}
      onCancel={onCancel}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={confirmLoading}
      onOk={onOk}
      destroyOnHidden
      width={480}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Form.Item
          label="Tiêu đề"
          name="title"
          rules={[{ required: true, message: "Nhập tiêu đề" }]}
        >
          <Input placeholder="Tên bộ từ" />
        </Form.Item>
        <Form.Item label="Mô tả" name="description">
          <Input.TextArea rows={3} placeholder="Mô tả ngắn (tuỳ chọn)" />
        </Form.Item>
        <Form.Item
          label="Ngôn ngữ"
          name="language"
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { value: "Japanese", label: "Japanese" },
              { value: "Chinese", label: "Chinese" },
            ]}
          />
        </Form.Item>
        <Form.Item
          label="Hiển thị"
          name="visibility"
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { value: "private", label: "Riêng tư" },
              { value: "public", label: "Công khai" },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
