"use client";

import { useEffect, useMemo, useState } from "react";
import { MergeCellsOutlined } from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Checkbox,
  Flex,
  Input,
  Modal,
  Typography,
} from "@/components/antd-ui";
import { setsApiClient, StudySet } from "@/lib/api";

const { Text, Title } = Typography;

export interface MergeSetsModalProps {
  open: boolean;
  allSets: StudySet[];
  onCancel: () => void;
  onSuccess: (newSetId: string) => void;
}

export function MergeSetsModal({
  open,
  allSets,
  onCancel,
  onSuccess,
}: MergeSetsModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  // Reset when opened
  useEffect(() => {
    if (open) {
      setSelectedIds([]);
      setTitle("");
    }
  }, [open]);

  // Auto-suggest title from selected set names
  useEffect(() => {
    if (selectedIds.length < 2) return;
    const names = selectedIds
      .map((id) => allSets.find((s) => s.id === id)?.title ?? "")
      .filter(Boolean);
    setTitle(names.join(" + "));
  }, [selectedIds, allSets]);

  const selected = useMemo(
    () => allSets.filter((s) => selectedIds.includes(s.id)),
    [allSets, selectedIds],
  );

  const totalCards = selected.reduce(
    (sum, s) => sum + (s._count?.cards ?? 0),
    0,
  );

  const toggleSet = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleConfirm = async () => {
    if (selectedIds.length < 2 || !title.trim()) return;
    setLoading(true);
    try {
      // Fetch full cards for each selected set in parallel
      const fullSets = await Promise.all(
        selectedIds.map((id) => setsApiClient.getById(id)),
      );

      // Preserve order: sets are merged in the order the user selected them
      const allCards = fullSets.flatMap((s) => s.cards ?? []);

      // Detect common language (use first set's language as default)
      const language = fullSets[0]?.language ?? "Japanese";

      const newSet = await setsApiClient.create({
        title: title.trim(),
        language,
        isPublic: false,
        description: `Gộp từ: ${fullSets.map((s) => s.title).join(", ")}`,
        cards: allCards.map((c) => ({
          front: c.front,
          back: c.back,
          example: c.example ?? null,
        })),
      });

      message.success(
        `Đã gộp ${fullSets.length} bộ thành "${newSet.title}" (${allCards.length} thẻ)!`,
      );
      onSuccess(newSet.id);
    } catch {
      message.error("Không thể gộp bộ từ, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const isValid = selectedIds.length >= 2 && title.trim().length > 0;

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={
        <Flex align="center" gap={8}>
          <MergeCellsOutlined style={{ color: "#7c3aed" }} />
          <span>Gộp bộ từ</span>
        </Flex>
      }
      footer={
        <Flex justify="flex-end" gap={8}>
          <Button onClick={onCancel}>Hủy</Button>
          <Button
            type="primary"
            icon={<MergeCellsOutlined />}
            loading={loading}
            disabled={!isValid}
            onClick={handleConfirm}
            style={
              isValid ? { background: "#7c3aed", borderColor: "#7c3aed" } : {}
            }
          >
            Gộp ngay
          </Button>
        </Flex>
      }
      width={560}
      destroyOnHidden
    >
      {/* Set selector */}
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
          Chọn ít nhất 2 bộ để gộp:
        </Text>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            maxHeight: 260,
            overflowY: "auto",
            paddingRight: 4,
          }}
        >
          {allSets.map((s) => {
            const checked = selectedIds.includes(s.id);
            return (
              <Card
                key={s.id}
                size="small"
                style={{
                  cursor: "pointer",
                  border: checked
                    ? "2px solid #7c3aed"
                    : "2px solid var(--border)",
                  background: checked ? "#7c3aed0d" : undefined,
                  transition: "all 0.15s",
                  borderRadius: 8,
                }}
                onClick={() => toggleSet(s.id)}
              >
                <Flex align="center" gap={10}>
                  <Checkbox
                    checked={checked}
                    onChange={() => toggleSet(s.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong style={{ display: "block" }}>
                      {s.title}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {s.language} · {s._count?.cards ?? 0} thẻ
                    </Text>
                  </div>
                </Flex>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {selectedIds.length >= 2 && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "#7c3aed0d",
            border: "1px solid #7c3aed33",
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          <Flex justify="space-between">
            <Text>
              <Text strong>{selectedIds.length}</Text> bộ được chọn
            </Text>
            <Text>
              Tổng cộng <Text strong>{totalCards}</Text> thẻ
            </Text>
          </Flex>
        </div>
      )}

      {/* New set title */}
      <div>
        <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>
          Tên bộ mới:
        </Text>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nhập tên cho bộ từ sau khi gộp…"
          maxLength={120}
          disabled={selectedIds.length < 2}
        />
      </div>

      {/* Note */}
      <div
        style={{
          marginTop: 14,
          padding: "10px 14px",
          borderRadius: 8,
          background: "var(--muted)",
          fontSize: 13,
        }}
      >
        <Text type="secondary">
          Các bộ gốc <Text strong>vẫn được giữ nguyên</Text>. Bộ gộp mới sẽ chứa
          tất cả thẻ theo thứ tự đã chọn.
        </Text>
      </div>
    </Modal>
  );
}
