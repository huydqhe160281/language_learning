"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { loadingStore } from "./loading-store";

interface LoadingContextValue {
  increment: () => void;
  decrement: () => void;
  loading: boolean;
}

const LoadingContext = createContext<LoadingContextValue>({
  increment: () => {},
  decrement: () => {},
  loading: false,
});

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  // Use a ref for the counter so rapid inc/dec don't batch-cancel each other
  const counter = useRef(0);
  const [loading, setLoading] = useState(false);

  const increment = useCallback(() => {
    counter.current += 1;
    if (counter.current === 1) setLoading(true);
  }, []);

  const decrement = useCallback(() => {
    counter.current = Math.max(0, counter.current - 1);
    if (counter.current === 0) setLoading(false);
  }, []);

  // Register with the bridge so axios interceptors can trigger loading state
  useEffect(() => {
    loadingStore.register(increment, decrement);
  }, [increment, decrement]);

  return (
    <LoadingContext.Provider value={{ increment, decrement, loading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  return useContext(LoadingContext);
}
