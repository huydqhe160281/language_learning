"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { Card } from "@/lib/api";

/**
 * Manages batched deck progression:
 * - Splits `allCards` into batches of `batchSize`
 * - Wrong cards from the previous batch are prepended to the next batch
 * - Pass `batchSize = null` to study all cards at once (no batching)
 * - `shuffle = true` randomises the order once per session (frozen on first seed)
 */
export function useBatchDeck(
  allCards: Card[],
  batchSize: number | null,
  shuffle: boolean,
) {
  const frozenRef = useRef<Card[]>([]);
  const seededRef = useRef(false);

  // Seed the stable order once, when cards first become available
  if (allCards.length > 0 && !seededRef.current) {
    seededRef.current = true;
    frozenRef.current = shuffle
      ? [...allCards].sort(() => Math.random() - 0.5)
      : [...allCards];
  }

  const [offset, setOffset] = useState(0); // how many "new" cards consumed so far
  const [carry, setCarry] = useState<Card[]>([]); // wrong cards carried from prev batch

  const ordered = frozenRef.current;

  const deck = useMemo(() => {
    if (ordered.length === 0) return [];
    if (!batchSize) return ordered;
    return [...carry, ...ordered.slice(offset, offset + batchSize)];
  }, [ordered, batchSize, offset, carry]);

  const hasMoreNewCards = !!batchSize && offset + batchSize < ordered.length;

  const batchNum = batchSize ? Math.floor(offset / batchSize) + 1 : 1;
  const totalBatches = batchSize ? Math.ceil(ordered.length / batchSize) : 1;

  /** Call when a batch finishes; wrongCards will be prepended to the next batch */
  const advance = useCallback(
    (wrongCards: Card[]) => {
      if (!batchSize) return;
      setOffset((prev) => prev + batchSize);
      setCarry(wrongCards);
    },
    [batchSize],
  );

  /** Reset the entire session (e.g. on "Restart") */
  const reset = useCallback(() => {
    setOffset(0);
    setCarry([]);
    seededRef.current = false;
    frozenRef.current = [];
  }, []);

  return { deck, batchNum, totalBatches, hasMoreNewCards, advance, reset };
}
