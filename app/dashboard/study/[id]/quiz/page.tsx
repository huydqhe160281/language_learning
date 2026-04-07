"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  setsApiClient,
  progressApiClient,
  studySessionsApiClient,
  StudySet,
  Card,
  UpdateProgressRequest,
} from "@/lib/api";

type Question = {
  card: Card;
  choices: string[];
  correct: string;
};

function buildQuestions(cards: Card[]): Question[] {
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
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(Date.now());
  // Accumulate progress updates locally; flush in one batch call at session end
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
  const score = results.filter(Boolean).length;

  const choose = useCallback(
    (choice: string) => {
      if (selected !== null) return;
      setSelected(choice);
      const correct = choice === current.correct;

      // Queue locally — will be flushed at session end in one batch request
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
          // Flush all accumulated progress updates in one batch call
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
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-600 to-purple-500">
        <p className="text-xl text-white">Loading…</p>
      </div>
    );
  }
  if (!set || (set.cards ?? []).length < 2) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-600 to-purple-500 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-10 text-center">
          <p className="mb-4 text-gray-600">
            Need at least 2 cards to start a quiz.
          </p>
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
    const pct = Math.round((score / total) * 100);
    const emoji = pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "💪";
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-600 to-purple-500 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-10 text-center shadow-2xl">
          <div className="mb-4 text-6xl">{emoji}</div>
          <h2 className="mb-1 text-3xl font-bold text-gray-900">Quiz done!</h2>
          <p className="mb-6 text-gray-500">{set.title}</p>
          <div className="mb-2 text-6xl font-bold text-violet-600">{pct}%</div>
          <p className="mb-8 text-gray-500">
            {score} / {total} correct
          </p>
          <div className="mb-4 flex flex-col gap-2">
            {questions.map((q, i) => (
              <div
                key={q.card.id}
                className={`flex items-center gap-3 rounded-lg px-4 py-2 text-sm ${
                  results[i]
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-600"
                }`}
              >
                <span>{results[i] ? "✓" : "✗"}</span>
                <span className="font-medium">{q.card.front}</span>
                <span className="ml-auto opacity-70">{q.card.back}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={restart}
              className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-700"
            >
              Retake quiz
            </button>
            <Link href={`/dashboard/sets/${setId}`}>
              <button className="w-full rounded-xl py-3 font-semibold text-violet-600 transition hover:bg-violet-50">
                Back to set
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-violet-600 to-purple-500">
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
      <div className="mb-2 px-6">
        <div className="h-1.5 w-full rounded-full bg-white/20">
          <div
            className="h-1.5 rounded-full bg-white transition-all duration-300"
            style={{ width: `${Math.round((index / total) * 100)}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-white/60">
          <span>{score} correct</span>
          <span>{results.length - score} wrong</span>
        </div>
      </div>

      {/* Question */}
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="w-full max-w-xl">
          <div className="mb-6 rounded-2xl bg-white p-8 shadow-2xl">
            <p className="mb-4 text-center text-xs tracking-widest text-gray-400 uppercase">
              What is the definition of…
            </p>
            <p className="text-center text-4xl font-bold text-gray-900">
              {current.card.front}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {current.choices.map((choice) => {
              let style =
                "bg-white border-2 border-white/30 text-gray-900 hover:border-violet-400 hover:bg-violet-50";
              if (selected !== null) {
                if (choice === current.correct)
                  style = "bg-green-500 border-2 border-green-500 text-white";
                else if (choice === selected)
                  style = "bg-red-500 border-2 border-red-500 text-white";
                else
                  style =
                    "bg-white border-2 border-white/30 text-gray-400 opacity-50";
              }
              return (
                <button
                  key={choice}
                  onClick={() => choose(choice)}
                  disabled={selected !== null}
                  className={`w-full rounded-xl px-6 py-4 text-left text-base font-medium transition ${style}`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
