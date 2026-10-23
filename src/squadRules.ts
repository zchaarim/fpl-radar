import type { BoardPlayer } from "./api/types";

export function sortPlayers(players: BoardPlayer[]): BoardPlayer[] {
  return [...players].sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
}

export function isStarter(player: BoardPlayer): boolean {
  return (player.position ?? 99) <= 11;
}

export function appliedXp(player: BoardPlayer): number {
  if (!isStarter(player)) return 0;
  return player.metric_xp * (player.is_captain ? 2 : 1);
}

export function legalXi(players: BoardPlayer[]): boolean {
  const xi = players.filter(isStarter);
  if (xi.length !== 11) return false;
  const counts = [0, 0, 0, 0, 0];
  for (const player of xi) {
    const type = player.element_type;
    if (type >= 1 && type <= 4) counts[type] += 1;
  }
  return counts[1] === 1 && counts[2] >= 3 && counts[2] <= 5 && counts[3] >= 2 && counts[3] <= 5 && counts[4] >= 1 && counts[4] <= 3;
}

function bestXp(players: BoardPlayer[]): BoardPlayer {
  return players.reduce((lead, player) => (player.metric_xp > lead.metric_xp ? player : lead));
}

export function pinArmbandsToXi(players: BoardPlayer[]): BoardPlayer[] {
  const xi = players.filter(isStarter);
  if (!xi.length) return players;
  const captain = xi.find((player) => player.is_captain) ?? bestXp(xi);
  const vicePool = xi.filter((player) => player.element_id !== captain.element_id);
  const vice =
    xi.find((player) => player.is_vice_captain && player.element_id !== captain.element_id) ??
    (vicePool.length ? bestXp(vicePool) : captain);
  return players.map((player) => ({
    ...player,
    is_captain: player.element_id === captain.element_id,
    is_vice_captain: player.element_id === vice.element_id,
  }));
}

export function assignArmband(
  players: BoardPlayer[],
  target: BoardPlayer,
  role: "captain" | "vice",
): BoardPlayer[] {
  if (!isStarter(target)) return players;
  const isCaptain = target.is_captain;
  const isVice = target.is_vice_captain && !target.is_captain;
  let next: BoardPlayer[];
  if ((role === "captain" && isVice) || (role === "vice" && isCaptain)) {
    next = players.map((player) => ({
      ...player,
      is_captain: player.is_vice_captain,
      is_vice_captain: player.is_captain,
    }));
  } else if (role === "captain") {
    next = players.map((player) => ({
      ...player,
      is_captain: player.element_id === target.element_id,
      is_vice_captain: player.element_id === target.element_id ? false : player.is_vice_captain,
    }));
  } else {
    next = players.map((player) => ({
      ...player,
      is_vice_captain: player.element_id === target.element_id,
      is_captain: player.element_id === target.element_id ? false : player.is_captain,
    }));
  }
  return pinArmbandsToXi(next);
}

export function armbandIds(players: BoardPlayer[]): { captain?: number; vice?: number } {
  const captain = players.find((player) => player.is_captain)?.element_id;
  const vice = players.find((player) => player.is_vice_captain)?.element_id;
  return { captain, vice };
}

export function substitutePlayers(
  players: BoardPlayer[],
  bench: BoardPlayer,
  starter: BoardPlayer,
): BoardPlayer[] | null {
  if (isStarter(bench) || !isStarter(starter)) return null;
  const next = players.map((player) => {
    if (player.element_id === bench.element_id) {
      return {
        ...player,
        position: starter.position,
        is_captain: starter.is_captain,
        is_vice_captain: starter.is_vice_captain,
      };
    }
    if (player.element_id === starter.element_id) {
      return {
        ...player,
        position: bench.position,
        is_captain: false,
        is_vice_captain: false,
      };
    }
    return player;
  });
  const pinned = pinArmbandsToXi(next);
  if (!legalXi(pinned)) return null;
  return pinned;
}

export function legalStarterIdsForSub(players: BoardPlayer[], bench: BoardPlayer): Set<number> {
  const ids = new Set<number>();
  for (const player of players) {
    if (!isStarter(player)) continue;
    if (substitutePlayers(players, bench, player)) ids.add(player.element_id);
  }
  return ids;
}
