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

type Tile = {
  key: string; // unique tile id
  cardId: string;
  text: string;
  side: "front" | "back";
};

type TileState = "idle" | "selected" | "matched" | "wrong";

const MATCH_COUNT = 6; // pairs shown at once

function buildTiles(cards: Card[]): Tile[] {
  const pool = cards.slice(0, MATCH_COUNT);
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

  const initGame = useCallback((cards: Card[]) => {
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

  // Timer
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

        // Check if all matched
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

  const tileClass = (key: string) => {
    const state = tileStates[key] ?? "idle";
    const base =
      "rounded-xl px-4 py-5 text-center font-semibold text-base transition-all duration-150 cursor-pointer select-none border-2 ";
    switch (state) {
      case "idle":
        return (
          base +
          "bg-white border-gray-200 hover:border-orange-400 hover:shadow-md text-gray-900"
        );
      case "selected":
        return (
          base +
          "bg-orange-500 border-orange-500 text-white shadow-lg scale-105"
        );
      case "matched":
        return (
          base +
          "bg-green-100 border-green-400 text-green-800 opacity-50 cursor-default"
        );
      case "wrong":
        return base + "bg-red-100 border-red-400 text-red-700 shake";
      default:
        return base;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-500 to-amber-400">
        <p className="text-xl text-white">Loading…</p>
      </div>
    );
  }
  if (!set || (set.cards ?? []).length < 2) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-500 to-amber-400 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-10 text-center">
          <p className="mb-4 text-gray-600">
            Need at least 2 cards for matching.
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
    const star = mistakes === 0 ? "⭐⭐⭐" : mistakes <= 2 ? "⭐⭐" : "⭐";
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-500 to-amber-400 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-10 text-center shadow-2xl">
          <div className="mb-3 text-5xl">{star}</div>
          <h2 className="mb-1 text-3xl font-bold text-gray-900">
            All matched!
          </h2>
          <p className="mb-6 text-gray-500">{set.title}</p>
          <div className="mb-8 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-orange-50 p-4">
              <p className="text-3xl font-bold text-orange-600">
                {formatTime(elapsed)}
              </p>
              <p className="mt-1 text-sm text-orange-700">Time</p>
            </div>
            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-3xl font-bold text-red-500">{mistakes}</p>
              <p className="mt-1 text-sm text-red-600">Mistakes</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => initGame(set.cards ?? [])}
              className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white transition hover:bg-orange-600"
            >
              Play again
            </button>
            <Link href={`/dashboard/sets/${setId}`}>
              <button className="w-full rounded-xl py-3 font-semibold text-orange-600 transition hover:bg-orange-50">
                Back to set
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-orange-500 to-amber-400">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 text-white">
        <Link
          href={`/dashboard/sets/${setId}`}
          className="transition hover:opacity-80"
        >
          ✕
        </Link>
        <span className="font-semibold">{set.title}</span>
        <span className="rounded-full bg-white/20 px-3 py-1 font-mono text-sm">
          {formatTime(elapsed)}
        </span>
      </div>
      <div className="mb-2 px-6">
        <p className="text-center text-sm text-white/70">
          Match each term with its definition · {mistakes} mistake
          {mistakes !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-4">
        <div className="grid w-full max-w-2xl grid-cols-3 gap-3">
          {tiles.map((tile) => (
            <button
              key={tile.key}
              onClick={() => handleTile(tile.key)}
              className={tileClass(tile.key)}
            >
              {tile.text}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .shake { animation: shake 0.3s ease; }
      `}</style>
    </div>
  );
}
