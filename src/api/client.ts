import type { BoardResponse, PlayerSearchResponse } from "./types";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function apiGet<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const search = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value != null && value !== "") search.set(key, String(value));
    }
  }
  const qs = search.toString();
  const url = `${API_BASE_URL}${path}${qs ? `?${qs}` : ""}`;
  const response = await fetch(url);
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      /* ignore non-JSON */
    }
    throw new ApiError(response.status, detail);
  }
  return (await response.json()) as T;
}

export type BoardQuery = {
  event?: number;
  elements?: number[];
  bank?: number;
  captain?: number;
  vice?: number;
};

export async function fetchBoard(entryId: number, query: BoardQuery = {}): Promise<BoardResponse> {
  return apiGet(`/v1/entries/${entryId}/board`, {
    event: query.event,
    elements: query.elements?.join(","),
    bank: query.bank,
    captain: query.captain,
    vice: query.vice,
  });
}

export async function searchPlayers(
  q: string,
  elementType: number,
  limit = 15,
): Promise<PlayerSearchResponse> {
  return apiGet("/v1/players", { q, element_type: elementType, limit });
}
