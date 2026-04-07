"use client";

import { Spin } from "antd";
import { useLoading } from "@/lib/loading-context";

export function GlobalLoading() {
  const { loading } = useLoading();

  if (!loading) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.35)",
        backdropFilter: "blur(2px)",
      }}
    >
      <Spin size="large" />
    </div>
  );
}
