import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { testPlayer } from "../testPlayers";
import { PlayerCard } from "./PlayerCard";

const starter = testPlayer({ element_id: 2, element_type: 2, position: 2, web_name: "De Cuyper" });

describe("PlayerCard substitute control", () => {
  it("shows the swap button only when onSubClick is provided", () => {
    const { rerender } = render(<PlayerCard player={starter} metric="xp" interactive onReplace={() => {}} />);
    expect(screen.queryByRole("button", { name: "Substitute De Cuyper" })).toBeNull();
    rerender(
      <PlayerCard player={starter} metric="xp" interactive onReplace={() => {}} onSubClick={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "Substitute De Cuyper" })).toBeInTheDocument();
  });

  it("pressing the swap button starts a sub and does not open replace", async () => {
    const user = userEvent.setup();
    const onSubClick = vi.fn();
    const onReplace = vi.fn();
    render(
      <PlayerCard player={starter} metric="xp" interactive onReplace={onReplace} onSubClick={onSubClick} />,
    );
    await user.click(screen.getByRole("button", { name: "Substitute De Cuyper" }));
    expect(onSubClick).toHaveBeenCalledTimes(1);
    expect(onReplace).not.toHaveBeenCalled();
    expect(screen.queryByRole("menuitem", { name: "Replace" })).toBeNull();
  });

  it("clicking a highlighted card body completes or cancels via onSelect", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <PlayerCard player={starter} metric="xp" interactive subTone="legal" onSelect={onSelect} />,
    );
    await user.click(screen.getByRole("button", { name: /De Cuyper/ }));
    expect(onSelect).toHaveBeenCalledWith(starter);
  });

  it("does not let an illegal target be chosen from the card body", () => {
    const onSelect = vi.fn();
    render(
      <PlayerCard player={starter} metric="xp" interactive subTone="illegal" onSelect={onSelect} />,
    );
    expect(screen.queryByRole("button", { name: /De Cuyper/ })).toBeNull();
    expect(screen.getByText("De Cuyper", { selector: ".name" }).closest("article")).toHaveClass("sub-illegal");
  });
});
