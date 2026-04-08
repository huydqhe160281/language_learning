"use client";

import { DashboardHomeView } from "@/components/dashboard/home/dashboard-home-view";
import { DashboardShell } from "./_components/dashboard-shell";

export default function DashboardPage() {
  return (
    <DashboardShell active="home">
      <DashboardHomeView />
    </DashboardShell>
  );
}
