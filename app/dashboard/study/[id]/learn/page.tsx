"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CheckOutlined, CloseOutlined, MinusOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  List,
  Progress,
  Row,
  Statistic,
  Tag,
  Typography,
} from "@/components/antd-ui";
import {
  setsApiClient,
  progressApiClient,
  studySessionsApiClient,
  StudySet,
  Card as FlashCard,
  UpdateProgressRequest,
} from "@/lib/api";

const { Title, Text } = Typography;

type Phase = "preview" | "answer" | "result";
type Verdict = "correct" | "almost" | "wrong";

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function levenshtein(a: string, b: string): number {
  const m = a.length,
    n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

export default function LearnPage() {
  const params = useParams();
  const setId = typeof params.id === "string" ? params.id : "";

  const [set, setSet] = useState<StudySet | null>(null);
  const [deck, setDeck] = useState<FlashCard[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("preview");
  const [input, setInput] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [results, setResults] = useState<
    { card: FlashCard; verdict: Verdict }[]
  >([]);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(() => Date.now());
  const pendingProgressRef = useRef<UpdateProgressRequest[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!setId) return;
    setsApiClient
      .getById(setId)
      .then((data) => {
        setSet(data);
        setDeck([...(data.cards ?? [])].sort(() => Math.random() - 0.5));
      })
      .catch(() => {});
  }, [setId]);

  const current = deck[index];
  const total = deck.length;
  const progressPct = total > 0 ? Math.round((index / total) * 100) : 0;

  const startAnswer = () => {
    setPhase("answer");
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const submitAnswer = () => {
    const userAns = normalize(input);
    const correctAns = normalize(current.back);
    let v: Verdict;
    if (userAns === correctAns) {
      v = "correct";
    } else if (
      correctAns.includes(userAns) ||
      userAns.includes(correctAns) ||
      levenshtein(userAns, correctAns) <= 2
    ) {
      v = "almost";
    } else {
      v = "wrong";
    }
    setVerdict(v);
    setPhase("result");
    pendingProgressRef.current.push({
      cardId: current.id,
      setId,
      isCorrect: v === "correct",
    });
  };

  const advance = () => {
    const newResults = [...results, { card: current, verdict: verdict! }];
    setResults(newResults);
    setInput("");
    setVerdict(null);

    if (index + 1 >= total) {
      setFinished(true);
      const duration = Math.round((Date.now() - startTime) / 1000);
      const correct = newResults.filter((r) => r.verdict === "correct").length;
      const pending = pendingProgressRef.current;
      if (pending.length > 0) {
        progressApiClient.batchUpdate({ updates: pending }).catch(() => {});
        pendingProgressRef.current = [];
      }
      studySessionsApiClient
        .create({
          setId,
          mode: "learn",
          correctCount: correct,
          totalCount: total,
          duration,
        })
        .catch(() => {});
    } else {
      setIndex((i) => i + 1);
      setPhase("preview");
    }
  };

  const restart = () => {
    if (!set) return;
    setDeck([...(set.cards ?? [])].sort(() => Math.random() - 0.5));
    setIndex(0);
    setPhase("preview");
    setInput("");
    setVerdict(null);
    setResults([]);
    setFinished(false);
    pendingProgressRef.current = [];
  };

  const verdictAlertType =
    verdict === "correct"
      ? "success"
      : verdict === "almost"
        ? "warning"
        : "error";

  if (!set || deck.length === 0) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#0d9488,#059669)",
          padding: 24,
        }}
      >
        <Card style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
          <Text>No cards to learn.</Text>
          <br />
          <Link href={`/dashboard/sets/${setId}`}>
            <Button type="link">← Back to set</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (finished) {
    const correct = results.filter((r) => r.verdict === "correct").length;
    const almost = results.filter((r) => r.verdict === "almost").length;
    const wrong = results.filter((r) => r.verdict === "wrong").length;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#0d9488,#059669)",
          padding: 24,
        }}
      >
        <Card
          style={{ maxWidth: 560, width: "100%" }}
          styles={{ body: { padding: 40 } }}
        >
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📖</div>
            <Title level={3}>Round complete!</Title>
            <Text type="secondary">{set.title}</Text>
          </div>

          <Row gutter={12} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card style={{ background: "#f0fdf4", textAlign: "center" }}>
                <Statistic
                  title="Correct"
                  value={correct}
                  valueStyle={{ color: "#16a34a" }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card style={{ background: "#fefce8", textAlign: "center" }}>
                <Statistic
                  title="Almost"
                  value={almost}
                  valueStyle={{ color: "#ca8a04" }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card style={{ background: "#fef2f2", textAlign: "center" }}>
                <Statistic
                  title="Wrong"
                  value={wrong}
                  valueStyle={{ color: "#dc2626" }}
                />
              </Card>
            </Col>
          </Row>

          <List
            size="small"
            style={{ maxHeight: 220, overflowY: "auto", marginBottom: 24 }}
            dataSource={results}
            renderItem={({ card, verdict: v }) => (
              <List.Item
                style={{
                  padding: "6px 12px",
                  background:
                    v === "correct"
                      ? "#f0fdf4"
                      : v === "almost"
                        ? "#fefce8"
                        : "#fef2f2",
                  borderRadius: 8,
                  marginBottom: 4,
                }}
              >
                <Tag
                  icon={
                    v === "correct" ? (
                      <CheckOutlined />
                    ) : v === "almost" ? (
                      <MinusOutlined />
                    ) : (
                      <CloseOutlined />
                    )
                  }
                  color={
                    v === "correct"
                      ? "success"
                      : v === "almost"
                        ? "warning"
                        : "error"
                  }
                />
                <Text strong style={{ marginLeft: 8 }}>
                  {card.front}
                </Text>
                <Text
                  type="secondary"
                  style={{ marginLeft: "auto", fontSize: 12 }}
                >
                  {card.back}
                </Text>
              </List.Item>
            )}
          />

          <Row gutter={12}>
            <Col span={12}>
              <Button
                type="primary"
                block
                onClick={restart}
                style={{ background: "#0d9488", borderColor: "#0d9488" }}
              >
                Study again
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

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg,#0d9488,#059669)",
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

      {/* Progress */}
      <div style={{ padding: "0 24px 16px" }}>
        <Progress
          percent={progressPct}
          showInfo={false}
          strokeColor="#fff"
          trailColor="rgba(255,255,255,0.2)"
          size={["100%", 6]}
        />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ width: "100%", maxWidth: 560 }}>
          {/* Preview phase */}
          {phase === "preview" && (
            <Card styles={{ body: { padding: 40, textAlign: "center" } }}>
              <Text
                type="secondary"
                style={{
                  fontSize: 11,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: 24,
                }}
              >
                Learn this term
              </Text>
              <Title level={2}>{current.front}</Title>
              <div
                style={{
                  background: "#f0fdfa",
                  borderRadius: 12,
                  padding: "16px 24px",
                  marginBottom: 32,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: "#0d9488",
                    textTransform: "uppercase",
                    letterSpacing: 2,
                    display: "block",
                  }}
                >
                  Definition
                </Text>
                <Title
                  level={4}
                  style={{ color: "#134e4a", margin: "8px 0 0" }}
                >
                  {current.back}
                </Title>
              </div>
              <Button
                type="primary"
                size="large"
                block
                onClick={startAnswer}
                style={{ background: "#0d9488", borderColor: "#0d9488" }}
              >
                I know it, test me →
              </Button>
            </Card>
          )}

          {/* Answer phase */}
          {phase === "answer" && (
            <Card styles={{ body: { padding: 40 } }}>
              <Text
                type="secondary"
                style={{
                  fontSize: 11,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  display: "block",
                  textAlign: "center",
                  marginBottom: 16,
                }}
              >
                Type the definition
              </Text>
              <Title
                level={2}
                style={{ textAlign: "center", marginBottom: 32 }}
              >
                {current.front}
              </Title>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && input.trim() && submitAnswer()
                }
                placeholder="Type your answer…"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: 16,
                  border: "2px solid #e5e7eb",
                  borderRadius: 12,
                  outline: "none",
                  marginBottom: 16,
                }}
                onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
              <Button
                type="primary"
                size="large"
                block
                disabled={!input.trim()}
                onClick={submitAnswer}
                style={{ background: "#0d9488", borderColor: "#0d9488" }}
              >
                Check
              </Button>
            </Card>
          )}

          {/* Result phase */}
          {phase === "result" && verdict && (
            <Card styles={{ body: { padding: 40 } }}>
              <Alert
                type={verdictAlertType}
                title={
                  verdict === "correct"
                    ? "✓ Correct!"
                    : verdict === "almost"
                      ? "~ Almost right"
                      : "✗ Incorrect"
                }
                style={{ marginBottom: 24 }}
              />
              <Title
                level={2}
                style={{ textAlign: "center", marginBottom: 24 }}
              >
                {current.front}
              </Title>
              {verdict !== "correct" && (
                <div style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      background: "#f9fafb",
                      borderRadius: 8,
                      padding: "10px 16px",
                      marginBottom: 8,
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Your answer
                    </Text>
                    <div style={{ fontWeight: 500 }}>{input}</div>
                  </div>
                  <div
                    style={{
                      background: "#f0fdfa",
                      borderRadius: 8,
                      padding: "10px 16px",
                    }}
                  >
                    <Text style={{ fontSize: 12, color: "#0d9488" }}>
                      Correct answer
                    </Text>
                    <div style={{ fontWeight: 600, color: "#134e4a" }}>
                      {current.back}
                    </div>
                  </div>
                </div>
              )}
              <Button
                type="primary"
                size="large"
                block
                onClick={advance}
                style={{ background: "#0d9488", borderColor: "#0d9488" }}
              >
                {index + 1 >= total ? "Finish" : "Continue →"}
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
