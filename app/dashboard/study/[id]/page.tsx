"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import {
  type StudyModeId,
  StudyModePicker,
} from "@/components/dashboard/study/study-mode-picker";

export default function StudySelectPage() {
  const params = useParams();
  const setId = typeof params.id === "string" ? params.id : "";
  const [selectedMode, setSelectedMode] = useState<StudyModeId>("flashcard");

  return (
    <StudyModePicker
      setId={setId}
      selectedMode={selectedMode}
      onSelectMode={setSelectedMode}
    />
  );
}
