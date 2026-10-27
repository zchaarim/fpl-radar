import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { testBoard } from "../testPlayers";
import { SquadBoard } from "./SquadBoard";

vi.mock("../api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/client")>();
  return { ...actual, fetchBoard: vi.fn() };
});

import { fetchBoard } from "../api/client";

const fetchBoardMock = vi.mocked(fetchBoard);

function cardNamed(name: string) {
  return screen.getByText(name, { selector: ".name" }).closest("article")!;
}

function renderBoard() {
  return render(
    <MemoryRouter initialEntries={["/99"]}>
      <Routes>
        <Route path="/:entryId" element={<SquadBoard />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  fetchBoardMock.mockReset();
  fetchBoardMock.mockResolvedValue(testBoard());
});

afterEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

describe("SquadBoard substitutions", () => {
  it("puts a swap button on every card, then hides them all after one is pressed", async () => {
    const user = userEvent.setup();
    renderBoard();
    const startButtons = await screen.findAllByRole("button", { name: /Substitute / });
    expect(startButtons).toHaveLength(15);
    await user.click(screen.getByRole("button", { name: "Substitute P2" }));
    expect(screen.queryAllByRole("button", { name: /Substitute / })).toHaveLength(0);
  });

  it("cancels when the same highlighted player body is clicked", async () => {
    const user = userEvent.setup();
    renderBoard();
    await screen.findByRole("button", { name: "Substitute P2" });
    await user.click(screen.getByRole("button", { name: "Substitute P2" }));
    expect(cardNamed("P2")).toHaveClass("sub-legal");
    await user.click(within(cardNamed("P2")).getByRole("button", { name: /P2/ }));
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /Substitute / })).toHaveLength(15);
    });
    expect(cardNamed("P2")).not.toHaveClass("sub-legal");
  });

  it("from an XI player, greys other starters and an illegal bench keeper", async () => {
    const user = userEvent.setup();
    renderBoard();
    await screen.findByRole("button", { name: "Substitute P2" });
    await user.click(screen.getByRole("button", { name: "Substitute P2" }));
    expect(cardNamed("P3")).toHaveClass("sub-illegal");
    expect(cardNamed("P12")).toHaveClass("sub-illegal");
    expect(cardNamed("P13")).toHaveClass("sub-legal");
    expect(within(cardNamed("P3")).queryByRole("button", { name: /P3/ })).toBeNull();
  });

  it("completes a legal sub from the pitch onto a highlighted bench player", async () => {
    const user = userEvent.setup();
    renderBoard();
    await screen.findByRole("button", { name: "Substitute P2" });
    await user.click(screen.getByRole("button", { name: "Substitute P2" }));
    await user.click(within(cardNamed("P13")).getByRole("button", { name: /P13/ }));
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /Substitute / })).toHaveLength(15);
    });
    expect(cardNamed("P13")).not.toHaveClass("bench-card");
    expect(cardNamed("P2")).toHaveClass("bench-card");
  });
});
