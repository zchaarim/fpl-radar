import type { BoardPlayer, BoardResponse } from "./api/types";

export function testPlayer(partial: Partial<BoardPlayer> & Pick<BoardPlayer, "element_id" | "element_type" | "position">): BoardPlayer {
  return {
    web_name: `P${partial.element_id}`,
    team_id: 1,
    team_short: "ABC",
    is_captain: false,
    is_vice_captain: false,
    photo_code: null,
    selected_by_percent: 1,
    now_cost: { tenths: 50, pounds: 5 },
    selling_price: { tenths: 50, pounds: 5 },
    xgi90: 0.4,
    flag: "",
    status: "a",
    chance_of_playing: null,
    news: "",
    metric_xp: 3,
    metric_actual: null,
    minutes_played: null,
    fixture_started: false,
    opponent: "ARS (H)",
    fixture_count: 1,
    ...partial,
  };
}

/** 1 GK, 4 DEF, 4 MID, 2 FWD; bench GK, DEF, MID, FWD. Captain is FWD 11. */
export function testSquad(): BoardPlayer[] {
  const types = [1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 1, 2, 3, 4];
  return types.map((element_type, index) =>
    testPlayer({
      element_id: index + 1,
      element_type,
      position: index + 1,
      is_captain: index === 10,
      is_vice_captain: index === 9,
      metric_xp: index === 10 ? 6 : 3,
    }),
  );
}

export function testBoard(over: Partial<BoardResponse> = {}): BoardResponse {
  const event = over.event ?? {
    id: 9,
    name: "Gameweek 9",
    finished: false,
    is_current: true,
    is_next: false,
    started: false,
    deadline_time: null,
  };
  return {
    entry_id: 99,
    name: "Test FC",
    current_event: 9,
    bank: { tenths: 12, pounds: 1.2 },
    bank_source: "picks",
    free_transfers: 1,
    free_transfers_source: "picks",
    authenticated: false,
    event,
    events: over.events ?? [
      { ...event, id: 8, name: "Gameweek 8", is_current: false },
      event,
      { ...event, id: 10, name: "Gameweek 10", is_current: false, is_next: true, started: false },
    ],
    mode: "predicted",
    picks_published: true,
    xp_source: "model",
    placeholder: false,
    team_xp: 40,
    players: testSquad(),
    ...over,
  };
}
