"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "../_components/dashboard-shell";

export default function ProgressPage() {
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalIncorrect, setTotalIncorrect] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    import("@/lib/api").then(({ progressApiClient }) =>
      progressApiClient
        .getAll()
        .then((rows) => {
          if (!cancelled) {
            setTotalCorrect(rows.reduce((a, r) => a + r.correct, 0));
            setTotalIncorrect(rows.reduce((a, r) => a + r.incorrect, 0));
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoading(false);
        }),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const learned = totalCorrect + totalIncorrect;
  const mastery =
    learned === 0 ? 0 : Math.round((totalCorrect / learned) * 100);

  return (
    <DashboardShell active="progress">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-3xl font-bold text-gray-900">
          Your Learning Progress
        </h2>

        {loading ? (
          <p className="text-gray-600">Loading…</p>
        ) : (
          <div className="mb-12 grid gap-6 md:grid-cols-3">
            {[
              {
                label: "Reviews (correct)",
                value: String(totalCorrect),
                icon: "✓",
              },
              {
                label: "Reviews (incorrect)",
                value: String(totalIncorrect),
                icon: "✗",
              },
              { label: "Mastery %", value: `${mastery}%`, icon: "🎯" },
            ].map((stat, i) => (
              <div key={i} className="rounded-xl bg-white p-6 shadow">
                <div className="mb-3 text-3xl">{stat.icon}</div>
                <p className="mb-2 text-sm text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl bg-white p-8 shadow">
          <h3 className="mb-6 text-xl font-bold text-gray-900">Progress</h3>
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-12 text-center">
            <div className="mb-4 text-4xl">📊</div>
            <p className="text-gray-600">
              Số liệu trên cập nhật theo dữ liệu tiến độ khi bạn học qua các chế
              độ study.
            </p>
          </div>
        </div>
      </main>
    </DashboardShell>
  );
}
