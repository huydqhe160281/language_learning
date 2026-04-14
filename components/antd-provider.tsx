"use client";

import { App, ConfigProvider, theme as antdTheme } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import type { ModalStaticFunctions } from "antd/es/modal/confirm";
import type { NotificationInstance } from "antd/es/notification/interface";
import { useEffect } from "react";
import { useTheme } from "@/lib/theme-context";

let _message: MessageInstance;
let _modal: Omit<ModalStaticFunctions, "warn">;
let _notification: NotificationInstance;

/**
 * Global accessors — use these outside of React components (e.g., in API
 * clients). Inside components, prefer App.useApp() instead.
 */
export const antdMessage = {
  success: (...args: Parameters<MessageInstance["success"]>) =>
    _message?.success(...args),
  error: (...args: Parameters<MessageInstance["error"]>) =>
    _message?.error(...args),
  info: (...args: Parameters<MessageInstance["info"]>) =>
    _message?.info(...args),
  warning: (...args: Parameters<MessageInstance["warning"]>) =>
    _message?.warning(...args),
  loading: (...args: Parameters<MessageInstance["loading"]>) =>
    _message?.loading(...args),
};

function AntdInner({ children }: { children: React.ReactNode }) {
  const { message, modal, notification } = App.useApp();

  useEffect(() => {
    _message = message;
    _modal = modal;
    _notification = notification;
  }, [message, modal, notification]);

  return <>{children}</>;
}

export function AntdProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm:
          theme === "dark"
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
      }}
    >
      <App>
        <AntdInner>{children}</AntdInner>
      </App>
    </ConfigProvider>
  );
}
