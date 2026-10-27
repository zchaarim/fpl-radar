import { describe, expect, it } from "vitest";
import {
  appliedXp,
  assignArmband,
  isBenchOutfield,
  legalBenchIdsForStarter,
  legalStarterIdsForSub,
  legalXi,
  pinArmbandsToXi,
  pinBenchKeeper,
  sortBench,
  substitutePlayers,
  swapBenchOrder,
} from "./squadRules";
import { testPlayer, testSquad } from "./testPlayers";

describe("sortBench / pinBenchKeeper", () => {
  it("pins the bench keeper on the left even if FPL listed them last", () => {
    const players = testSquad().map((player) =>
      player.element_id === 12 ? { ...player, position: 15 } : player.element_id === 15 ? { ...player, position: 12 } : player,
    );
    const bench = sortBench(players);
    expect(bench.map((player) => player.element_id)).toEqual([12, 15, 13, 14]);
    expect(bench[0].element_type).toBe(1);

    const pinned = pinBenchKeeper(players);
    expect(pinned.filter((player) => (player.position ?? 0) > 11).map((player) => player.element_id)).toEqual([
      12, 15, 13, 14,
    ]);
    expect(pinned.find((player) => player.element_id === 12)?.position).toBe(12);
  });
});

describe("swapBenchOrder", () => {
  it("swaps two outfield bench slots and keeps the keeper at 12", () => {
    const squad = testSquad();
    const def = squad.find((player) => player.element_id === 13)!;
    const fwd = squad.find((player) => player.element_id === 15)!;
    const next = swapBenchOrder(squad, def, fwd);
    expect(next).not.toBeNull();
    const benchIds = next!.filter((player) => (player.position ?? 0) > 11).map((player) => player.element_id);
    expect(benchIds).toEqual([12, 15, 14, 13]);
  });

  it("rejects keeper, starter, and same-player swaps", () => {
    const squad = testSquad();
    const gk = squad.find((player) => player.element_id === 12)!;
    const def = squad.find((player) => player.element_id === 13)!;
    const starter = squad.find((player) => player.element_id === 2)!;
    expect(swapBenchOrder(squad, gk, def)).toBeNull();
    expect(swapBenchOrder(squad, def, starter)).toBeNull();
    expect(swapBenchOrder(squad, def, def)).toBeNull();
  });
});

describe("substitutePlayers", () => {
  it("brings a bench defender on for a starting defender", () => {
    const squad = testSquad();
    const benchDef = squad.find((player) => player.element_id === 13)!;
    const starterDef = squad.find((player) => player.element_id === 2)!;
    const next = substitutePlayers(squad, benchDef, starterDef);
    expect(next).not.toBeNull();
    expect(next!.find((player) => player.element_id === 13)?.position).toBe(2);
    expect(next!.find((player) => player.element_id === 2)?.position).toBe(13);
    expect(legalXi(next!)).toBe(true);
  });

  it("rejects a bench keeper onto an outfield starter", () => {
    const squad = testSquad();
    const benchGk = squad.find((player) => player.element_id === 12)!;
    const starterDef = squad.find((player) => player.element_id === 2)!;
    expect(substitutePlayers(squad, benchGk, starterDef)).toBeNull();
  });

  it("moves captaincy onto the player coming on", () => {
    const squad = testSquad();
    const benchFwd = squad.find((player) => player.element_id === 15)!;
    const captain = squad.find((player) => player.element_id === 11)!;
    const next = substitutePlayers(squad, benchFwd, captain);
    expect(next!.find((player) => player.element_id === 15)?.is_captain).toBe(true);
    expect(next!.find((player) => player.element_id === 11)?.is_captain).toBe(false);
  });

  it("does not treat two starters as a substitution", () => {
    const squad = testSquad();
    expect(substitutePlayers(squad, squad[1], squad[2])).toBeNull();
  });
});

