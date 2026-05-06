"use client";

import { useEffect, useMemo, useState } from "react";
import { ScissorOutlined } from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Flex,
  Modal,
  Segmented,
  Typography,
} from "@/components/antd-ui";
import { setsApiClient, StudySet, Card as StudyCard } from "@/lib/api";

const { Text, Title } = Typography;

type SplitMode = "parts" | "perPart";

/** Divide cards into chunks. Last chunk may be smaller. */
function chunkCards(
  cards: StudyCard[],
  mode: SplitMode,
  value: number,
): StudyCard[][] {
  if (cards.length === 0 || value <= 0) return [];

  if (mode === "parts") {
    const total = Math.min(value, cards.length);
    const size = Math.ceil(cards.length / total);
    return Array.from({ length: total }, (_, i) =>
      cards.slice(i * size, (i + 1) * size),
    ).filter((chunk) => chunk.length > 0);
  }

  // perPart: fixed size, last chunk has remainder
  const chunks: StudyCard[][] = [];
  for (let i = 0; i < cards.length; i += value) {
    chunks.push(cards.slice(i, i + value));
  }
  return chunks;
}

export interface SplitSetModalProps {
  open: boolean;
  set: StudySet;
  onCancel: () => void;
  /** Called after all new sets are successfully created. */
  onSuccess: (newSetIds: string[]) => void;
}

export function SplitSetModal({
  open,
  set,
  onCancel,
  onSuccess,
}: SplitSetModalProps) {
  const cards = set.cards ?? [];
  const total = cards.length;

  const [mode, setMode] = useState<SplitMode>("parts");
  const [value, setValue] = useState(2);
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  // Reset to sane defaults when the modal opens
  useEffect(() => {
    if (open) {
      setMode("parts");
      setValue(2);
    }
  }, [open]);

  const maxParts = Math.min(total, 20);
  const maxPerPart = total - 1;

  // Clamp value to valid range whenever mode changes
  useEffect(() => {
    if (mode === "parts") setValue((v) => Math.min(Math.max(v, 2), maxParts));
    else setValue((v) => Math.min(Math.max(v, 1), maxPerPart));
  }, [mode, maxParts, maxPerPart]);

  const preview = useMemo(
    () => chunkCards(cards, mode, value),
    [cards, mode, value],
  );

  const handleConfirm = async () => {
    if (preview.length === 0) return;
    setLoading(true);
    try {
      const created = await Promise.all(
        preview.map((chunk, i) =>
          setsApiClient.create({
            title: `${set.title} — Phần ${i + 1}`,
            language: set.language,
            isPublic: set.isPublic,
            description: `Chia từ "${set.title}" (${chunk.length} thẻ)`,
            cards: chunk.map((c) => ({
              front: c.front,
              back: c.back,
              example: c.example ?? null,
            })),
          }),
        ),
      );
      message.success(`Đã tạo ${created.length} bộ nhỏ thành công!`);
      onSuccess(created.map((s) => s.id));
    } catch {
      message.error("Không thể chia bộ từ, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const isValid = total >= 2 && preview.length >= 2;

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={
        <Flex align="center" gap={8}>
          <ScissorOutlined style={{ color: "#2563eb" }} />
          <span>Chia nhỏ bộ từ</span>
        </Flex>
      }
      footer={
        <Flex justify="flex-end" gap={8}>
          <Button onClick={onCancel}>Hủy</Button>
          <Button
            type="primary"
            icon={<ScissorOutlined />}
            loading={loading}
            disabled={!isValid}
            onClick={handleConfirm}
          >
            Chia ngay
          </Button>
        </Flex>
      }
      width={520}
      destroyOnHidden
    >
      {/* Source info */}
      <div style={{ marginBottom: 20 }}>
        <Text type="secondary">Bộ gốc: </Text>
        <Text strong>{set.title}</Text>
        <Text type="secondary"> — </Text>
        <Text strong>{total}</Text>
        <Text type="secondary"> thẻ</Text>
        {total < 2 && (
          <div style={{ marginTop: 8 }}>
            <Text type="danger">Cần ít nhất 2 thẻ để chia nhỏ.</Text>
          </div>
        )}
      </div>

      {total >= 2 && (
        <>
          {/* Mode selector */}
          <div style={{ marginBottom: 16 }}>
            <Text
              type="secondary"
              style={{ display: "block", marginBottom: 8 }}
            >
              Cách chia:
            </Text>
            <Segmented
              block
              value={mode}
              onChange={(v) => setMode(v as SplitMode)}
              options={[
                { label: "Chia thành N phần", value: "parts" },
                { label: "Số thẻ mỗi phần", value: "perPart" },
              ]}
            />
          </div>

          {/* Value input */}
          <div style={{ marginBottom: 20 }}>
            {mode === "parts" ? (
              <Flex align="center" gap={12}>
                <Text>Số phần:</Text>
                <input
                  type="number"
                  min={2}
                  max={maxParts}
                  value={value}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (!isNaN(n)) setValue(Math.min(Math.max(n, 2), maxParts));
                  }}
                  style={{
                    width: 80,
                    padding: "4px 8px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    color: "var(--foreground)",
                    fontSize: 14,
                    textAlign: "center",
                  }}
                />
                <Text type="secondary">(2 – {maxParts})</Text>
              </Flex>
            ) : (
              <Flex align="center" gap={12}>
                <Text>Số thẻ / phần:</Text>
                <input
                  type="number"
                  min={1}
                  max={maxPerPart}
                  value={value}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (!isNaN(n))
                      setValue(Math.min(Math.max(n, 1), maxPerPart));
                  }}
                  style={{
                    width: 80,
                    padding: "4px 8px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    color: "var(--foreground)",
                    fontSize: 14,
                    textAlign: "center",
                  }}
                />
                <Text type="secondary">→ {preview.length} phần</Text>
              </Flex>
            )}
          </div>

          {/* Preview */}
          <div>
            <Text
              type="secondary"
              style={{ display: "block", marginBottom: 8 }}
            >
              Xem trước ({preview.length} bộ mới sẽ được tạo):
            </Text>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                maxHeight: 220,
                overflowY: "auto",
              }}
            >
              {preview.map((chunk, i) => {
                const start = cards.indexOf(chunk[0]) + 1;
                const end = cards.indexOf(chunk[chunk.length - 1]) + 1;
                return (
                  <Card key={i} size="small" style={{ borderRadius: 8 }}>
                    <Flex justify="space-between" align="center">
                      <Text strong>
                        {set.title} — Phần {i + 1}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {chunk.length} thẻ (#{start}–#{end})
                      </Text>
                    </Flex>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Note */}
          <div
            style={{
              marginTop: 16,
              padding: "10px 14px",
              borderRadius: 8,
              background: "var(--muted)",
              fontSize: 13,
            }}
          >
            <Text type="secondary">
              Bộ gốc <Text strong>"{set.title}"</Text> vẫn được giữ nguyên. Các
              bộ nhỏ sẽ được tạo mới.
            </Text>
          </div>
        </>
      )}
    </Modal>
  );
}
