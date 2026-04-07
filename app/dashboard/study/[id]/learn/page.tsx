"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  setsApiClient,
  progressApiClient,
  studySessionsApiClient,
  StudySet,
  Card,
  UpdateProgressRequest,
} from "@/lib/api";

type Phase = "preview" | "answer" | "result";
type Verdict = "correct" | "almost" | "wrong";

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export default function LearnPage() {
  const params = useParams();
  const setId = typeof params.id === "string" ? params.id : "";

  const [set, setSet] = useState<StudySet | null>(null);
  const [loading, setLoading] = useState(true);

  const [deck, setDeck] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("preview");
  const [input, setInput] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [results, setResults] = useState<{ card: Card; verdict: Verdict }[]>(
    [],
  );
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(Date.now());
  // Accumulate progress updates locally; flush in one batch call at session end
  const pendingProgressRef = useRef<UpdateProgressRequest[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!setId) return;
    setsApiClient
      .getById(setId)
      .then((data) => {
        setSet(data);
        setDeck([...(data.cards ?? [])].sort(() => Math.random() - 0.5));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [setId]);

  const current = deck[index];
  const total = deck.length;

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

    // Queue locally — will be flushed at session end in one batch request
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
      // Flush all accumulated progress updates in one batch call
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
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-600 to-emerald-500">
        <p className="text-xl text-white">Loading…</p>
      </div>
    );
  }
  if (!set || deck.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-600 to-emerald-500 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-10 text-center">
          <p className="mb-4 text-gray-600">No cards to learn.</p>
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
    const correct = results.filter((r) => r.verdict === "correct").length;
    const almost = results.filter((r) => r.verdict === "almost").length;
    const wrong = results.filter((r) => r.verdict === "wrong").length;
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-600 to-emerald-500 p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white p-10 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="mb-4 text-6xl">📖</div>
            <h2 className="mb-1 text-3xl font-bold text-gray-900">
              Round complete!
            </h2>
            <p className="text-gray-500">{set.title}</p>
          </div>
          <div className="mb-8 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-green-50 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{correct}</p>
              <p className="mt-1 text-xs text-green-700">Correct</p>
            </div>
            <div className="rounded-xl bg-yellow-50 p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{almost}</p>
              <p className="mt-1 text-xs text-yellow-700">Almost</p>
            </div>
            <div className="rounded-xl bg-red-50 p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{wrong}</p>
              <p className="mt-1 text-xs text-red-600">Wrong</p>
            </div>
          </div>
          <div className="mb-6 flex max-h-56 flex-col gap-2 overflow-y-auto">
            {results.map(({ card, verdict }) => (
              <div
                key={card.id}
                className={`flex items-center gap-3 rounded-lg px-4 py-2 text-sm ${
                  verdict === "correct"
                    ? "bg-green-50 text-green-700"
                    : verdict === "almost"
                      ? "bg-yellow-50 text-yellow-700"
                      : "bg-red-50 text-red-600"
                }`}
              >
                <span>
                  {verdict === "correct"
                    ? "✓"
                    : verdict === "almost"
                      ? "~"
                      : "✗"}
                </span>
                <span className="font-medium">{card.front}</span>
                <span className="ml-auto opacity-70">{card.back}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={restart}
              className="w-full rounded-xl bg-teal-600 py-3 font-semibold text-white transition hover:bg-teal-700"
            >
              Study again
            </button>
            <Link href={`/dashboard/sets/${setId}`}>
              <button className="w-full rounded-xl py-3 font-semibold text-teal-600 transition hover:bg-teal-50">
                Back to set
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const verdictBg =
    verdict === "correct"
      ? "bg-green-50 border-green-400"
      : verdict === "almost"
        ? "bg-yellow-50 border-yellow-400"
        : "bg-red-50 border-red-400";

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-teal-600 to-emerald-500">
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

      {/* Progress */}
      <div className="mb-2 px-6">
        <div className="h-1.5 w-full rounded-full bg-white/20">
          <div
            className="h-1.5 rounded-full bg-white transition-all duration-300"
            style={{ width: `${Math.round((index / total) * 100)}%` }}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="w-full max-w-xl">
          {/* Preview phase */}
          {phase === "preview" && (
            <div className="rounded-2xl bg-white p-10 text-center shadow-2xl">
              <p className="mb-6 text-xs tracking-widest text-gray-400 uppercase">
                Learn this term
              </p>
              <p className="mb-4 text-5xl font-bold text-gray-900">
                {current.front}
              </p>
              <div className="mb-8 rounded-xl bg-teal-50 px-6 py-4">
                <p className="mb-1 text-xs tracking-widest text-teal-500 uppercase">
                  Definition
                </p>
                <p className="text-2xl font-semibold text-teal-800">
                  {current.back}
                </p>
              </div>
              <button
                onClick={startAnswer}
                className="w-full rounded-xl bg-teal-600 py-3 text-lg font-semibold text-white transition hover:bg-teal-700"
              >
                I know it, test me →
              </button>
            </div>
          )}

          {/* Answer phase */}
          {phase === "answer" && (
            <div className="rounded-2xl bg-white p-10 shadow-2xl">
              <p className="mb-4 text-center text-xs tracking-widest text-gray-400 uppercase">
                Type the definition
              </p>
              <p className="mb-8 text-center text-4xl font-bold text-gray-900">
                {current.front}
              </p>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && input.trim() && submitAnswer()
                }
                placeholder="Type your answer…"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-lg focus:border-teal-500 focus:outline-none"
              />
              <button
                onClick={submitAnswer}
                disabled={!input.trim()}
                className="mt-4 w-full rounded-xl bg-teal-600 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:opacity-40"
              >
                Check
              </button>
            </div>
          )}

          {/* Result phase */}
          {phase === "result" && (
            <div
              className={`rounded-2xl border-2 bg-white p-10 shadow-2xl ${verdictBg}`}
            >
              <div className="mb-6 text-center">
                {verdict === "correct" && (
                  <p className="text-xl font-bold text-green-600">✓ Correct!</p>
                )}
                {verdict === "almost" && (
                  <p className="text-xl font-bold text-yellow-600">
                    ~ Almost right
                  </p>
                )}
                {verdict === "wrong" && (
                  <p className="text-xl font-bold text-red-600">✗ Incorrect</p>
                )}
              </div>
              <p className="mb-6 text-center text-4xl font-bold text-gray-900">
                {current.front}
              </p>
              {verdict !== "correct" && (
                <div className="mb-4 space-y-2">
                  <div className="rounded-lg bg-gray-50 px-4 py-2">
                    <p className="text-xs text-gray-400">Your answer</p>
                    <p className="font-medium text-gray-700">{input}</p>
                  </div>
                  <div className="rounded-lg bg-teal-50 px-4 py-2">
                    <p className="text-xs text-teal-500">Correct answer</p>
                    <p className="font-semibold text-teal-800">
                      {current.back}
                    </p>
                  </div>
                </div>
              )}
              <button
                onClick={advance}
                className="mt-4 w-full rounded-xl bg-teal-600 py-3 font-semibold text-white transition hover:bg-teal-700"
              >
                {index + 1 >= total ? "Finish" : "Continue →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
