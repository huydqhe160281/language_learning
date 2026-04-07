import { AxiosInstance } from "axios";
import { createHttpClient } from "@/lib/clients/http-client";
import {
  Progress,
  ProgressSummaryResponse,
  UpdateProgressRequest,
  BatchUpdateProgressRequest,
} from "./types";

export class ProgressApiClient {
  private httpClient: AxiosInstance;

  constructor() {
    this.httpClient = createHttpClient();
  }

  /** Get aggregated progress summary grouped by set. */
  async getSummary(): Promise<ProgressSummaryResponse> {
    const res = await this.httpClient.get<ProgressSummaryResponse>(
      "/api/progress/summary",
    );
    return res.data;
  }

  /** Get progress records, optionally filtered by set. */
  async getAll(params?: { setId?: string }): Promise<Progress[]> {
    const res = await this.httpClient.get<Progress[]>("/api/progress", {
      params,
    });
    return res.data;
  }

  /** Record a single card review result (updates spaced-repetition state). */
  async updateCard(body: UpdateProgressRequest): Promise<Progress> {
    const res = await this.httpClient.post<Progress>("/api/progress", body);
    return res.data;
  }

  /**
   * Batch-record multiple card review results in one request.
   * Use this at the end of a study session to avoid N round-trips.
   */
  async batchUpdate(
    body: BatchUpdateProgressRequest,
  ): Promise<{ updated: number }> {
    const res = await this.httpClient.post<{ updated: number }>(
      "/api/progress/batch",
      body,
    );
    return res.data;
  }
}

export const progressApiClient = new ProgressApiClient();
