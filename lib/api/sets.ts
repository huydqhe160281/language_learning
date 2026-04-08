import { AxiosInstance } from "axios";
import { createHttpClient } from "@/lib/clients/http-client";
import {
  Card,
  CreateCardRequest,
  CreateSetRequest,
  ImportCardsRequest,
  ImportCardsResponse,
  StudySet,
  UpdateCardRequest,
  UpdateSetRequest,
} from "./types";

export class SetsApiClient {
  private httpClient: AxiosInstance;

  constructor() {
    this.httpClient = createHttpClient();
  }

  /** List all sets for the local user. */
  async getAll(params?: {
    q?: string;
    language?: string;
  }): Promise<StudySet[]> {
    const res = await this.httpClient.get<StudySet[]>("/api/sets", { params });
    return res.data;
  }

  /** Get a single set with its cards. */
  async getById(id: string): Promise<StudySet> {
    const res = await this.httpClient.get<StudySet>(`/api/sets/${id}`);
    return res.data;
  }

  /** Create a new study set (optionally with initial cards). */
  async create(body: CreateSetRequest): Promise<StudySet> {
    const res = await this.httpClient.post<StudySet>("/api/sets", body);
    return res.data;
  }

  /** Update set metadata. */
  async update(id: string, body: UpdateSetRequest): Promise<StudySet> {
    const res = await this.httpClient.put<StudySet>(`/api/sets/${id}`, body);
    return res.data;
  }

  /** Delete a set. */
  async remove(id: string): Promise<void> {
    await this.httpClient.delete(`/api/sets/${id}`);
  }

  /** Add a card to a set. */
  async addCard(setId: string, body: CreateCardRequest): Promise<Card> {
    const res = await this.httpClient.post<Card>(
      `/api/sets/${setId}/cards`,
      body,
    );
    return res.data;
  }

  /** Delete a single card from a set. */
  async removeCard(setId: string, cardId: string): Promise<void> {
    await this.httpClient.delete(`/api/sets/${setId}/cards/${cardId}`);
  }

  /** Update a card in a set. */
  async updateCard(
    setId: string,
    cardId: string,
    body: UpdateCardRequest,
  ): Promise<Card> {
    const res = await this.httpClient.put<Card>(
      `/api/sets/${setId}/cards/${cardId}`,
      body,
    );
    return res.data;
  }

  /**
   * Bulk-import cards parsed from a CSV file.
   * Uses a single createMany on the server — much faster than addCard in a loop.
   */
  async importCards(
    setId: string,
    body: ImportCardsRequest,
  ): Promise<ImportCardsResponse> {
    const res = await this.httpClient.post<ImportCardsResponse>(
      `/api/sets/${setId}/cards/import`,
      body,
    );
    return res.data;
  }
}

export const setsApiClient = new SetsApiClient();
