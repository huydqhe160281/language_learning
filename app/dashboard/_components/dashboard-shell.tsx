"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MenuOutlined } from "@ant-design/icons";
import { Button, Drawer, Layout, Menu, Typography } from "@/components/antd-ui";

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
  const [drawerOpen, setDrawerOpen] = useState(false);

  const keyMap: Record<typeof active, string> = {
    home: "/dashboard",
    sets: "/dashboard/sets",
    progress: "/dashboard/progress",
    profile: "/dashboard/profile",
  };

  const selectedKey = keyMap[active] ?? pathname;

  const menuItems = NAV_ITEMS.map((item) => ({
    key: item.key,
    label: (
      <Link href={item.key} onClick={() => setDrawerOpen(false)}>
        {item.label}
      </Link>
    ),
  }));

  return (
    <Layout className="min-h-screen">
      <Header
        className="flex items-center gap-6 px-4 sm:px-8"
        style={{
          height: 64,
          lineHeight: "64px",
          borderBottom: "1px solid var(--border)",
          background: "var(--card)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          padding: undefined,
        }}
      >
        {/* Logo */}
        <Link href="/dashboard" className="shrink-0">
          <Title
            level={4}
            style={{ margin: 0, color: "#2563eb", lineHeight: "64px" }}
          >
            LinguaLearn
          </Title>
        </Link>

        {/* Desktop horizontal nav — hidden on small screens */}
        <div className="hidden flex-1 md:flex">
          <Menu
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={menuItems}
            style={{
              flex: 1,
              border: "none",
              lineHeight: "62px",
              background: "transparent",
            }}
          />
        </div>

        {/* Hamburger button — visible only on mobile */}
        <div className="ml-auto md:hidden">
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
          />
        </div>
      </Header>

      {/* Mobile slide-in navigation */}
      <Drawer
        title="Navigation"
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        size={240}
      >
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{ border: "none" }}
        />
      </Drawer>

      <Content>{children}</Content>
    </Layout>
  );
}
