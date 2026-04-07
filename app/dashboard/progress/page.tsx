"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from "@/components/antd-ui";
import type { ColumnsType } from "antd/es/table";
import type {
  ProgressSummaryResponse,
  SetProgressSummary,
} from "@/lib/api/types";
import { DashboardShell } from "../_components/dashboard-shell";

const { Title, Text } = Typography;

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

const EMPTY_SUMMARY: ProgressSummaryResponse = {
  totalCards: 0,
  studiedCards: 0,
  unstudiedCards: 0,
  totalCorrect: 0,
  totalIncorrect: 0,
  overallMasteryPct: 0,
  dueToday: 0,
  sets: [],
};

export default function ProgressPage() {
  const [summary, setSummary] =
    useState<ProgressSummaryResponse>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    import("@/lib/api")
      .then(({ progressApiClient }) => progressApiClient.getSummary())
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const {
    totalCards,
    studiedCards,
    unstudiedCards,
    totalCorrect,
    totalIncorrect,
    overallMasteryPct,
    dueToday,
    sets,
  } = summary;

  return (
    <DashboardShell active="progress">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Title level={3} style={{ marginBottom: 32 }}>
          Tiến độ học tập
        </Title>

        <Spin spinning={loading}>
          <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
            <Col xs={12} md={4}>
              <Card>
                <Statistic title="Tổng thẻ" value={totalCards} prefix="📚" />
              </Card>
            </Col>
            <Col xs={12} md={4}>
              <Card>
                <Statistic
                  title="Đã học"
                  value={studiedCards}
                  prefix="✓"
                  valueStyle={{ color: "#16a34a" }}
                />
              </Card>
            </Col>
            <Col xs={12} md={4}>
              <Card>
                <Statistic
                  title="Chưa học"
                  value={unstudiedCards}
                  prefix="○"
                  valueStyle={{
                    color: unstudiedCards > 0 ? "#dc2626" : "#6b7280",
                  }}
                />
              </Card>
            </Col>
            <Col xs={12} md={4}>
              <Card>
                <Statistic
                  title="Đúng"
                  value={totalCorrect}
                  prefix="✓"
                  valueStyle={{ color: "#16a34a" }}
                />
              </Card>
            </Col>
            <Col xs={12} md={4}>
              <Card>
                <Statistic
                  title="Sai"
                  value={totalIncorrect}
                  prefix="✗"
                  valueStyle={{ color: "#dc2626" }}
                />
              </Card>
            </Col>
            <Col xs={12} md={4}>
              <Card>
                <Statistic
                  title="Độ thành thạo"
                  value={overallMasteryPct}
                  suffix="%"
                  prefix="🎯"
                  valueStyle={{ color: "#7c3aed" }}
                />
              </Card>
            </Col>
          </Row>

          {/* ── Due today banner ── */}
          {dueToday > 0 && (
            <Card
              style={{
                marginBottom: 24,
                background: "#fff7ed",
                borderColor: "#fed7aa",
              }}
            >
              <Text strong style={{ color: "#c2410c" }}>
                🔔 Bạn có {dueToday} thẻ đến hạn ôn tập hôm nay!
              </Text>
            </Card>
          )}

          {/* ── Per-set table ── */}
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
        </Spin>
      </main>
    </DashboardShell>
  );
}
