import { describe, expect, it } from "vitest";
import { formatPlayerMetric } from "./playerMetric";
import { testPlayer } from "./testPlayers";

describe("formatPlayerMetric actual", () => {
  it("shows a dash before the club match has started", () => {
    const player = testPlayer({
      element_id: 1,
      element_type: 1,
      position: 1,
      minutes_played: 0,
      fixture_started: false,
      metric_actual: null,
    });
    expect(formatPlayerMetric(player, "actual")).toBe("-");
  });

  it("shows 0 when the team has kicked off and the player DNP", () => {
    const player = testPlayer({
      element_id: 1,
      element_type: 1,
      position: 1,
      minutes_played: 0,
      fixture_started: true,
      metric_actual: 0,
    });
    expect(formatPlayerMetric(player, "actual")).toBe("0");
  });

  it("doubles actual points for an XI captain who played", () => {
    const player = testPlayer({
      element_id: 11,
      element_type: 4,
      position: 11,
      is_captain: true,
      minutes_played: 90,
      fixture_started: true,
      metric_actual: 6,
    });
    expect(formatPlayerMetric(player, "actual")).toBe("12");
  });
});

describe("formatPlayerMetric other series", () => {
  it("uses bench xP without the captain multiplier", () => {
    const player = testPlayer({
      element_id: 15,
      element_type: 4,
      position: 15,
      is_captain: true,
      metric_xp: 4.2,
    });
    expect(formatPlayerMetric(player, "xp")).toBe("4.2");
  });
});
