import { AntdProvider } from "@/components/antd-provider";
import { GlobalLoading } from "@/components/global-loading";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AntdProvider>
      <GlobalLoading />
      {children}
    </AntdProvider>
  );
}
