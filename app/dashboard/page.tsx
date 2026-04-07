"use client";

import Link from "next/link";
import { DashboardShell } from "./_components/dashboard-shell";

export default function DashboardPage() {
  return (
    <DashboardShell active="home">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 p-8 text-white">
          <h2 className="mb-2 text-3xl font-bold">Chào mừng!</h2>
          <p className="text-lg opacity-90">
            Thêm bộ từ mới hoặc mở &quot;My Sets&quot; để học flashcard, quiz và
            các chế độ khác.
          </p>
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-4">
          {[
            {
              label: "Study Sets",
              value: "—",
              color: "bg-blue-100 text-blue-600",
            },
            {
              label: "Cards Learned",
              value: "—",
              color: "bg-green-100 text-green-600",
            },
            {
              label: "Days Streak",
              value: "—",
              color: "bg-purple-100 text-purple-600",
            },
            {
              label: "Total Time",
              value: "—",
              color: "bg-orange-100 text-orange-600",
            },
          ].map((stat, i) => (
            <div key={i} className={`${stat.color} rounded-xl p-6`}>
              <p className="mb-1 text-sm font-medium opacity-75">
                {stat.label}
              </p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Create New Set",
              desc: "Tạo bộ từ và thêm flashcard",
              icon: "📝",
              link: "/dashboard/sets/create",
              color: "from-blue-500 to-blue-600",
            },
            {
              title: "My Sets",
              desc: "Xem và học các bộ của bạn",
              icon: "📚",
              link: "/dashboard/sets",
              color: "from-green-500 to-green-600",
            },
            {
              title: "Progress",
              desc: "Theo dõi tiến độ",
              icon: "📊",
              link: "/dashboard/progress",
              color: "from-purple-500 to-purple-600",
            },
          ].map((card, i) => (
            <Link key={i} href={card.link}>
              <div
                className={`bg-gradient-to-br ${card.color} transform cursor-pointer rounded-xl p-8 text-white transition hover:scale-105 hover:shadow-lg`}
              >
                <div className="mb-4 text-4xl">{card.icon}</div>
                <h3 className="mb-2 text-xl font-bold">{card.title}</h3>
                <p className="opacity-90">{card.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="rounded-xl bg-white p-8 shadow">
          <h3 className="mb-6 text-2xl font-bold text-gray-900">
            Your Study Sets
          </h3>
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-12 text-center">
            <div className="mb-4 text-5xl">📚</div>
            <p className="mb-4 text-gray-600">
              Xem danh sách đầy đủ trong My Sets.
            </p>
            <Link href="/dashboard/sets">
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700"
              >
                Mở My Sets
              </button>
            </Link>
          </div>
        </div>
      </main>
    </DashboardShell>
  );
}
