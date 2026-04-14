"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button, Card, Typography } from "@/components/antd-ui";
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

const { Text } = Typography;

export default function FlashcardPage() {
  const params = useParams();
  const setId = typeof params.id === "string" ? params.id : "";

  const [set, setSet] = useState<StudySet | null>(null);
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
      })
      .catch(() => {});
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
    if (!current) return;
    setKnown((k) => new Set([...k, current.id]));
    advance();
  };
  const markUnknown = () => {
    if (!current) return;
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

  if (!set || deck.length === 0) {
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
