"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { CloseOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Progress,
  Row,
  Spin,
  Statistic,
  Typography,
} from "@/components/antd-ui";
import {
  setsApiClient,
  studySessionsApiClient,
  StudySet,
  Card as FlashCard,
} from "@/lib/api";

const { Title, Text } = Typography;

export default function FlashcardPage() {
  const params = useParams();
  const setId = typeof params.id === "string" ? params.id : "";

  const [set, setSet] = useState<StudySet | null>(null);
  const [loading, setLoading] = useState(true);
  const [deck, setDeck] = useState<FlashCard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [unknown, setUnknown] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    if (!setId) return;
    setsApiClient
      .getById(setId)
      .then((data) => {
        setSet(data);
        const shuffled = [...(data.cards ?? [])].sort(
          () => Math.random() - 0.5,
        );
        setDeck(shuffled);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [setId]);

  const current = deck[index];
  const total = deck.length;
  const progressPct = total > 0 ? Math.round((index / total) * 100) : 0;

  const advance = useCallback(() => {
    setFlipped(false);
    if (index + 1 >= total) {
      setFinished(true);
      const duration = Math.round((Date.now() - startTime) / 1000);
      studySessionsApiClient
        .create({
          setId,
          mode: "flashcard",
          correctCount: 0,
          totalCount: total,
          duration,
        })
        .catch(() => {});
    } else {
      setTimeout(() => setIndex((i) => i + 1), 150);
    }
  }, [index, total, setId, startTime]);

  const markKnown = () => {
    setKnown((k) => new Set([...k, current.id]));
    advance();
  };
  const markUnknown = () => {
    setUnknown((u) => new Set([...u, current.id]));
    advance();
  };

  const restart = () => {
    const shuffled = [...(set?.cards ?? [])].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setUnknown(new Set());
    setFinished(false);
  };

  const restartUnknown = () => {
    const cards = (set?.cards ?? []).filter((c) => unknown.has(c.id));
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setUnknown(new Set());
    setFinished(false);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#4f46e5,#2563eb)",
        }}
      >
        <Spin size="large" tip="Loading…" />
      </div>
    );
  }

  if (!set || deck.length === 0) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#4f46e5,#2563eb)",
          padding: 24,
        }}
      >
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

  if (finished) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#4f46e5,#2563eb)",
          padding: 24,
        }}
      >
        <Card
          style={{ maxWidth: 480, width: "100%", textAlign: "center" }}
          styles={{ body: { padding: 40 } }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <Title level={3}>Round complete!</Title>
          <Text type="secondary">{set.title}</Text>

          <Row gutter={16} style={{ margin: "32px 0" }}>
            <Col span={12}>
              <Card style={{ background: "#f0fdf4" }}>
                <Statistic
                  title="Got it"
                  value={known.size}
                  valueStyle={{ color: "#16a34a" }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card style={{ background: "#fef2f2" }}>
                <Statistic
                  title="Still learning"
                  value={unknown.size}
                  valueStyle={{ color: "#dc2626" }}
                />
              </Card>
            </Col>
          </Row>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {unknown.size > 0 && (
              <Button type="primary" block onClick={restartUnknown}>
                Study {unknown.size} missed cards
              </Button>
            )}
            <Button block onClick={restart}>
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

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg,#4f46e5,#2563eb)",
      }}
    >
      {/* Header */}
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
        <Text style={{ color: "#fff", fontWeight: 600 }}>{set.title}</Text>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
          {index + 1} / {total}
        </Text>
      </div>

      {/* Progress bar */}
      <div style={{ padding: "0 24px 8px" }}>
        <Progress
          percent={progressPct}
          showInfo={false}
          strokeColor="#fff"
          trailColor="rgba(255,255,255,0.2)"
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
            {known.size} known
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
            {unknown.size} learning
          </Text>
        </div>
      </div>

      {/* Flip card */}
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
          onClick={() => setFlipped((f) => !f)}
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
            {/* Front */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backfaceVisibility: "hidden",
                borderRadius: 16,
                background: "#fff",
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
            {/* Back */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backfaceVisibility: "hidden",
                borderRadius: 16,
                background: "#eef2ff",
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
                  color: "#818cf8",
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
                style={{ textAlign: "center", color: "#3730a3", margin: 0 }}
              >
                {current.back}
              </Title>
            </div>
          </div>
        </div>

        {/* Action buttons shown after flip */}
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
          <Button danger size="large" onClick={markUnknown}>
            ✗ Still learning
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={markKnown}
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
