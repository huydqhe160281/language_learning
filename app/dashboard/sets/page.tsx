"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { App, Button, Flex, Typography } from "@/components/antd-ui";
import { SetsFilterBar } from "@/components/dashboard/sets/sets-filter-bar";
import { SetsListBody } from "@/components/dashboard/sets/sets-list-body";
import { setsApiClient, StudySet } from "@/lib/api";
import { DashboardShell } from "../_components/dashboard-shell";

const { Title } = Typography;

export default function SetsPage() {
  const [allSets, setAllSets] = useState<StudySet[]>([]);
  const [q, setQ] = useState("");
  const [language, setLanguage] = useState<string>("");
  const { message } = App.useApp();

  useEffect(() => {
    setsApiClient
      .getAll()
      .then((rows) => {
        setAllSets(rows);
      })
      .catch(() => {
        setAllSets([]);
      });
  }, []);

  const filteredSets = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return allSets.filter((s) => {
      if (language && s.language !== language) return false;
      if (needle && !s.title.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [allSets, q, language]);

  const handleDeleteSet = async (id: string) => {
    try {
      await setsApiClient.remove(id);
      message.success("Đã xóa bộ từ");
      setAllSets((prev) => prev.filter((s) => s.id !== id));
    } catch {
      message.error("Không thể xóa bộ từ");
    }
  };

  const clearFilters = () => {
    setQ("");
    setLanguage("");
  };

  return (
    <DashboardShell active="sets">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Flex
          justify="space-between"
          align="center"
          style={{ marginBottom: 24 }}
        >
          <Title level={3} style={{ margin: 0 }}>
            Your Study Sets
          </Title>
          <Link href="/dashboard/sets/create">
            <Button type="primary" icon={<PlusOutlined />}>
              Create New Set
            </Button>
          </Link>
        </Flex>

        <SetsFilterBar
          q={q}
          onQChange={setQ}
          language={language}
          onLanguageChange={setLanguage}
          onReset={clearFilters}
        />

        <SetsListBody
          allSets={allSets}
          filteredSets={filteredSets}
          onDeleteSet={handleDeleteSet}
          onClearFilters={clearFilters}
        />
      </main>
    </DashboardShell>
  );
}
