"use client";

import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { Button, Flex, Popconfirm, Typography } from "@/components/antd-ui";
import type { Card as StudyCard } from "@/lib/api";

const { Text } = Typography;

export function buildSetDetailCardColumns(options: {
  onEditCard: (card: StudyCard) => void;
  onDeleteCard: (cardId: string) => void;
}): ColumnsType<StudyCard> {
  const { onEditCard, onDeleteCard } = options;

  return [
    {
      title: "Front",
      dataIndex: "front",
      width: "30%",
      render: (v: string) => <Text strong>{v}</Text>,
    },
    { title: "Back", dataIndex: "back", width: "30%" },
    {
      title: "Example",
      dataIndex: "example",
      width: "30%",
      render: (v: string | null) => (v ? v : <Text type="secondary">—</Text>),
    },
    {
      title: "",
      key: "actions",
      width: 120,
      render: (_: unknown, record: StudyCard) => (
        <Flex gap={0} justify="flex-end" wrap="nowrap">
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            aria-label="Chỉnh sửa thẻ"
            onClick={() => onEditCard(record)}
          />
          <Popconfirm
            title="Xóa thẻ này?"
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => onDeleteCard(record.id)}
            placement="left"
          >
            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Flex>
      ),
    },
  ];
}
