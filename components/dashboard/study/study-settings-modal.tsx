"use client";

import { useState } from "react";
import {
  Button,
  Modal,
  Radio,
  Space,
  Switch,
  Typography,
} from "@/components/antd-ui";
import type { StudyModeId } from "./study-mode-picker";

const { Text, Title } = Typography;

const BATCH_PRESETS = [5, 7, 10, 15] as const;

const MODE_LABELS: Record<StudyModeId, string> = {
  flashcard: "Flashcards 🃏",
  learn: "Learn Mode 📖",
  quiz: "Quiz ❓",
  test: "Test 📝",
  match: "Matching Game 🎮",
};

export interface StudyConfig {
  batchSize: number | null; // null = study all at once
  shuffle: boolean;
}

interface StudySettingsModalProps {
  open: boolean;
  mode: StudyModeId;
  onCancel: () => void;
  onStart: (config: StudyConfig) => void;
}

export function StudySettingsModal({
  open,
  mode,
  onCancel,
  onStart,
}: StudySettingsModalProps) {
  const [shuffle, setShuffle] = useState(true);
  const [batchEnabled, setBatchEnabled] = useState(false);
  const [batchSize, setBatchSize] = useState<number>(7);

  const handleStart = () => {
    onStart({
      batchSize: batchEnabled ? batchSize : null,
      shuffle,
    });
  };

  return (
    <Modal
      open={open}
      title={
        <span>
          ⚙ Cài đặt phiên học —{" "}
          <Text type="secondary">{MODE_LABELS[mode]}</Text>
        </span>
      }
      onCancel={onCancel}
      footer={
        <Space>
          <Button onClick={onCancel}>Hủy</Button>
          <Button type="primary" onClick={handleStart}>
            Bắt đầu →
          </Button>
        </Space>
      }
      width={480}
    >
      <Space orientation="vertical" style={{ width: "100%", padding: "8px 0" }}>
        {/* Shuffle */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            border: "1px solid var(--border)",
            borderRadius: 8,
          }}
        >
          <div>
            <Title level={5} style={{ margin: 0, fontSize: 14 }}>
              🔀 Xáo trộn thứ tự
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Học theo thứ tự ngẫu nhiên
            </Text>
          </div>
          <Switch checked={shuffle} onChange={setShuffle} />
        </div>

        {/* Batch */}
        <div
          style={{
            padding: "12px 16px",
            border: "1px solid var(--border)",
            borderRadius: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: batchEnabled ? 12 : 0,
            }}
          >
            <div>
              <Title level={5} style={{ margin: 0, fontSize: 14 }}>
                📦 Học theo batch
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {batchEnabled
                  ? "Thẻ sai sẽ xuất hiện lại ở batch tiếp theo"
                  : "Học tất cả thẻ trong một lần"}
              </Text>
            </div>
            <Switch checked={batchEnabled} onChange={setBatchEnabled} />
          </div>

          {batchEnabled && (
            <>
              <Text style={{ fontSize: 13, display: "block", marginBottom: 8 }}>
                Số thẻ mỗi batch:
              </Text>
              <Radio.Group
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value as number)}
                optionType="button"
                buttonStyle="solid"
              >
                {BATCH_PRESETS.map((n) => (
                  <Radio.Button key={n} value={n}>
                    {n} thẻ
                  </Radio.Button>
                ))}
              </Radio.Group>
            </>
          )}
        </div>
      </Space>
    </Modal>
  );
}
