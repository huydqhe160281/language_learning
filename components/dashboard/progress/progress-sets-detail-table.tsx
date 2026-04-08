"use client";

import {
  Card,
  Empty,
  Progress,
  Table,
  Tag,
  Typography,
} from "@/components/antd-ui";
import type { ColumnsType } from "antd/es/table";
import type { SetProgressSummary } from "@/lib/api/types";

const { Text } = Typography;

const LANGUAGE_COLORS: Record<string, string> = {
  japanese: "red",
  chinese: "orange",
  korean: "blue",
  english: "green",
  french: "purple",
  spanish: "cyan",
  german: "geekblue",
};

const COLUMNS: ColumnsType<SetProgressSummary> = [
  {
    title: "Bộ từ",
    dataIndex: "title",
    key: "title",
    render: (title: string, row) => (
      <div>
        <Text strong>{title}</Text>
        <br />
        <Tag
          color={LANGUAGE_COLORS[row.language?.toLowerCase()] ?? "default"}
          style={{ marginTop: 4 }}
        >
          {row.language}
        </Tag>
      </div>
    ),
  },
  {
    title: "Tổng thẻ",
    dataIndex: "totalCards",
    key: "totalCards",
    align: "center",
    sorter: (a, b) => a.totalCards - b.totalCards,
    render: (v: number) => <Text>{v}</Text>,
  },
  {
    title: "Đã học",
    dataIndex: "studiedCards",
    key: "studiedCards",
    align: "center",
    sorter: (a, b) => a.studiedCards - b.studiedCards,
    render: (v: number) => <Text style={{ color: "#16a34a" }}>{v}</Text>,
  },
  {
    title: "Chưa học",
    dataIndex: "unstudiedCards",
    key: "unstudiedCards",
    align: "center",
    sorter: (a, b) => a.unstudiedCards - b.unstudiedCards,
    render: (v: number) => (
      <Text style={{ color: v > 0 ? "#dc2626" : "#6b7280" }}>{v}</Text>
    ),
  },
  {
    title: "Đúng",
    dataIndex: "correct",
    key: "correct",
    align: "center",
    sorter: (a, b) => a.correct - b.correct,
    render: (v: number) => <Text style={{ color: "#16a34a" }}>{v}</Text>,
  },
  {
    title: "Sai",
    dataIndex: "incorrect",
    key: "incorrect",
    align: "center",
    sorter: (a, b) => a.incorrect - b.incorrect,
    render: (v: number) => <Text style={{ color: "#dc2626" }}>{v}</Text>,
  },
  {
    title: "Độ thành thạo",
    dataIndex: "masteryPct",
    key: "masteryPct",
    align: "center",
    sorter: (a, b) => a.masteryPct - b.masteryPct,
    render: (v: number, row) => {
      if (row.correct + row.incorrect === 0)
        return <Text type="secondary">Chưa học</Text>;
      const color = v >= 80 ? "#16a34a" : v >= 50 ? "#d97706" : "#dc2626";
      return (
        <Progress
          percent={v}
          size="small"
          strokeColor={color}
          style={{ margin: 0, minWidth: 100 }}
        />
      );
    },
  },
  {
    title: "Đến hạn ôn",
    dataIndex: "dueToday",
    key: "dueToday",
    align: "center",
    sorter: (a, b) => a.dueToday - b.dueToday,
    render: (v: number) =>
      v > 0 ? (
        <Tag color="volcano">{v} thẻ</Tag>
      ) : (
        <Tag color="success">Đã ôn</Tag>
      ),
  },
];

export interface ProgressSetsDetailTableProps {
  sets: SetProgressSummary[];
}

export function ProgressSetsDetailTable({
  sets,
}: ProgressSetsDetailTableProps) {
  return (
    <Card title="Chi tiết theo bộ từ">
      {sets.length === 0 ? (
        <Empty
          image={<span style={{ fontSize: 48 }}>📊</span>}
          imageStyle={{ height: "auto" }}
          description="Chưa có dữ liệu. Hãy bắt đầu học để xem tiến độ tại đây."
          style={{ padding: "32px 0" }}
        />
      ) : (
        <Table<SetProgressSummary>
          dataSource={sets}
          columns={COLUMNS}
          rowKey="setId"
          pagination={sets.length > 10 ? { pageSize: 10 } : false}
          scroll={{ x: "max-content" }}
          size="middle"
        />
      )}
    </Card>
  );
}
