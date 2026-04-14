"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  List,
  Progress,
  Row,
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

type Question = {
  card: FlashCard;
  choices: string[];
  correct: string;
};

function buildQuestions(cards: FlashCard[]): Question[] {
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  return shuffled.map((card) => {
    const others = cards
      .filter((c) => c.id !== card.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((c) => c.back);
    const choices = [...others, card.back].sort(() => Math.random() - 0.5);
    return { card, choices, correct: card.back };
  });
}

export default function QuizPage() {
  const params = useParams();
  const setId = typeof params.id === "string" ? params.id : "";

  const [set, setSet] = useState<StudySet | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(() => Date.now());
  const pendingProgressRef = useRef<UpdateProgressRequest[]>([]);

  useEffect(() => {
    if (!setId) return;
    setsApiClient
      .getById(setId)
      .then((data) => {
        setSet(data);
        const cards = data.cards ?? [];
        if (cards.length >= 2) setQuestions(buildQuestions(cards));
      })
      .catch(() => {});
  }, [setId]);

  const current = questions[index];
  const total = questions.length;
  const score = results.filter(Boolean).length;
  const progressPct = total > 0 ? Math.round((index / total) * 100) : 0;

  const choose = useCallback(
    (choice: string) => {
      if (selected !== null) return;
      setSelected(choice);
      const correct = choice === current.correct;
      pendingProgressRef.current.push({
        cardId: current.card.id,
        setId,
        isCorrect: correct,
      });

      setTimeout(() => {
        const next = [...results, correct];
        setResults(next);
        setSelected(null);
        if (index + 1 >= total) {
          setFinished(true);
          const duration = Math.round((Date.now() - startTime) / 1000);
          const pending = pendingProgressRef.current;
          if (pending.length > 0) {
            progressApiClient.batchUpdate({ updates: pending }).catch(() => {});
            pendingProgressRef.current = [];
          }
          studySessionsApiClient
            .create({
              setId,
              mode: "quiz",
              correctCount: next.filter(Boolean).length,
              totalCount: total,
              duration,
            })
            .catch(() => {});
        } else {
          setIndex((i) => i + 1);
        }
      }, 900);
    },
    [selected, current, results, index, total, setId, startTime],
  );

  const restart = () => {
    if (!set) return;
    setQuestions(buildQuestions(set.cards ?? []));
    setIndex(0);
    setSelected(null);
    setResults([]);
    setFinished(false);
    pendingProgressRef.current = [];
  };

  if (!set || (set.cards ?? []).length < 2) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
          padding: 24,
        }}
      >
        <Card style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
          <Text>Need at least 2 cards to start a quiz.</Text>
          <br />
          <Link href={`/dashboard/sets/${setId}`}>
            <Button type="link">← Back to set</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((score / total) * 100);
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
          padding: 24,
        }}
      >
        <Card
          style={{ maxWidth: 480, width: "100%", textAlign: "center" }}
          styles={{ body: { padding: 40 } }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>
            {pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "💪"}
          </div>
          <Title level={3}>Quiz done!</Title>
          <Text type="secondary">{set.title}</Text>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "#7c3aed",
              margin: "16px 0 8px",
            }}
          >
            {pct}%
          </div>
          <Text type="secondary">
            {score} / {total} correct
          </Text>

          <List
            style={{ marginTop: 24, marginBottom: 24, textAlign: "left" }}
            dataSource={questions}
            renderItem={(q, i) => (
              <List.Item
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  marginBottom: 4,
                  background: results[i] ? "#f0fdf4" : "#fef2f2",
                }}
              >
                <Tag
                  color={results[i] ? "success" : "error"}
                  icon={results[i] ? <CheckOutlined /> : <CloseOutlined />}
                />
                <Text strong style={{ marginLeft: 8 }}>
                  {q.card.front}
                </Text>
                <Text
                  type="secondary"
                  style={{ marginLeft: "auto", fontSize: 12 }}
                >
                  {q.card.back}
                </Text>
              </List.Item>
            )}
          />

          <Row gutter={12}>
            <Col span={12}>
              <Button type="primary" block onClick={restart}>
                Retake quiz
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
        background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
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
            {score} correct
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
            {results.length - score} wrong
          </Text>
        </div>
      </div>

      {/* Question */}
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
        <div style={{ width: "100%", maxWidth: 600 }}>
          <Card
            style={{ marginBottom: 24 }}
            styles={{ body: { padding: 32, textAlign: "center" } }}
          >
            <Text
              type="secondary"
              style={{
                fontSize: 11,
                letterSpacing: 3,
                textTransform: "uppercase",
                display: "block",
                marginBottom: 16,
              }}
            >
              What is the definition of…
            </Text>
            <Title level={2} style={{ margin: 0 }}>
              {current.card.front}
            </Title>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {current.choices.map((choice) => {
              let type: "primary" | "default" | "dashed" = "default";
              let danger = false;
              let ghost = false;

              if (selected !== null) {
                if (choice === current.correct) {
                  type = "primary";
                } else if (choice === selected) {
                  danger = true;
                } else {
                  ghost = true;
                }
              }

              return (
                <Button
                  key={choice}
                  block
                  size="large"
                  type={type}
                  danger={danger}
                  ghost={ghost}
                  disabled={
                    selected !== null &&
                    choice !== current.correct &&
                    choice !== selected
                  }
                  onClick={() => choose(choice)}
                  style={{
                    textAlign: "left",
                    height: "auto",
                    padding: "14px 20px",
                    whiteSpace: "normal",
                  }}
                >
                  {choice}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
