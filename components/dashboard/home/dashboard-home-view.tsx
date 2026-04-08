"use client";

import Link from "next/link";
import {
  Button,
  Card,
  Col,
  Empty,
  Row,
  Statistic,
  Typography,
} from "@/components/antd-ui";

const { Title, Text } = Typography;

const STATS = [
  { label: "Study Sets", value: "—", color: "#2563eb" },
  { label: "Cards Learned", value: "—", color: "#16a34a" },
  { label: "Days Streak", value: "—", color: "#7c3aed" },
  { label: "Total Time", value: "—", color: "#ea580c" },
];

const QUICK_LINKS = [
  {
    title: "Create New Set",
    desc: "Tạo bộ từ và thêm flashcard",
    icon: "📝",
    link: "/dashboard/sets/create",
  },
  {
    title: "My Sets",
    desc: "Xem và học các bộ của bạn",
    icon: "📚",
    link: "/dashboard/sets",
  },
  {
    title: "Progress",
    desc: "Theo dõi tiến độ",
    icon: "📊",
    link: "/dashboard/progress",
  },
  {
    title: "Profile",
    desc: "Thông tin tài khoản cục bộ",
    icon: "👤",
    link: "/dashboard/profile",
  },
];

export function DashboardHomeView() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Card
        variant="borderless"
        style={{
          background: "linear-gradient(to right, #3b82f6, #4f46e5)",
          marginBottom: 40,
        }}
        styles={{ body: { padding: "32px" } }}
      >
        <Title level={3} style={{ color: "#fff", margin: 0 }}>
          Chào mừng!
        </Title>
        <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 16 }}>
          Thêm bộ từ mới hoặc mở &quot;My Sets&quot; để học flashcard, quiz và
          các chế độ khác.
        </Text>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 40 }}>
        {STATS.map((stat) => (
          <Col xs={12} md={6} key={stat.label}>
            <Card>
              <Statistic
                title={stat.label}
                value={stat.value}
                styles={{ content: { color: stat.color, fontSize: 32 } }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 40 }}>
        {QUICK_LINKS.map((item) => (
          <Col xs={24} sm={12} md={6} key={item.title}>
            <Link href={item.link} style={{ display: "block" }}>
              <Card
                hoverable
                style={{ textAlign: "center" }}
                styles={{ body: { padding: "32px 24px" } }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>
                  {item.icon}
                </div>
                <Title level={5} style={{ margin: "0 0 4px" }}>
                  {item.title}
                </Title>
                <Text type="secondary">{item.desc}</Text>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>

      <Card>
        <Title level={4} style={{ marginBottom: 24 }}>
          Your Study Sets
        </Title>
        <Empty
          description="Xem danh sách đầy đủ trong My Sets."
          style={{ padding: "32px 0" }}
        >
          <Link href="/dashboard/sets">
            <Button type="primary">Mở My Sets</Button>
          </Link>
        </Empty>
      </Card>
    </main>
  );
}
