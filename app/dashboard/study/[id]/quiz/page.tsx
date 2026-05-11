"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
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
import { useBatchDeck } from "@/lib/hooks/use-batch-deck";

const { Title, Text } = Typography;

type Question = {
  card: FlashCard;
  choices: string[];
  correct: string;
};

/** Builds questions from cards — preserves card order, only shuffles choices */
function buildQuestions(cards: FlashCard[]): Question[] {
  return cards.map((card) => {
    const others = cards
      .filter((c) => c.id !== card.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((c) => c.back);
    const choices = [...others, card.back].sort(() => Math.random() - 0.5);
    return { card, choices, correct: card.back };
  });
}

function QuizPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const setId = typeof params.id === "string" ? params.id : "";

  const batchSize = searchParams.get("batchSize")
    ? parseInt(searchParams.get("batchSize")!, 10)
    : null;
  const shuffle = searchParams.get("shuffle") === "true";

  const [set, setSet] = useState<StudySet | null>(null);
  const [allCards, setAllCards] = useState<FlashCard[]>([]);

  const batchDeck = useBatchDeck(allCards, batchSize, shuffle);
  const deck = batchDeck.deck;

  // Build questions from current batch deck
  const questions = useMemo(() => {
    if (deck.length < 2) return [];
    return buildQuestions(deck);
  }, [deck]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  // Results for current batch (true = correct)
  const [results, setResults] = useState<boolean[]>([]);
  // Accumulated results across all batches for the final screen
  const [completed, setCompleted] = useState<
    { question: Question; correct: boolean }[]
  >([]);
  const [batchDone, setBatchDone] = useState(false);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(() => Date.now());
  const pendingProgressRef = useRef<UpdateProgressRequest[]>([]);

  useEffect(() => {
    if (!setId) return;
    setsApiClient
      .getById(setId)
      .then((data) => {
        setSet(data);
        setAllCards(data.cards ?? []);
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
      const isCorrect = choice === current.correct;
      pendingProgressRef.current.push({
        cardId: current.card.id,
        setId,
        isCorrect,
      });

      setTimeout(() => {
        const next = [...results, isCorrect];
        setResults(next);
        setSelected(null);

        if (index + 1 >= total) {
          // Flush progress
          const pending = pendingProgressRef.current;
          if (pending.length > 0) {
            progressApiClient.batchUpdate({ updates: pending }).catch(() => {});
            pendingProgressRef.current = [];
          }

          // Accumulate completed questions
          const batchCompleted = questions.map((q, i) => ({
            question: q,
            correct: next[i] ?? false,
          }));
          setCompleted((prev) => [...prev, ...batchCompleted]);

          const wrongCards = questions
            .filter((_, i) => !next[i])
            .map((q) => q.card);

          if (
            batchSize !== null &&
            (batchDeck.hasMoreNewCards || wrongCards.length > 0)
          ) {
            setBatchDone(true);
          } else {
            const duration = Math.round((Date.now() - startTime) / 1000);
            const totalCorrect = [...completed, ...batchCompleted].filter(
              (c) => c.correct,
            ).length;
            studySessionsApiClient
              .create({
                setId,
                mode: "quiz",
                correctCount: totalCorrect,
                totalCount: [...completed, ...batchCompleted].length,
                duration,
              })
              .catch(() => {});
            setFinished(true);
          }
        } else {
          setIndex((i) => i + 1);
        }
      }, 900);
    },
    [
      selected,
      current,
      results,
      index,
      total,
      setId,
      startTime,
      questions,
      batchSize,
      batchDeck.hasMoreNewCards,
      completed,
    ],
  );

  const continueBatch = () => {
    const wrongCards = questions
      .filter((_, i) => !results[i])
      .map((q) => q.card);
    batchDeck.advance(wrongCards);
    setIndex(0);
    setResults([]);
    setBatchDone(false);
  };

  const restart = () => {
    batchDeck.reset();
    setAllCards([]);
    setIndex(0);
    setSelected(null);
    setResults([]);
    setCompleted([]);
    setBatchDone(false);
    setFinished(false);
    pendingProgressRef.current = [];
    if (set) setAllCards(set.cards ?? []);
  };

  // Keyboard shortcut: press 1–4 to choose answer A/B/C/D
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (selected !== null || !current || batchDone || finished) return;
      const idx = ["1", "2", "3", "4"].indexOf(e.key);
      if (idx !== -1 && current.choices[idx] !== undefined) {
        choose(current.choices[idx]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, current, choose, batchDone, finished]);

  if (!set || allCards.length < 2) {
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

  // ── Inter-batch summary ──────────────────────────────────────────────────
  if (batchDone) {
    const batchScore = results.filter(Boolean).length;
    const batchWrong = total - batchScore;
    const wrongCards = questions
      .filter((_, i) => !results[i])
      .map((q) => q.card);

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
          style={{ maxWidth: 480, width: "100%" }}
          styles={{ body: { padding: 40 } }}
        >
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 52, marginBottom: 8 }}>📦</div>
            <Title level={3} style={{ margin: 0 }}>
              Batch {batchDeck.batchNum} / {batchDeck.totalBatches} xong!
            </Title>
            <Text type="secondary">{set.title}</Text>
          </div>

          <Row gutter={12} style={{ marginBottom: 20 }}>
            <Col span={12}>
              <Card style={{ textAlign: "center" }}>
                <Statistic
                  title="Đúng"
                  value={batchScore}
                  styles={{ content: { color: "#16a34a" } }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card style={{ textAlign: "center" }}>
                <Statistic
                  title="Sai"
                  value={batchWrong}
                  styles={{ content: { color: "#dc2626" } }}
                />
              </Card>
            </Col>
          </Row>

          {batchWrong > 0 && (
            <Alert
              type="info"
              showIcon
              title={`${batchWrong} thẻ sai sẽ được lặp lại ở batch tiếp theo`}
              style={{ marginBottom: 20 }}
            />
          )}

          <Row gutter={12}>
            <Col span={12}>
              <Link
                href={`/dashboard/sets/${setId}`}
                style={{ display: "block" }}
              >
                <Button block>Kết thúc</Button>
              </Link>
            </Col>
            <Col span={12}>
              <Button
                type="primary"
                block
                onClick={continueBatch}
                disabled={!batchDeck.hasMoreNewCards && wrongCards.length === 0}
                style={{ background: "#7c3aed", borderColor: "#7c3aed" }}
              >
                Tiếp batch {batchDeck.batchNum + 1} →
              </Button>
            </Col>
          </Row>
        </Card>
      </div>
    );
  }

  // ── Final finished screen ────────────────────────────────────────────────
  if (finished) {
    const totalScore = completed.filter((c) => c.correct).length;
    const totalCount = completed.length;
    const pct =
      totalCount > 0 ? Math.round((totalScore / totalCount) * 100) : 0;

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
            {totalScore} / {totalCount} correct
          </Text>

          <List
            style={{ marginTop: 24, marginBottom: 24, textAlign: "left" }}
            dataSource={completed}
            renderItem={({ question: q, correct }) => (
              <List.Item
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  marginBottom: 4,
                  background: correct ? "#f0fdf4" : "#fef2f2",
                }}
              >
                <Tag
                  color={correct ? "success" : "error"}
                  icon={correct ? <CheckOutlined /> : <CloseOutlined />}
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
              <Button
                type="primary"
                block
                onClick={restart}
                style={{ background: "#7c3aed", borderColor: "#7c3aed" }}
              >
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

  if (questions.length === 0) {
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
          <Text>Loading…</Text>
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
        <div style={{ textAlign: "center" }}>
          <Text style={{ color: "#fff", fontWeight: 600 }}>{set.title}</Text>
          {batchSize && (
            <Text
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: 11,
                display: "block",
              }}
            >
              Batch {batchDeck.batchNum} / {batchDeck.totalBatches}
            </Text>
          )}
        </div>
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

export default function QuizPage() {
  return (
    <Suspense>
      <QuizPageInner />
    </Suspense>
  );
}
