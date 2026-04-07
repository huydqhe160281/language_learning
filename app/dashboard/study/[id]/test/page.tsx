"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CloseOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Progress,
  Radio,
  Row,
  Spin,
  Statistic,
  Typography,
} from "@/components/antd-ui";
import {
  Card as FlashCard,
  progressApiClient,
  setsApiClient,
  studySessionsApiClient,
  StudySet,
  UpdateProgressRequest,
} from "@/lib/api";

const { Title, Text } = Typography;

type QuestionType = "mcq" | "truefalse" | "written";

type BaseQuestion = { id: string; type: QuestionType; card: FlashCard };
type McqQuestion = BaseQuestion & {
  type: "mcq";
  prompt: string;
  choices: string[];
  correct: string;
};
type TrueFalseQuestion = BaseQuestion & {
  type: "truefalse";
  prompt: string;
  statement: string;
  correct: boolean;
};
type WrittenQuestion = BaseQuestion & {
  type: "written";
  prompt: string;
  correct: string;
};
type Question = McqQuestion | TrueFalseQuestion | WrittenQuestion;

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function shuffle<T>(arr: T[]) {
  return [...arr].sort(() => Math.random() - 0.5);
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

function buildQuestions(cards: FlashCard[]): Question[] {
  const deck = shuffle(cards);
  const otherBacks = (cardId: string) =>
    shuffle(cards.filter((c) => c.id !== cardId).map((c) => c.back)).slice(
      0,
      3,
    );

  return deck.map((card) => {
    const types: QuestionType[] = ["mcq", "truefalse", "written"];
    const type = types[Math.floor(Math.random() * types.length)];

    if (type === "mcq") {
      const choices = shuffle([...otherBacks(card.id), card.back]);
      return {
        id: `mcq-${card.id}`,
        type: "mcq" as const,
        card,
        prompt: "Choose the correct definition",
        choices,
        correct: card.back,
      };
    }
    if (type === "truefalse") {
      const makeTrue = Math.random() < 0.5 || cards.length < 2;
      const wrong = otherBacks(card.id)[0] ?? card.back;
      const statement = makeTrue ? card.back : wrong;
      return {
        id: `tf-${card.id}`,
        type: "truefalse" as const,
        card,
        prompt: "True or false?",
        statement,
        correct: statement === card.back,
      };
    }
    return {
      id: `wr-${card.id}`,
      type: "written" as const,
      card,
      prompt: "Type the definition",
      correct: card.back,
    };
  });
}

export default function TestPage() {
  const params = useParams();
  const setId = typeof params.id === "string" ? params.id : "";

  const [set, setSet] = useState<StudySet | null>(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(() => Date.now());

  const [selected, setSelected] = useState<string | null>(null);
  const [tfAnswer, setTfAnswer] = useState<boolean | null>(null);
  const [written, setWritten] = useState("");
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const pendingProgressRef = useRef<UpdateProgressRequest[]>([]);

  useEffect(() => {
    if (!setId) return;
    setsApiClient
      .getById(setId)
      .then((data) => {
        setSet(data);
        const cards = data.cards ?? [];
        if (cards.length >= 2) setQuestions(buildQuestions(cards));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [setId]);

  const current = questions[index];
  const total = questions.length;
  const progressPct = total > 0 ? Math.round((index / total) * 100) : 0;

  const correctCount = useMemo(
    () => pendingProgressRef.current.filter((u) => u.isCorrect).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [finished],
  );

  const resetAnswerState = () => {
    setSelected(null);
    setTfAnswer(null);
    setWritten("");
    setChecked(false);
    setIsCorrect(null);
  };

  const checkAnswer = () => {
    if (!current || checked) return;
    let ok = false;
    if (current.type === "mcq")
      ok = selected !== null && selected === current.correct;
    else if (current.type === "truefalse")
      ok = tfAnswer !== null && tfAnswer === current.correct;
    else {
      const user = normalize(written);
      const correct = normalize(current.correct);
      ok =
        user.length > 0 &&
        (user === correct || levenshtein(user, correct) <= 2);
    }
    setIsCorrect(ok);
    setChecked(true);
    pendingProgressRef.current.push({
      cardId: current.card.id,
      setId,
      isCorrect: ok,
    });
  };

  const next = () => {
    if (!current) return;
    if (index + 1 >= total) {
      setFinished(true);
      const duration = Math.round((Date.now() - startTime) / 1000);
      const pending = pendingProgressRef.current;
      if (pending.length > 0)
        progressApiClient.batchUpdate({ updates: pending }).catch(() => {});
      studySessionsApiClient
        .create({
          setId,
          mode: "test",
          correctCount: pending.filter((p) => p.isCorrect).length,
          totalCount: total,
          duration,
        })
        .catch(() => {});
      return;
    }
    setIndex((i) => i + 1);
    resetAnswerState();
  };

  const restart = () => {
    if (!set) return;
    const cards = set.cards ?? [];
    setQuestions(cards.length >= 2 ? buildQuestions(cards) : []);
    setIndex(0);
    setFinished(false);
    pendingProgressRef.current = [];
    resetAnswerState();
  };

  const canCheck =
    current?.type === "mcq"
      ? selected !== null
      : current?.type === "truefalse"
        ? tfAnswer !== null
        : written.trim().length > 0;

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#334155,#1e293b)",
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
          background: "linear-gradient(135deg,#334155,#1e293b)",
          padding: 24,
        }}
      >
        <Card style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
          <Text>Need at least 2 cards to start a test.</Text>
          <br />
          <Link href={`/dashboard/sets/${setId}`}>
            <Button type="link">← Back to set</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (finished) {
    const pct =
      total === 0 ? 0 : Math.round((correctCount / Math.max(1, total)) * 100);
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#334155,#1e293b)",
          padding: 24,
        }}
      >
        <Card
          style={{ maxWidth: 480, width: "100%", textAlign: "center" }}
          styles={{ body: { padding: 40 } }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>📝</div>
          <Title level={3}>Test done!</Title>
          <Text type="secondary">{set.title}</Text>

          <Row gutter={16} style={{ margin: "32px 0" }}>
            <Col span={12}>
              <Card>
                <Statistic
                  title="Score"
                  value={pct}
                  suffix="%"
                  valueStyle={{
                    color: "#334155",
                    fontSize: 40,
                    fontWeight: 700,
                  }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <Statistic
                  title="Correct"
                  value={`${correctCount} / ${total}`}
                  valueStyle={{ color: "#16a34a" }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Button
                type="primary"
                block
                onClick={restart}
                style={{ background: "#334155", borderColor: "#334155" }}
              >
                Retake test
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

  const typeBadge: Record<QuestionType, { label: string; color: string }> = {
    mcq: { label: "Multiple Choice", color: "#7c3aed" },
    truefalse: { label: "True / False", color: "#0d9488" },
    written: { label: "Written", color: "#ea580c" },
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg,#334155,#1e293b)",
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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ width: "100%", maxWidth: 600 }}>
          {/* Prompt card */}
          <Card
            styles={{ body: { padding: 32, textAlign: "center" } }}
            style={{ marginBottom: 16 }}
          >
            <div style={{ marginBottom: 16 }}>
              <span
                style={{
                  background: typeBadge[current.type].color,
                  color: "#fff",
                  padding: "2px 10px",
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                {typeBadge[current.type].label}
              </span>
            </div>
            <Text
              type="secondary"
              style={{
                fontSize: 11,
                letterSpacing: 3,
                textTransform: "uppercase",
                display: "block",
                marginBottom: 12,
              }}
            >
              {current.prompt}
            </Text>
            <Title level={2} style={{ margin: 0 }}>
              {current.card.front}
            </Title>

            {current.type === "truefalse" && (
              <div
                style={{
                  marginTop: 20,
                  background: "#f8fafc",
                  borderRadius: 10,
                  padding: "12px 20px",
                }}
              >
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Statement
                </Text>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "#1e293b",
                    marginTop: 4,
                  }}
                >
                  {current.statement}
                </div>
              </div>
            )}
          </Card>

          {/* MCQ choices */}
          {current.type === "mcq" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 16,
              }}
            >
              {current.choices.map((choice) => {
                let type: "primary" | "default" = "default";
                let danger = false;
                if (checked) {
                  if (choice === current.correct) type = "primary";
                  else if (choice === selected) danger = true;
                }
                return (
                  <Button
                    key={choice}
                    block
                    size="large"
                    type={type}
                    danger={danger}
                    disabled={
                      checked &&
                      choice !== current.correct &&
                      choice !== selected
                    }
                    onClick={() => !checked && setSelected(choice)}
                    style={{
                      textAlign: "left",
                      height: "auto",
                      padding: "14px 20px",
                      whiteSpace: "normal",
                      ...(selected === choice && !checked
                        ? { borderColor: "#334155", background: "#f1f5f9" }
                        : {}),
                    }}
                  >
                    {choice}
                  </Button>
                );
              })}
            </div>
          )}

          {/* True/False */}
          {current.type === "truefalse" && (
            <div style={{ marginBottom: 16 }}>
              <Radio.Group
                value={tfAnswer}
                onChange={(e) =>
                  !checked && setTfAnswer(e.target.value as boolean)
                }
                optionType="button"
                buttonStyle="solid"
                size="large"
                style={{
                  width: "100%",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                {[
                  { label: "True", value: true },
                  { label: "False", value: false },
                ].map((opt) => (
                  <Radio.Button
                    key={String(opt.value)}
                    value={opt.value}
                    disabled={checked}
                    style={{
                      textAlign: "center",
                      borderRadius: 12,
                      fontSize: 16,
                      fontWeight: 600,
                      ...(checked && opt.value === current.correct
                        ? {
                            background: "#16a34a",
                            borderColor: "#16a34a",
                            color: "#fff",
                          }
                        : checked &&
                            tfAnswer === opt.value &&
                            opt.value !== current.correct
                          ? {
                              background: "#dc2626",
                              borderColor: "#dc2626",
                              color: "#fff",
                            }
                          : {}),
                    }}
                  >
                    {opt.label}
                  </Radio.Button>
                ))}
              </Radio.Group>
            </div>
          )}

          {/* Written */}
          {current.type === "written" && (
            <Card
              styles={{ body: { padding: 24 } }}
              style={{ marginBottom: 16 }}
            >
              <Text
                type="secondary"
                style={{ fontSize: 12, display: "block", marginBottom: 8 }}
              >
                Your answer
              </Text>
              <input
                value={written}
                onChange={(e) => setWritten(e.target.value)}
                disabled={checked}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canCheck && !checked) checkAnswer();
                }}
                placeholder="Type the definition…"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: 16,
                  border: "2px solid #e5e7eb",
                  borderRadius: 12,
                  outline: "none",
                  background: checked ? "#f9fafb" : "#fff",
                  marginBottom: 16,
                }}
                onFocus={(e) => (e.target.style.borderColor = "#334155")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
              {checked && (
                <Alert
                  type={isCorrect ? "success" : "error"}
                  message={isCorrect ? "✓ Correct" : "✗ Incorrect"}
                  description={
                    !isCorrect
                      ? `Correct answer: ${current.correct}`
                      : undefined
                  }
                />
              )}
            </Card>
          )}

          {/* Feedback for mcq / truefalse after check */}
          {checked && current.type !== "written" && (
            <Alert
              type={isCorrect ? "success" : "error"}
              message={
                isCorrect
                  ? "✓ Correct!"
                  : `✗ Correct answer: ${current.card.back}`
              }
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Action button */}
          {!checked ? (
            <Button
              type="primary"
              block
              size="large"
              disabled={!canCheck}
              onClick={checkAnswer}
              style={{ background: "#334155", borderColor: "#334155" }}
            >
              Check
            </Button>
          ) : (
            <Button
              type="primary"
              block
              size="large"
              onClick={next}
              style={{ background: "#334155", borderColor: "#334155" }}
            >
              {index + 1 >= total ? "Finish" : "Next →"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
