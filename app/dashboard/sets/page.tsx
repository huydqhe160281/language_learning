"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Input,
  List,
  Popconfirm,
  Row,
  Select,
  Typography,
} from "@/components/antd-ui";
import { setsApiClient, StudySet } from "@/lib/api";
import { DashboardShell } from "../_components/dashboard-shell";

const { Title, Text, Paragraph } = Typography;

export default function SetsPage() {
  const [sets, setSets] = useState<StudySet[]>([]);
  const [q, setQ] = useState("");
  const [language, setLanguage] = useState<string>("");
  const { message } = App.useApp();

  useEffect(() => {
    setsApiClient
      .getAll({
        q: q.trim() || undefined,
        language: language || undefined,
      })
      .then((rows) => {
        setSets(rows);
      })
      .catch(() => {
        setSets([]);
      });
  }, [q, language]);

  const handleDeleteSet = async (id: string) => {
    try {
      await setsApiClient.remove(id);
      message.success("Đã xóa bộ từ");
      setSets((prev) => prev.filter((s) => s.id !== id));
    } catch {
      message.error("Không thể xóa bộ từ");
    }
  };

  return (
    <DashboardShell active="sets">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <Flex
          justify="space-between"
          align="center"
          style={{ marginBottom: 24 }}
        >
          <Title level={3} style={{ margin: 0 }}>
            Your Study Sets
          </Title>
          <Link href="/dashboard/sets/create">
            <Button type="primary" icon={<PlusOutlined />}>
              Create New Set
            </Button>
          </Link>
        </Flex>

        {/* Filter bar */}
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} md={10}>
              <Text
                type="secondary"
                style={{ display: "block", marginBottom: 4, fontSize: 12 }}
              >
                Search by title
              </Text>
              <Input
                allowClear
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="e.g., Hiragana, HSK 1, Food…"
              />
            </Col>
            <Col xs={24} md={8}>
              <Text
                type="secondary"
                style={{ display: "block", marginBottom: 4, fontSize: 12 }}
              >
                Language
              </Text>
              <Select
                style={{ width: "100%" }}
                value={language || undefined}
                placeholder="All languages"
                allowClear
                onChange={(val) => setLanguage(val ?? "")}
                options={[
                  { value: "Japanese", label: "Japanese" },
                  { value: "Chinese", label: "Chinese" },
                ]}
              />
            </Col>
            <Col xs={24} md={6} style={{ paddingTop: 20 }}>
              <Button
                onClick={() => {
                  setQ("");
                  setLanguage("");
                }}
                block
              >
                Reset
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Set list */}
        {sets.length === 0 ? (
          <Card>
            <Empty
              description="Chưa có bộ từ nào."
              style={{ padding: "32px 0" }}
            >
              <Link href="/dashboard/sets/create">
                <Button type="primary">Create Your First Set</Button>
              </Link>
            </Empty>
          </Card>
        ) : (
          <List
            grid={{ gutter: 16, column: 2 }}
            dataSource={sets}
            renderItem={(s) => (
              <List.Item>
                <Card
                  hoverable
                  extra={
                    <Popconfirm
                      title="Xóa bộ từ?"
                      description="Tất cả thẻ và tiến độ sẽ bị xóa vĩnh viễn."
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => handleDeleteSet(s.id)}
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  }
                  styles={{ body: { cursor: "pointer" } }}
                  onClick={() =>
                    (window.location.href = `/dashboard/sets/${s.id}`)
                  }
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
                    {s._count?.cards ?? 0} cards
                  </Text>
                </Card>
              </List.Item>
            )}
          />
        )}
      </main>
    </DashboardShell>
  );
}
