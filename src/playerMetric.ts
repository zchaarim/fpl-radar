import type { BoardPlayer, MetricId } from "./api/types";
import { appliedXp, isStarter } from "./squadRules";

export function formatPlayerMetric(player: BoardPlayer, metric: MetricId): string {
  switch (metric) {
    case "xp": {
      const value = isStarter(player) ? appliedXp(player) : player.metric_xp;
      return value.toFixed(1);
    }
    case "actual": {
      if (player.minutes_played != null && player.minutes_played > 0) {
        const raw = player.metric_actual ?? 0;
        const value = player.is_captain && isStarter(player) ? raw * 2 : raw;
        return Number.isInteger(value) ? String(value) : value.toFixed(1);
      }
      return player.fixture_started ? "0" : "-";
    }
    case "opponent":
      return player.opponent;
    case "xgi90":
      return player.xgi90 == null ? "—" : player.xgi90.toFixed(2);
    case "ownership":
      return player.selected_by_percent == null ? "—" : `${player.selected_by_percent.toFixed(1)}%`;
  }
}
