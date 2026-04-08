"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layout, Menu, Typography } from "@/components/antd-ui";

const { Header, Content } = Layout;
const { Title } = Typography;

const NAV_ITEMS = [
  { key: "/dashboard", label: "Home" },
  { key: "/dashboard/sets", label: "My Sets" },
  { key: "/dashboard/progress", label: "Progress" },
  { key: "/dashboard/profile", label: "Profile" },
];

export function DashboardShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active: "home" | "sets" | "progress" | "profile";
}) {
  const pathname = usePathname();

  const keyMap: Record<typeof active, string> = {
    home: "/dashboard",
    sets: "/dashboard/sets",
    progress: "/dashboard/progress",
    profile: "/dashboard/profile",
  };

  const selectedKey = keyMap[active] ?? pathname;

  const menuItems = NAV_ITEMS.map((item) => ({
    key: item.key,
    label: <Link href={item.key}>{item.label}</Link>,
  }));

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Header
        style={{
          background: "#fff",
          borderBottom: "1px solid #f0f0f0",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          gap: 32,
        }}
      >
        <Link href="/dashboard">
          <Title
            level={4}
            style={{ margin: 0, color: "#2563eb", lineHeight: "64px" }}
          >
            LinguaLearn
          </Title>
        </Link>

        <Menu
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{
            flex: 1,
            border: "none",
            lineHeight: "62px",
          }}
        />
      </Header>

      <Content>{children}</Content>
    </Layout>
  );
}
