"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function StudySelectPage() {
  const params = useParams();
  const setId = typeof params.id === "string" ? params.id : "";
  const [selectedMode, setSelectedMode] = useState("flashcard");

  const modes = [
    {
      id: "flashcard",
      name: "Flashcards",
      icon: "🃏",
      desc: "Test your memory with interactive cards",
    },
    {
      id: "learn",
      name: "Learn Mode",
      icon: "📖",
      desc: "Step-by-step learning guide",
    },
    {
      id: "quiz",
      name: "Quiz",
      icon: "❓",
      desc: "Answer multiple-choice questions",
    },
    {
      id: "match",
      name: "Matching Game",
      icon: "🎮",
      desc: "Match words with translations",
    },
  ];

  const selected = modes.find((m) => m.id === selectedMode);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 p-4">
      <div className="w-full max-w-4xl rounded-xl bg-white p-12 shadow-2xl">
        <div className="mb-12 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            Choose Study Mode
          </h1>
          <p className="text-gray-600">Select how you want to study</p>
        </div>

        {/* Mode Selection Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`rounded-lg border-2 p-6 text-left transition ${
                selectedMode === mode.id
                  ? "border-blue-600 bg-blue-50 shadow-lg"
                  : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
              }`}
            >
              <div className="mb-3 text-4xl">{mode.icon}</div>
              <h3 className="mb-1 text-lg font-semibold text-gray-900">
                {mode.name}
              </h3>
              <p className="text-sm text-gray-600">{mode.desc}</p>
            </button>
          ))}
        </div>

        {/* Selected Mode Info */}
        {selected && (
          <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
            <div className="mb-2 flex items-center gap-3">
              <span className="text-3xl">{selected.icon}</span>
              <h3 className="text-lg font-semibold text-gray-900">
                {selected.name}
              </h3>
            </div>
            <p className="text-gray-600">{selected.desc}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Link href={`/dashboard/sets/${setId}`}>
            <button className="rounded-lg border border-gray-300 px-8 py-3 font-medium text-gray-700 transition hover:bg-gray-50">
              Cancel
            </button>
          </Link>
          <Link href={`/dashboard/study/${setId}/${selectedMode}`}>
            <button className="rounded-lg bg-blue-600 px-8 py-3 font-medium text-white transition hover:bg-blue-700">
              Start {selected?.name}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
