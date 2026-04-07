"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { App, Popconfirm } from "antd";
import { Trash2 } from "lucide-react";
import { setsApiClient, StudySet } from "@/lib/api";
import { DashboardShell } from "../_components/dashboard-shell";

export default function SetsPage() {
  const [sets, setSets] = useState<StudySet[]>([]);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();

  const loadSets = () =>
    setsApiClient
      .getAll()
      .then(setSets)
      .catch(() => setSets([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    loadSets();
  }, []);

  const handleDeleteSet = async (id: string) => {
    try {
      await setsApiClient.remove(id);
      message.success("Đã xóa bộ từ");
      setSets((prev) => prev.filter((s) => s.id !== id));
    } catch {
      message.error("Không thể xóa bộ từ");
    }
  };

  return (
    <DashboardShell active="sets">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Your Study Sets</h2>
          <Link href="/dashboard/sets/create">
            <button
              type="button"
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-700"
            >
              + Create New Set
            </button>
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading…</p>
        ) : sets.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center shadow">
            <div className="mb-4 text-5xl">📚</div>
            <p className="mb-6 text-lg text-gray-600">
              You haven&apos;t created any study sets yet.
            </p>
            <p className="mb-8 text-gray-500">
              Create your first study set to start learning Japanese or Chinese
              with interactive flashcards.
            </p>
            <Link href="/dashboard/sets/create">
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-8 py-3 font-medium text-white transition hover:bg-blue-700"
              >
                Create Your First Set
              </button>
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {sets.map((s) => (
              <li key={s.id} className="group relative">
                <Link
                  href={`/dashboard/sets/${s.id}`}
                  className="block rounded-xl border border-gray-100 bg-white p-6 pr-14 shadow transition hover:shadow-md"
                >
                  <h3 className="text-xl font-semibold text-gray-900">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{s.language}</p>
                  {s.description ? (
                    <p className="mt-2 line-clamp-2 text-gray-600">
                      {s.description}
                    </p>
                  ) : null}
                  <p className="mt-3 text-sm text-blue-600">
                    {s._count?.cards ?? 0} cards
                  </p>
                </Link>

                {/* Delete button — positioned absolute over the card */}
                <Popconfirm
                  title="Xóa bộ từ?"
                  description="Tất cả thẻ và tiến độ sẽ bị xóa vĩnh viễn."
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => handleDeleteSet(s.id)}
                >
                  <button
                    type="button"
                    onClick={(e) => e.preventDefault()}
                    className="absolute top-4 right-4 rounded-lg p-2 text-gray-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                    title="Xóa bộ từ"
                  >
                    <Trash2 size={18} />
                  </button>
                </Popconfirm>
              </li>
            ))}
          </ul>
        )}
      </main>
    </DashboardShell>
  );
}