describe("legal sub targets", () => {
  it("from a bench defender, only legal XI slots are starters that keep a legal XI", () => {
    const squad = testSquad();
    const benchDef = squad.find((player) => player.element_id === 13)!;
    const ids = legalStarterIdsForSub(squad, benchDef);
    expect(ids.has(2)).toBe(true);
    expect(ids.has(1)).toBe(false);
    expect(ids.has(13)).toBe(false);
  });

  it("from a starting defender, only legal bench players are highlighted — not other XI players", () => {
    const squad = testSquad();
    const starterDef = squad.find((player) => player.element_id === 2)!;
    const ids = legalBenchIdsForStarter(squad, starterDef);
    expect(ids.has(13)).toBe(true);
    expect(ids.has(14)).toBe(true);
    expect(ids.has(15)).toBe(true);
    expect(ids.has(12)).toBe(false);
    expect([...ids].some((id) => id <= 11)).toBe(false);
  });

  it("from a bench keeper, only the starting keeper is legal", () => {
    const squad = testSquad();
    const benchGk = squad.find((player) => player.element_id === 12)!;
    const ids = legalStarterIdsForSub(squad, benchGk);
    expect([...ids]).toEqual([1]);
  });

  it("does not list starter ids when the selected player is already a starter", () => {
    const squad = testSquad();
    expect(legalStarterIdsForSub(squad, squad[1]).size).toBe(0);
  });
});

describe("appliedXp", () => {
  it("doubles captain xP in the XI and zeros the bench", () => {
    const squad = testSquad();
    expect(appliedXp(squad.find((player) => player.element_id === 11)!)).toBe(12);
    expect(appliedXp(squad.find((player) => player.element_id === 15)!)).toBe(0);
  });
});

describe("armbands", () => {
  it("pins captain and vice onto the XI when they were left on the bench", () => {
    const squad = testSquad().map((player) => ({
      ...player,
      is_captain: player.element_id === 15,
      is_vice_captain: player.element_id === 13,
    }));
    const next = pinArmbandsToXi(squad);
    const captain = next.find((player) => player.is_captain)!;
    const vice = next.find((player) => player.is_vice_captain)!;
    expect(captain.position).toBeLessThanOrEqual(11);
    expect(vice.position).toBeLessThanOrEqual(11);
    expect(captain.element_id).not.toBe(vice.element_id);
    expect(next.filter((player) => (player.position ?? 99) > 11).every((player) => !player.is_captain && !player.is_vice_captain)).toBe(
      true,
    );
  });

  it("does not let a bench player take the armband", () => {
    const squad = testSquad();
    const bench = squad.find((player) => player.element_id === 13)!;
    const next = assignArmband(squad, bench, "captain");
    expect(next.find((player) => player.is_captain)?.element_id).toBe(11);
  });

  it("moves captain to another starter and clears it from the previous captain", () => {
    const squad = testSquad();
    const defender = squad.find((player) => player.element_id === 2)!;
    const next = assignArmband(squad, defender, "captain");
    expect(next.find((player) => player.element_id === 2)?.is_captain).toBe(true);
    expect(next.find((player) => player.element_id === 11)?.is_captain).toBe(false);
    expect(next.filter((player) => player.is_captain)).toHaveLength(1);
  });

  it("swaps captain and vice when the vice is given the armband", () => {
    const squad = testSquad();
    const vice = squad.find((player) => player.element_id === 10)!;
    const next = assignArmband(squad, vice, "captain");
    expect(next.find((player) => player.element_id === 10)?.is_captain).toBe(true);
    expect(next.find((player) => player.element_id === 11)?.is_vice_captain).toBe(true);
    expect(next.find((player) => player.element_id === 11)?.is_captain).toBe(false);
  });
});

describe("isBenchOutfield", () => {
  it("is true only for non-keeper bench players", () => {
    expect(isBenchOutfield(testPlayer({ element_id: 13, element_type: 2, position: 13 }))).toBe(true);
    expect(isBenchOutfield(testPlayer({ element_id: 12, element_type: 1, position: 12 }))).toBe(false);
    expect(isBenchOutfield(testPlayer({ element_id: 2, element_type: 2, position: 2 }))).toBe(false);
  });
});
