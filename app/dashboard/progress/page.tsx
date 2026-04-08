"use client";

import { useEffect, useState } from "react";
import { Typography } from "@/components/antd-ui";
import { DueTodayBanner } from "@/components/dashboard/progress/due-today-banner";
import { ProgressSetsDetailTable } from "@/components/dashboard/progress/progress-sets-detail-table";
import { ProgressSummaryStats } from "@/components/dashboard/progress/progress-summary-stats";
import type { ProgressSummaryResponse } from "@/lib/api/types";
import { DashboardShell } from "../_components/dashboard-shell";

const { Title } = Typography;

const EMPTY_SUMMARY: ProgressSummaryResponse = {
  totalCards: 0,
  studiedCards: 0,
  unstudiedCards: 0,
  totalCorrect: 0,
  totalIncorrect: 0,
  overallMasteryPct: 0,
  dueToday: 0,
  sets: [],
};

export default function ProgressPage() {
  const [summary, setSummary] =
    useState<ProgressSummaryResponse>(EMPTY_SUMMARY);

  useEffect(() => {
    import("@/lib/api")
      .then(({ progressApiClient }) => progressApiClient.getSummary())
      .then((data) => {
        setSummary(data);
      })
      .catch(() => {});
  }, []);

  const {
    totalCards,
    studiedCards,
    unstudiedCards,
    totalCorrect,
    totalIncorrect,
    overallMasteryPct,
    dueToday,
    sets,
  } = summary;

  return (
    <DashboardShell active="progress">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Title level={3} style={{ marginBottom: 32 }}>
          Tiến độ học tập
        </Title>

        <ProgressSummaryStats
          totalCards={totalCards}
          studiedCards={studiedCards}
          unstudiedCards={unstudiedCards}
          totalCorrect={totalCorrect}
          totalIncorrect={totalIncorrect}
          overallMasteryPct={overallMasteryPct}
        />

        <DueTodayBanner dueToday={dueToday} />

        <ProgressSetsDetailTable sets={sets} />
      </main>
    </DashboardShell>
  );
}
