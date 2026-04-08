"use client";

import { ProfilePageView } from "@/components/dashboard/profile/profile-page-view";
import { DashboardShell } from "../_components/dashboard-shell";

export default function ProfilePage() {
  return (
    <DashboardShell active="profile">
      <ProfilePageView />
    </DashboardShell>
  );
}
