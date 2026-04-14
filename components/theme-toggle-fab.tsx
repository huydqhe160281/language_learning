"use client";

import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Button } from "@/components/antd-ui";
import { useTheme } from "@/lib/theme-context";

/**
 * Floating action button that toggles dark / light mode.
 * Rendered inside DashboardLayout so it is always accessible on every
 * dashboard page, including full-screen study sessions.
 */
export function ThemeToggleFab() {
  const { theme, toggle } = useTheme();

  return (
    <Button
      shape="circle"
      size="large"
      icon={theme === "dark" ? <SunOutlined /> : <MoonOutlined />}
      onClick={toggle}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1000,
        boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
      }}
    />
  );
}
