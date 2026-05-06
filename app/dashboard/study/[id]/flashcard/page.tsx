"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Row,
  Statistic,
  Alert,
  Typography,
} from "@/components/antd-ui";
import {
  FlashcardActiveView,
  FlashcardEmptyView,
  FlashcardFinishedView,
} from "@/components/dashboard/study/flashcard-session";
import {
  setsApiClient,
  studySessionsApiClient,
  StudySet,
  Card as FlashCard,
} from "@/lib/api";
import { useBatchDeck } from "@/lib/hooks/use-batch-deck";

const { Title, Text } = Typography;

function FlashcardPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const setId = typeof params.id === "string" ? params.id : "";

  const batchSize = searchParams.get("batchSize")
    ? parseInt(searchParams.get("batchSize")!, 10)
    : null;
  const shuffle = searchParams.get("shuffle") !== "false"; // default true

  const [set, setSet] = useState<StudySet | null>(null);
  const [allCards, setAllCards] = useState<FlashCard[]>([]);

  const batchDeck = useBatchDeck(allCards, batchSize, shuffle);
  const deck = batchDeck.deck;

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [unknown, setUnknown] = useState<Set<string>>(new Set());
  const [batchDone, setBatchDone] = useState(false);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(() => Date.now());

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

  const current = deck[index];
  const total = deck.length;
  const progressPct = total > 0 ? Math.round((index / total) * 100) : 0;

  const advance = useCallback(() => {
    setFlipped(false);
    if (index + 1 >= total) {
      const duration = Math.round((Date.now() - startTime) / 1000);

      if (batchSize !== null) {
        // Check if we should show inter-batch summary
        setBatchDone(true);
      } else {
        setFinished(true);
        studySessionsApiClient
          .create({
            setId,
            mode: "flashcard",
            correctCount: 0,
            totalCount: total,
            duration,
          })
          .catch(() => {});
      }
    } else {
      setTimeout(() => setIndex((i) => i + 1), 150);
    }
  }, [index, total, setId, startTime, batchSize]);

  const markKnown = () => {
    if (!current) return;
    setKnown((k) => new Set([...k, current.id]));
    advance();
  };

  const markUnknown = () => {
    if (!current) return;
    setUnknown((u) => new Set([...u, current.id]));
    advance();
  };

  const continueBatch = () => {
    const unknownCards = deck.filter((c) => unknown.has(c.id));
    batchDeck.advance(unknownCards);
    setIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setUnknown(new Set());
    setBatchDone(false);
  };

  const finishFromBatch = () => {
    const duration = Math.round((Date.now() - startTime) / 1000);
    studySessionsApiClient
      .create({
        setId,
        mode: "flashcard",
        correctCount: known.size,
        totalCount: total,
        duration,
      })
      .catch(() => {});
    setFinished(true);
    setBatchDone(false);
  };

  const restart = () => {
    batchDeck.reset();
    setAllCards([]);
    setIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setUnknown(new Set());
    setBatchDone(false);
    setFinished(false);
    if (set) setAllCards(set.cards ?? []);
  };

  const restartUnknown = () => {
    const cards = (set?.cards ?? []).filter((c) => unknown.has(c.id));
    batchDeck.reset();
    setAllCards([]);
    setIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setUnknown(new Set());
    setFinished(false);
    setAllCards(cards);
  };

  if (
    !set ||
    (allCards.length > 0 && deck.length === 0 && !batchDone && !finished)
  ) {
    return <FlashcardEmptyView setId={setId} />;
  }

  if (finished) {
    return (
      <FlashcardFinishedView
        setId={setId}
        setTitle={set.title}
        knownCount={known.size}
        unknownCount={unknown.size}
        onRestartUnknown={restartUnknown}
        onRestartAll={restart}
      />
    );
  }

  // ── Inter-batch summary ──────────────────────────────────────────────────
  if (batchDone) {
    const batchUnknownCards = deck.filter((c) => unknown.has(c.id));

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
                  title="Đã thuộc"
                  value={known.size}
                  styles={{ content: { color: "#16a34a" } }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card style={{ textAlign: "center" }}>
                <Statistic
                  title="Chưa thuộc"
                  value={unknown.size}
                  styles={{ content: { color: "#dc2626" } }}
                />
              </Card>
            </Col>
          </Row>

          {unknown.size > 0 && (
            <Alert
              type="info"
              showIcon
              title={`${unknown.size} thẻ chưa thuộc sẽ lặp lại ở batch tiếp theo`}
              style={{ marginBottom: 20 }}
            />
          )}

          <Row gutter={12}>
            <Col span={12}>
              <Button block onClick={finishFromBatch}>
                Kết thúc
              </Button>
            </Col>
            <Col span={12}>
              <Button
                type="primary"
                block
                onClick={continueBatch}
                disabled={
                  !batchDeck.hasMoreNewCards && batchUnknownCards.length === 0
                }
                style={{ background: "#4f46e5", borderColor: "#4f46e5" }}
              >
                Tiếp batch {batchDeck.batchNum + 1} →
              </Button>
            </Col>
          </Row>
        </Card>
      </div>
    );
  }

  if (!current) {
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
          <Text>Không có thẻ hiện tại.</Text>
          <br />
          <Link href={`/dashboard/sets/${setId}`}>
            <Button type="link">← Back to set</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <FlashcardActiveView
      setId={setId}
      setTitle={set.title}
      index={index}
      total={total}
      progressPct={progressPct}
      flipped={flipped}
      current={current}
      knownCount={known.size}
      unknownCount={unknown.size}
      onToggleFlip={() => setFlipped((f) => !f)}
      onMarkUnknown={markUnknown}
      onMarkKnown={markKnown}
    />
  );
}

export default function FlashcardPage() {
  return (
    <Suspense>
      <FlashcardPageInner />
    </Suspense>
  );
}
