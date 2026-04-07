import axios, { AxiosError, AxiosResponse } from "axios";
import qs from "qs";
import { loadingStore } from "@/lib/loading-store";

/**
 * Attach custom fields to axios request config (mirrors gokigen pattern).
 */
declare module "axios" {
  interface AxiosRequestConfig {
    custom?: {
      /** Suppress error toast and global loading spinner for this request */
      silentError?: boolean;
      /** Skip the global loading spinner (still shows errors) */
      silent?: boolean;
    };
  }
}

/**
 * Standard error response body returned by this app's API routes.
 */
export interface ApiErrorBody {
  error: string;
}

/**
 * Wraps an AxiosError with a human-readable message extracted from
 * the response body.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly body: ApiErrorBody | undefined;

  constructor(axiosError: AxiosError<ApiErrorBody>) {
    const body = axiosError.response?.data;
    const message = body?.error ?? axiosError.message ?? "Unknown error";
    super(message);
    this.name = "ApiError";
    this.status = axiosError.response?.status ?? 0;
    this.body = body;
  }
}

/**
 * Create a configured Axios instance.
 *
 * - baseURL: NEXT_PUBLIC_APP_URL (defaults to "" → relative paths work in browser)
 * - Serialises array query params with `qs` (repeat style)
 * - Response interceptor: unwraps `response.data` so callers receive the
 *   payload directly; throws `ApiError` on non-2xx responses.
 */
export const createHttpClient = () => {
  const httpClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "",
    timeout: 10_000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    paramsSerializer: (params) =>
      qs.stringify(params, { arrayFormat: "repeat", skipNulls: true }),
  });

  // ── Request interceptor ─────────────────────────────────────────────────
  httpClient.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
      config.headers["X-TimeZone"] =
        Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    const skipSpinner = config.custom?.silentError || config.custom?.silent;
    if (!skipSpinner) {
      loadingStore.increment();
    }
    return config;
  });

  // ── Response interceptor ────────────────────────────────────────────────
  httpClient.interceptors.response.use(
    (response: AxiosResponse) => {
      const skipSpinner =
        response.config.custom?.silentError || response.config.custom?.silent;
      if (!skipSpinner) {
        loadingStore.decrement();
      }
      return response;
    },
    (error: AxiosError<ApiErrorBody>) => {
      const skipSpinner =
        error.config?.custom?.silentError || error.config?.custom?.silent;
      if (!skipSpinner) {
        loadingStore.decrement();
      }
      if (!error.config?.custom?.silentError) {
        const status = error.response?.status ?? 0;
        const message = error.response?.data?.error ?? error.message;
        console.error(
          `[API] ${status} ${error.config?.url ?? ""} — ${message}`,
        );
      }
      return Promise.reject(new ApiError(error));
    },
  );

  return httpClient;
};
