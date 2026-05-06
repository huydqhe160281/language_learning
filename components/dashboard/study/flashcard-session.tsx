"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { CloseOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Progress,
  Row,
  Statistic,
  Typography,
} from "@/components/antd-ui";
import type { Card as FlashCard } from "@/lib/api";
import { useTheme } from "@/lib/theme-context";

const { Title, Text } = Typography;

const GRADIENT_PAGE: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg,#4f46e5,#2563eb)",
};

export function FlashcardEmptyView({ setId }: { setId: string }) {
  return (
    <div style={{ ...GRADIENT_PAGE, padding: 24 }}>
      <Card style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
        <Text>No cards in this set.</Text>
        <br />
        <Link href={`/dashboard/sets/${setId}`}>
          <Button type="link">← Back to set</Button>
        </Link>
      </Card>
    </div>
  );
}

export interface FlashcardFinishedViewProps {
  setId: string;
  setTitle: string;
  knownCount: number;
  unknownCount: number;
  onRestartUnknown: () => void;
  onRestartAll: () => void;
}

export function FlashcardFinishedView({
  setId,
  setTitle,
  knownCount,
  unknownCount,
  onRestartUnknown,
  onRestartAll,
}: FlashcardFinishedViewProps) {
  return (
    <div style={{ ...GRADIENT_PAGE, padding: 24 }}>
      <Card
        style={{ maxWidth: 480, width: "100%", textAlign: "center" }}
        styles={{ body: { padding: 40 } }}
      >
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <Title level={3}>Round complete!</Title>
        <Text type="secondary">{setTitle}</Text>

        <Row gutter={16} style={{ margin: "32px 0" }}>
          <Col span={12}>
            <Card>
              <Statistic
                title="Got it"
                value={knownCount}
                styles={{ content: { color: "#16a34a" } }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Statistic
                title="Still learning"
                value={unknownCount}
                styles={{ content: { color: "#dc2626" } }}
              />
            </Card>
          </Col>
        </Row>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {unknownCount > 0 && (
            <Button type="primary" block onClick={onRestartUnknown}>
              Study {unknownCount} missed cards
            </Button>
          )}
          <Button block onClick={onRestartAll}>
            Restart all
          </Button>
          <Link href={`/dashboard/sets/${setId}`}>
            <Button type="link" block>
              Back to set
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export interface FlashcardActiveViewProps {
  setId: string;
  setTitle: string;
  index: number;
  total: number;
  progressPct: number;
  flipped: boolean;
  current: FlashCard;
  knownCount: number;
  unknownCount: number;
  onToggleFlip: () => void;
  onMarkUnknown: () => void;
  onMarkKnown: () => void;
}

export function FlashcardActiveView({
  setId,
  setTitle,
  index,
  total,
  progressPct,
  flipped,
  current,
  knownCount,
  unknownCount,
  onToggleFlip,
  onMarkUnknown,
  onMarkKnown,
}: FlashcardActiveViewProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg,#4f46e5,#2563eb)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          color: "#fff",
        }}
      >
        <Link href={`/dashboard/sets/${setId}`}>
          <Button
            type="text"
            icon={<CloseOutlined />}
            style={{ color: "#fff" }}
          />
        </Link>
        <Text style={{ color: "#fff", fontWeight: 600 }}>{setTitle}</Text>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
          {index + 1} / {total}
        </Text>
      </div>

      <div style={{ padding: "0 24px 8px" }}>
        <Progress
          percent={progressPct}
          showInfo={false}
          strokeColor="#fff"
          railColor="rgba(255,255,255,0.2)"
          size={["100%", 6]}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 4,
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
            {knownCount} known
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
            {unknownCount} learning
          </Text>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 640,
            perspective: 1200,
            cursor: "pointer",
          }}
          onClick={onToggleFlip}
        >
          <div
            style={{
              position: "relative",
              minHeight: 280,
              transition: "transform 0.5s",
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                backfaceVisibility: "hidden",
                borderRadius: 16,
                background: "var(--card)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 40,
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              }}
            >
              <Text
                type="secondary"
                style={{
                  fontSize: 11,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                Term
              </Text>
              <Title level={2} style={{ textAlign: "center", margin: 0 }}>
                {current.front}
              </Title>
              <Text type="secondary" style={{ marginTop: 24, fontSize: 13 }}>
                Click to flip
              </Text>
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                backfaceVisibility: "hidden",
                borderRadius: 16,
                background: isDark ? "#1e1b4b" : "#eef2ff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 40,
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                transform: "rotateY(180deg)",
              }}
            >
              <Text
                style={{
                  color: isDark ? "#a5b4fc" : "#818cf8",
                  fontSize: 11,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                Definition
              </Text>
              <Title
                level={2}
                style={{
                  textAlign: "center",
                  color: isDark ? "#c7d2fe" : "#3730a3",
                  margin: 0,
                }}
              >
                {current.back}
              </Title>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 32,
            display: "flex",
            gap: 16,
            opacity: flipped ? 1 : 0,
            pointerEvents: flipped ? "auto" : "none",
            transition: "opacity 0.3s",
          }}
        >
          <Button danger size="large" onClick={onMarkUnknown}>
            ✗ Still learning
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={onMarkKnown}
            style={{ background: "#16a34a", borderColor: "#16a34a" }}
          >
            ✓ Got it
          </Button>
        </div>

        <Text
          style={{
            marginTop: 24,
            color: "rgba(255,255,255,0.4)",
            fontSize: 13,
          }}
        >
          Space to flip · ← Still learning · → Got it
        </Text>
      </div>
    </div>
  );
}
