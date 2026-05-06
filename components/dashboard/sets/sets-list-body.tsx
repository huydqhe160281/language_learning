"use client";

import Link from "next/link";
import {
  BookOutlined,
  DeleteOutlined,
  ScissorOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Empty,
  Flex,
  List,
  Popconfirm,
  Tooltip,
  Typography,
} from "@/components/antd-ui";
import type { StudySet } from "@/lib/api";

const { Title, Text, Paragraph } = Typography;

export interface SetsListBodyProps {
  allSets: StudySet[];
  filteredSets: StudySet[];
  onDeleteSet: (id: string) => void;
  onClearFilters: () => void;
  onSplitRequest: (set: StudySet) => void;
  splitLoadingId: string | null;
}

export function SetsListBody({
  allSets,
  filteredSets,
  onDeleteSet,
  onClearFilters,
  onSplitRequest,
  splitLoadingId,
}: SetsListBodyProps) {
  if (allSets.length === 0) {
    return (
      <Card>
        <Empty description="Chưa có bộ từ nào." style={{ padding: "32px 0" }}>
          <Link href="/dashboard/sets/create">
            <Button type="primary">Create Your First Set</Button>
          </Link>
        </Empty>
      </Card>
    );
  }

  if (filteredSets.length === 0) {
    return (
      <Card>
        <Empty
          description="Không có bộ từ khớp bộ lọc."
          style={{ padding: "32px 0" }}
        >
          <Button type="link" onClick={onClearFilters}>
            Xóa bộ lọc
          </Button>
        </Empty>
      </Card>
    );
  }

  return (
    <List
      grid={{ gutter: 16, column: 2 }}
      dataSource={filteredSets}
      renderItem={(s) => {
        const cardCount = s._count?.cards ?? 0;

        return (
          <List.Item>
            <Card
              hoverable
              extra={
                <Flex gap={4} align="center">
                  <Tooltip title="Học">
                    <Link href={`/dashboard/study/${s.id}`}>
                      <Button
                        type="text"
                        size="small"
                        icon={<BookOutlined />}
                        disabled={cardCount === 0}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Link>
                  </Tooltip>

                  <Tooltip title="Chia nhỏ">
                    <Button
                      type="text"
                      size="small"
                      icon={<ScissorOutlined />}
                      loading={splitLoadingId === s.id}
                      disabled={cardCount < 2}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSplitRequest(s);
                      }}
                    />
                  </Tooltip>

                  <Popconfirm
                    title="Xóa bộ từ?"
                    description="Tất cả thẻ và tiến độ sẽ bị xóa vĩnh viễn."
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => onDeleteSet(s.id)}
                  >
                    <Tooltip title="Xóa">
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Tooltip>
                  </Popconfirm>
                </Flex>
              }
              styles={{ body: { cursor: "pointer" } }}
              onClick={() => {
                window.location.href = `/dashboard/sets/${s.id}`;
              }}
            >
              <Title level={5} style={{ marginBottom: 4 }}>
                {s.title}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {s.language}
              </Text>
              {s.description && (
                <Paragraph
                  type="secondary"
                  ellipsis={{ rows: 2 }}
                  style={{ marginTop: 8, marginBottom: 8, fontSize: 13 }}
                >
                  {s.description}
                </Paragraph>
              )}
              <Text style={{ color: "#2563eb", fontSize: 13 }}>
                {cardCount} cards
              </Text>
            </Card>
          </List.Item>
        );
      }}
    />
  );
}
