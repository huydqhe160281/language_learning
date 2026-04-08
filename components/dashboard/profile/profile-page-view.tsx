"use client";

import Link from "next/link";
import { Button, Card, Typography } from "@/components/antd-ui";

const { Title, Paragraph, Text } = Typography;

export function ProfilePageView() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Title level={3} style={{ marginBottom: 24 }}>
        Hồ sơ
      </Title>
      <Card>
        <Paragraph style={{ marginBottom: 8 }}>
          Ứng dụng đang dùng <Text strong>một tài khoản cục bộ</Text> (không
          đăng nhập). Dữ liệu bộ từ và tiến độ được lưu trên máy / server của
          bạn.
        </Paragraph>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Sau này có thể mở rộng: đổi tên hiển thị, xuất dữ liệu, v.v.
        </Text>
        <div style={{ marginTop: 24 }}>
          <Link href="/dashboard">
            <Button type="primary">Về trang chủ</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
