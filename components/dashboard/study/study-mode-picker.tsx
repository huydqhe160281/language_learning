"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Col,
  Row,
  Space,
  Typography,
} from "@/components/antd-ui";
import { StudySettingsModal } from "./study-settings-modal";
import type { StudyConfig } from "./study-settings-modal";

const { Title, Text } = Typography;

export const STUDY_MODES = [
  {
    id: "flashcard",
    name: "Flashcards",
    icon: "🃏",
    desc: "Test your memory with interactive cards",
    color: "#2563eb",
  },
  {
    id: "test",
    name: "Test",
    icon: "📝",
    desc: "Mixed question types to check mastery",
    color: "#0f766e",
  },
  {
    id: "learn",
    name: "Learn Mode",
    icon: "📖",
    desc: "Step-by-step learning with type-answer",
    color: "#0d9488",
  },
  {
    id: "quiz",
    name: "Quiz",
    icon: "❓",
    desc: "Answer multiple-choice questions",
    color: "#7c3aed",
  },
  {
    id: "match",
    name: "Matching Game",
    icon: "🎮",
    desc: "Match words with translations",
    color: "#ea580c",
  },
] as const;

export type StudyModeId = (typeof STUDY_MODES)[number]["id"];

export interface StudyModePickerProps {
  setId: string;
  selectedMode: StudyModeId;
  onSelectMode: (mode: StudyModeId) => void;
}

export function StudyModePicker({
  setId,
  selectedMode,
  onSelectMode,
}: StudyModePickerProps) {
  const router = useRouter();
  const selected = STUDY_MODES.find((m) => m.id === selectedMode);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleStart = (config: StudyConfig) => {
    setSettingsOpen(false);
    const params = new URLSearchParams();
    if (config.shuffle) params.set("shuffle", "true");
    if (config.batchSize) params.set("batchSize", String(config.batchSize));
    const qs = params.toString();
    router.push(
      `/dashboard/study/${setId}/${selectedMode}${qs ? `?${qs}` : ""}`,
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Card
        style={{ width: "100%", maxWidth: 800 }}
        styles={{ body: { padding: "48px 48px 40px" } }}
      >
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            Choose Study Mode
          </Title>
          <Text type="secondary">Select how you want to study</Text>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
          {STUDY_MODES.map((mode) => (
            <Col xs={24} sm={12} key={mode.id}>
              <Card
                hoverable
                onClick={() => onSelectMode(mode.id)}
                style={{
                  cursor: "pointer",
                  border:
                    selectedMode === mode.id
                      ? `2px solid ${mode.color}`
                      : "2px solid transparent",
                  background:
                    selectedMode === mode.id ? `${mode.color}0d` : undefined,
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 8 }}>{mode.icon}</div>
                <Title level={5} style={{ margin: "0 0 4px" }}>
                  {mode.name}
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {mode.desc}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>

        {selected && (
          <Alert
            type="info"
            icon={<span style={{ fontSize: 24 }}>{selected.icon}</span>}
            showIcon
            title={selected.name}
            description={selected.desc}
            style={{ marginBottom: 24 }}
          />
        )}

        <Space style={{ display: "flex", justifyContent: "center" }}>
          <Link href={`/dashboard/sets/${setId}`}>
            <Button size="large">Cancel</Button>
          </Link>
          <Button
            type="primary"
            size="large"
            onClick={() => setSettingsOpen(true)}
          >
            Start {selected?.name}
          </Button>
        </Space>
      </Card>

      {selected && (
        <StudySettingsModal
          open={settingsOpen}
          mode={selected.id}
          onCancel={() => setSettingsOpen(false)}
          onStart={handleStart}
        />
      )}
    </div>
  );
}
