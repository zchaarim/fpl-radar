export type Money = {
  tenths: number;
  pounds: number;
};

export type BoardEvent = {
  id: number;
  name: string;
  finished: boolean;
  is_current: boolean;
  is_next: boolean;
  deadline_time: string | null;
};

export type BoardPlayer = {
  element_id: number;
  web_name: string;
  team_id: number;
  team_short: string;
  element_type: number;
  position: number | null;
  is_captain: boolean;
  is_vice_captain: boolean;
  photo_code: number | null;
  selected_by_percent: number | null;
  now_cost: Money;
  selling_price: Money;
  xgi90: number | null;
  flag: string;
  status: string;
  chance_of_playing: number | null;
  news: string;
  metric_xp: number;
  metric_actual: number | null;
  opponent: string;
  fixture_count: number;
};

export type BoardResponse = {
  entry_id: number;
  name: string | null;
  current_event: number | null;
  bank: Money;
  bank_source: string;
  free_transfers: number;
  free_transfers_source: string;
  authenticated: boolean;
  event: BoardEvent;
  events: BoardEvent[];
  mode: "actual" | "predicted";
  picks_published: boolean;
  xp_source: string;
  placeholder: boolean;
  team_xp: number;
  players: BoardPlayer[];
};

export type MetricId = "xp" | "opponent" | "xgi90" | "ownership";

export type PlayerSearchHit = {
  element_id: number;
  web_name: string;
  team_id: number;
  team_short: string;
  element_type: number;
  now_cost: Money;
  photo_code: number | null;
  status: string;
  chance_of_playing: number | null;
  news: string;
};

export type PlayerSearchResponse = {
  q: string;
  limit: number;
  players: PlayerSearchHit[];
};
