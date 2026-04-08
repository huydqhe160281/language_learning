// ─── Domain types ────────────────────────────────────────────────────────────

export interface Card {
  id: string;
  front: string;
  back: string;
  example: string | null;
  createdAt: string;
  updatedAt: string;
  setId: string;
}

export interface StudySet {
  id: string;
  title: string;
  description: string | null;
  language: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  cards?: Card[];
  _count?: { cards: number };
}

export interface Progress {
  id: string;
  correct: number;
  incorrect: number;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  interval: number;
  easeFactor: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  setId: string;
  cardId: string;
  card?: Card;
  set?: StudySet;
}

export interface StudySession {
  id: string;
  mode: string;
  correctCount: number;
  totalCount: number;
  duration: number;
  createdAt: string;
  userId: string;
  setId: string;
  set?: StudySet;
}

// ─── Request types ────────────────────────────────────────────────────────────

export interface CreateSetRequest {
  title: string;
  description?: string;
  language: string;
  isPublic?: boolean;
  cards?: Pick<Card, "front" | "back" | "example">[];
}

export interface UpdateSetRequest {
  title?: string;
  description?: string | null;
  language?: string;
  isPublic?: boolean;
}

export interface CreateCardRequest {
  front: string;
  back: string;
  example?: string;
}

export interface UpdateCardRequest {
  front: string;
  back: string;
  example?: string | null;
}

export interface ImportCardItem {
  front: string;
  back: string;
  example?: string;
}

export interface ImportCardsRequest {
  cards: ImportCardItem[];
}

export interface ImportCardsResponse {
  imported: number;
}

export interface UpdateProgressRequest {
  cardId: string;
  setId: string;
  isCorrect: boolean;
}

export interface BatchUpdateProgressRequest {
  updates: UpdateProgressRequest[];
}

export interface SetProgressSummary {
  setId: string;
  title: string;
  language: string;
  totalCards: number;
  studiedCards: number;
  unstudiedCards: number;
  correct: number;
  incorrect: number;
  masteryPct: number;
  dueToday: number;
}

export interface ProgressSummaryResponse {
  totalCards: number;
  studiedCards: number;
  unstudiedCards: number;
  totalCorrect: number;
  totalIncorrect: number;
  overallMasteryPct: number;
  dueToday: number;
  sets: SetProgressSummary[];
}

export interface CreateStudySessionRequest {
  setId: string;
  mode: string;
  correctCount?: number;
  totalCount?: number;
  duration: number;
}
