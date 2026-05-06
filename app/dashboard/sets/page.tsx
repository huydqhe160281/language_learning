"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MergeCellsOutlined, PlusOutlined } from "@ant-design/icons";
import { App, Button, Flex, Typography } from "@/components/antd-ui";
import { MergeSetsModal } from "@/components/dashboard/sets/merge-sets-modal";
import { SetsFilterBar } from "@/components/dashboard/sets/sets-filter-bar";
import { SetsListBody } from "@/components/dashboard/sets/sets-list-body";
import { SplitSetModal } from "@/components/dashboard/sets/split-set-modal";
import { setsApiClient, StudySet } from "@/lib/api";
import { DashboardShell } from "../_components/dashboard-shell";

const { Title } = Typography;

export default function SetsPage() {
  const [allSets, setAllSets] = useState<StudySet[]>([]);
  const [q, setQ] = useState("");
  const [language, setLanguage] = useState<string>("");
  const { message } = App.useApp();

  // ── Split ────────────────────────────────────────────────────────────────
  const [splitLoadingId, setSplitLoadingId] = useState<string | null>(null);
  const [splitTarget, setSplitTarget] = useState<StudySet | null>(null);

  // ── Merge ────────────────────────────────────────────────────────────────
  const [mergeOpen, setMergeOpen] = useState(false);

  useEffect(() => {
    setsApiClient
      .getAll()
      .then(setAllSets)
      .catch(() => setAllSets([]));
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

  /** Fetch full set (with cards) then open split modal. */
  const handleSplitRequest = async (s: StudySet) => {
    setSplitLoadingId(s.id);
    try {
      const full = await setsApiClient.getById(s.id);
      setSplitTarget(full);
    } catch {
      message.error("Không thể tải bộ từ");
    } finally {
      setSplitLoadingId(null);
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
          wrap="wrap"
          gap={8}
          style={{ marginBottom: 24 }}
        >
          <Title level={3} style={{ margin: 0 }}>
            Your Study Sets
          </Title>

          <Flex gap={8} wrap="wrap">
            {/* Merge — only useful when 2+ sets exist */}
            {allSets.length >= 2 && (
              <Button
                icon={<MergeCellsOutlined />}
                onClick={() => setMergeOpen(true)}
                style={{ borderColor: "#7c3aed", color: "#7c3aed" }}
              >
                Gộp bộ từ
              </Button>
            )}
            <Link href="/dashboard/sets/create">
              <Button type="primary" icon={<PlusOutlined />}>
                Create New Set
              </Button>
            </Link>
          </Flex>
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
          onSplitRequest={handleSplitRequest}
          splitLoadingId={splitLoadingId}
        />
      </main>

      {/* Split modal — only rendered when a target set is loaded */}
      {splitTarget && (
        <SplitSetModal
          open={!!splitTarget}
          set={splitTarget}
          onCancel={() => setSplitTarget(null)}
          onSuccess={(newIds) => {
            setSplitTarget(null);
            message.success(
              `Đã tạo ${newIds.length} bộ nhỏ! Xem trong My Sets.`,
            );
            // Refresh the list so the new sets appear
            setsApiClient
              .getAll()
              .then(setAllSets)
              .catch(() => {});
          }}
        />
      )}

      {/* Merge modal */}
      <MergeSetsModal
        open={mergeOpen}
        allSets={allSets}
        onCancel={() => setMergeOpen(false)}
        onSuccess={(newSetId) => {
          setMergeOpen(false);
          // Refresh list so merged set appears
          setsApiClient
            .getAll()
            .then(setAllSets)
            .catch(() => {});
          void newSetId;
        }}
      />
    </DashboardShell>
  );
}
