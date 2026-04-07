"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { CloseOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Row,
  Spin,
  Statistic,
  Tag,
  Typography,
} from "@/components/antd-ui";
import {
  setsApiClient,
  studySessionsApiClient,
  StudySet,
  Card as FlashCard,
} from "@/lib/api";

const { Title, Text } = Typography;

type Tile = {
  key: string;
  cardId: string;
  text: string;
  side: "front" | "back";
};

type TileState = "idle" | "selected" | "matched" | "wrong";

const MATCH_COUNT = 6;

function buildTiles(cards: FlashCard[]): Tile[] {
  const pool = [...cards].sort(() => Math.random() - 0.5).slice(0, MATCH_COUNT);
  const fronts: Tile[] = pool.map((c) => ({
    key: `f-${c.id}`,
    cardId: c.id,
    text: c.front,
    side: "front",
  }));
  const backs: Tile[] = pool.map((c) => ({
    key: `b-${c.id}`,
    cardId: c.id,
    text: c.back,
    side: "back",
  }));
  return [...fronts, ...backs].sort(() => Math.random() - 0.5);
}

export default function MatchPage() {
  const params = useParams();
  const setId = typeof params.id === "string" ? params.id : "";

  const [set, setSet] = useState<StudySet | null>(null);
  const [loading, setLoading] = useState(true);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [tileStates, setTileStates] = useState<Record<string, TileState>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (!setId) return;
    setsApiClient
      .getById(setId)
      .then((data) => {
        setSet(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [setId]);

  const initGame = useCallback((cards: FlashCard[]) => {
    const t = buildTiles(cards);
    const states: Record<string, TileState> = {};
    t.forEach((tile) => (states[tile.key] = "idle"));
    setTiles(t);
    setTileStates(states);
    setSelected(null);
    setMistakes(0);
    setElapsed(0);
    setFinished(false);
    setRunning(true);
    setStartTime(Date.now());
  }, []);

  useEffect(() => {
    if (set && (set.cards ?? []).length >= 2) initGame(set.cards ?? []);
  }, [set, initGame]);

  useEffect(() => {
    if (!running || finished) return;
    const id = setInterval(() => {
      if (startTime) setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, [running, finished, startTime]);

  const handleTile = useCallback(
    (key: string) => {
      if (tileStates[key] === "matched" || tileStates[key] === "selected")
        return;

      if (selected === null) {
        setTileStates((s) => ({ ...s, [key]: "selected" }));
        setSelected(key);
        return;
      }

      const tileA = tiles.find((t) => t.key === selected)!;
      const tileB = tiles.find((t) => t.key === key)!;
      const isMatch =
        tileA.cardId === tileB.cardId && tileA.side !== tileB.side;

      if (isMatch) {
        setTileStates((s) => ({
          ...s,
          [selected]: "matched",
          [key]: "matched",
        }));
        setSelected(null);
        const matchedCount = Object.values({
          ...tileStates,
          [selected]: "matched",
          [key]: "matched",
        }).filter((v) => v === "matched").length;
        if (matchedCount === tiles.length) {
          setFinished(true);
          setRunning(false);
          const dur = startTime
            ? Math.floor((Date.now() - startTime) / 1000)
            : elapsed;
          studySessionsApiClient
            .create({
              setId,
              mode: "match",
              correctCount: Math.floor(tiles.length / 2),
              totalCount: Math.floor(tiles.length / 2),
              duration: dur,
            })
            .catch(() => {});
        }
      } else {
        setMistakes((m) => m + 1);
        setTileStates((s) => ({ ...s, [selected]: "wrong", [key]: "wrong" }));
        setTimeout(() => {
          setTileStates((s) => ({
            ...s,
            [selected]: s[selected] === "matched" ? "matched" : "idle",
            [key]: s[key] === "matched" ? "matched" : "idle",
          }));
          setSelected(null);
        }, 700);
      }
    },
    [selected, tiles, tileStates, setId, elapsed, startTime],
  );

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#f97316,#ea580c)",
        }}
      >
        <Spin size="large" tip="Loading…" />
      </div>
    );
  }

  if (!set || (set.cards ?? []).length < 2) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#f97316,#ea580c)",
          padding: 24,
        }}
      >
        <Card style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
          <Text>Need at least 2 cards for matching.</Text>
          <br />
          <Link href={`/dashboard/sets/${setId}`}>
            <Button type="link">← Back to set</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (finished) {
    const star = mistakes === 0 ? "⭐⭐⭐" : mistakes <= 2 ? "⭐⭐" : "⭐";
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#f97316,#ea580c)",
          padding: 24,
        }}
      >
        <Card
          style={{ maxWidth: 480, width: "100%", textAlign: "center" }}
          styles={{ body: { padding: 40 } }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>{star}</div>
          <Title level={3}>All matched!</Title>
          <Text type="secondary">{set.title}</Text>

          <Row gutter={16} style={{ margin: "32px 0" }}>
            <Col span={12}>
              <Card style={{ background: "#fff7ed" }}>
                <Statistic
                  title="Time"
                  value={formatTime(elapsed)}
                  valueStyle={{ color: "#ea580c", fontSize: 28 }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card style={{ background: "#fef2f2" }}>
                <Statistic
                  title="Mistakes"
                  value={mistakes}
                  valueStyle={{ color: "#dc2626" }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Button
                type="primary"
                block
                onClick={() => initGame(set.cards ?? [])}
                style={{ background: "#ea580c", borderColor: "#ea580c" }}
              >
                Play again
              </Button>
            </Col>
            <Col span={12}>
              <Link
                href={`/dashboard/sets/${setId}`}
                style={{ display: "block" }}
              >
                <Button block>Back to set</Button>
              </Link>
            </Col>
          </Row>
        </Card>
      </div>
    );
  }

  const tileStyle = (key: string): React.CSSProperties => {
    const state = tileStates[key] ?? "idle";
    const base: React.CSSProperties = {
      borderRadius: 12,
      padding: "18px 12px",
      textAlign: "center",
      fontWeight: 600,
      fontSize: 14,
      cursor: "pointer",
      userSelect: "none",
      border: "2px solid",
      transition: "all 0.15s",
      wordBreak: "break-word",
      minHeight: 72,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    };
    switch (state) {
      case "idle":
        return {
          ...base,
          background: "#fff",
          borderColor: "#e5e7eb",
          color: "#111827",
        };
      case "selected":
        return {
          ...base,
          background: "#f97316",
          borderColor: "#f97316",
          color: "#fff",
          transform: "scale(1.04)",
          boxShadow: "0 4px 16px rgba(249,115,22,0.4)",
        };
      case "matched":
        return {
          ...base,
          background: "#dcfce7",
          borderColor: "#86efac",
          color: "#166534",
          opacity: 0.5,
          cursor: "default",
        };
      case "wrong":
        return {
          ...base,
          background: "#fee2e2",
          borderColor: "#fca5a5",
          color: "#991b1b",
          animation: "shake 0.3s ease",
        };
      default:
        return base;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg,#f97316,#ea580c)",
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
        <Tag color="default" style={{ fontFamily: "monospace", fontSize: 13 }}>
          {formatTime(elapsed)}
        </Tag>
      </div>

      <div style={{ textAlign: "center", padding: "0 24px 12px" }}>
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
          Match each term with its definition · {mistakes} mistake
          {mistakes !== 1 ? "s" : ""}
        </Text>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            width: "100%",
            maxWidth: 640,
          }}
        >
          {tiles.map((tile) => (
            <div
              key={tile.key}
              style={tileStyle(tile.key)}
              onClick={() => handleTile(tile.key)}
            >
              {tile.text}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
