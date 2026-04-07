"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  setsApiClient,
  studySessionsApiClient,
  StudySet,
  Card,
} from "@/lib/api";

export default function FlashcardPage() {
  const params = useParams();
  const setId = typeof params.id === "string" ? params.id : "";

  const [set, setSet] = useState<StudySet | null>(null);
  const [loading, setLoading] = useState(true);

  // deck = shuffled cards; index = current position
  const [deck, setDeck] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [unknown, setUnknown] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(Date.now());

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
  const progress = total > 0 ? Math.round((index / total) * 100) : 0;

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 to-blue-500">
        <p className="text-xl text-white">Loading…</p>
      </div>
    );
  }

  if (!set || deck.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 to-blue-500 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-10 text-center">
          <p className="mb-6 text-gray-600">No cards in this set.</p>
          <Link
            href={`/dashboard/sets/${setId}`}
            className="text-blue-600 hover:underline"
          >
            ← Back to set
          </Link>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 to-blue-500 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-10 text-center shadow-2xl">
          <div className="mb-4 text-6xl">🎉</div>
          <h2 className="mb-2 text-3xl font-bold text-gray-900">
            Round complete!
          </h2>
          <p className="mb-8 text-gray-500">{set.title}</p>
          <div className="mb-8 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-green-50 p-4">
              <p className="text-3xl font-bold text-green-600">{known.size}</p>
              <p className="mt-1 text-sm text-green-700">Got it</p>
            </div>
            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-3xl font-bold text-red-500">{unknown.size}</p>
              <p className="mt-1 text-sm text-red-600">Still learning</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {unknown.size > 0 && (
              <button
                onClick={restartUnknown}
                className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Study {unknown.size} missed cards
              </button>
            )}
            <button
              onClick={restart}
              className="w-full rounded-xl border-2 border-gray-200 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Restart all
            </button>
            <Link href={`/dashboard/sets/${setId}`}>
              <button className="w-full rounded-xl py-3 font-semibold text-blue-600 transition hover:bg-blue-50">
                Back to set
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-indigo-600 to-blue-500">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 text-white">
        <Link
          href={`/dashboard/sets/${setId}`}
          className="transition hover:opacity-80"
        >
          ✕
        </Link>
        <span className="font-semibold">{set.title}</span>
        <span className="text-sm opacity-75">
          {index + 1} / {total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-6">
        <div className="h-1.5 w-full rounded-full bg-white/20">
          <div
            className="h-1.5 rounded-full bg-white transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-white/60">
          <span>{known.size} known</span>
          <span>{unknown.size} learning</span>
        </div>
      </div>

      {/* Card */}
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <div
          className="relative w-full max-w-2xl cursor-pointer"
          style={{ perspective: "1200px" }}
          onClick={() => setFlipped((f) => !f)}
        >
          <div
            className="relative w-full transition-transform duration-500"
            style={{
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              minHeight: "280px",
            }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white p-10 shadow-2xl"
              style={{ backfaceVisibility: "hidden" }}
            >
              <p className="mb-4 text-xs tracking-widest text-gray-400 uppercase">
                Term
              </p>
              <p className="text-center text-4xl font-bold text-gray-900">
                {current.front}
              </p>
              <p className="mt-6 text-sm text-gray-400">Click to flip</p>
            </div>
            {/* Back */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-indigo-50 p-10 shadow-2xl"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <p className="mb-4 text-xs tracking-widest text-indigo-400 uppercase">
                Definition
              </p>
              <p className="text-center text-4xl font-bold text-indigo-900">
                {current.back}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons — shown after flip */}
        <div
          className={`mt-8 flex gap-4 transition-opacity duration-300 ${
            flipped ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <button
            onClick={markUnknown}
            className="flex items-center gap-2 rounded-xl bg-red-500 px-8 py-3 font-semibold text-white shadow-lg transition hover:bg-red-600"
          >
            ✗ Still learning
          </button>
          <button
            onClick={markKnown}
            className="flex items-center gap-2 rounded-xl bg-green-500 px-8 py-3 font-semibold text-white shadow-lg transition hover:bg-green-600"
          >
            ✓ Got it
          </button>
        </div>

        {/* Keyboard hint */}
        <p className="mt-6 text-sm text-white/50">
          Space to flip · ← Still learning · → Got it
        </p>
      </div>
    </div>
  );
}
