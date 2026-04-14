import { AntdProvider } from "@/components/antd-provider";
import { GlobalLoading } from "@/components/global-loading";
import { ThemeToggleFab } from "@/components/theme-toggle-fab";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AntdProvider>
      <GlobalLoading />
      <ThemeToggleFab />
      {children}
    </AntdProvider>
  );
}
