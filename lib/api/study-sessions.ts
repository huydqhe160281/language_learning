import { AxiosInstance } from "axios";
import { createHttpClient } from "@/lib/clients/http-client";
import { CreateStudySessionRequest, StudySession } from "./types";

export class StudySessionsApiClient {
  private httpClient: AxiosInstance;

  constructor() {
    this.httpClient = createHttpClient();
  }

  /** Fetch study history, optionally filtered by set. */
  async getAll(params?: {
    setId?: string;
    limit?: number;
  }): Promise<StudySession[]> {
    const res = await this.httpClient.get<StudySession[]>(
      "/api/study-sessions",
      { params },
    );
    return res.data;
  }

  /** Save a completed study session. */
  async create(body: CreateStudySessionRequest): Promise<StudySession> {
    const res = await this.httpClient.post<StudySession>(
      "/api/study-sessions",
      body,
    );
    return res.data;
  }
}

export const studySessionsApiClient = new StudySessionsApiClient();
