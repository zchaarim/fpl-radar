import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ApiError, fetchBoard } from "../api/client";
import type { BoardPlayer, BoardResponse, MetricId, PlayerSearchHit } from "../api/types";
import { PlayerCard } from "../components/PlayerCard";
import { ReplaceDrawer } from "../components/ReplaceDrawer";
import { Shell } from "../layout/Shell";
import {
  appliedXp,
  armbandIds,
  assignArmband,
  isStarter,
  legalStarterIdsForSub,
  pinArmbandsToXi,
  sortPlayers,
  substitutePlayers,
} from "../squadRules";
import {
  clearSquadSession,
  readDraft,
  readSavedSquad,
  saveSquadSnapshot,
  snapshotFingerprint,
  storeEntryId,
  writeDraft,
  type SquadSnapshot,
} from "../storage";

const XI_ROWS: { type: number; label: string }[] = [
  { type: 1, label: "GKP" },
  { type: 2, label: "DEF" },
  { type: 3, label: "MID" },
  { type: 4, label: "FWD" },
];

const MAX_FT = 5;

export function SquadBoard() {
  const { entryId = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const eventParam = searchParams.get("event");
  const eventFromUrl = eventParam && /^\d+$/.test(eventParam) ? Number(eventParam) : undefined;

  const stored = readDraft(entryId) ?? readSavedSquad(entryId);
  const [board, setBoard] = useState<BoardResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<MetricId>("xp");
  const [elements, setElements] = useState<number[] | undefined>(stored?.elements);
  const [ftOverride, setFtOverride] = useState<number | undefined>(stored?.ft);
  const [bankOverride, setBankOverride] = useState<number | undefined>(stored?.bank);
  const [captainId, setCaptainId] = useState<number | undefined>(stored?.captain);
  const [viceId, setViceId] = useState<number | undefined>(stored?.vice);
  const [replacing, setReplacing] = useState<BoardPlayer | null>(null);
  const [subbing, setSubbing] = useState<BoardPlayer | null>(null);
  const [subError, setSubError] = useState("");
  const [fresh, setFresh] = useState(0);
  const [sessionTick, setSessionTick] = useState(0);
  const boardRef = useRef<BoardResponse | null>(null);
  boardRef.current = board;

  useEffect(() => {
    if (!/^\d+$/.test(entryId)) {
      navigate("/", { replace: true });
      return;
    }
    storeEntryId(entryId);
    const next = readDraft(entryId) ?? readSavedSquad(entryId);
    setElements((prev) => {
      const incoming = next?.elements;
      if (prev?.join(",") === incoming?.join(",")) return prev;
      return incoming;
    });
    setFtOverride(next?.ft);
    setBankOverride(next?.bank);
    setCaptainId(next?.captain);
    setViceId(next?.vice);
  }, [entryId, navigate]);

  useEffect(() => {
    if (!/^\d+$/.test(entryId)) return;
    let cancelled = false;
    const current = boardRef.current;
    const currentSet = current ? [...current.players.map((p) => p.element_id)].sort().join(",") : "";
    const nextSet = elements ? [...elements].sort().join(",") : "";
    if (current && elements && currentSet === nextSet && (eventFromUrl == null || eventFromUrl === current.event.id)) {
      return;
    }
    if (!current) setLoading(true);
    setError("");
    fetchBoard(Number(entryId), {
      event: eventFromUrl,
      elements,
      bank: bankOverride,
      captain: captainId,
      vice: viceId,
    })
      .then((payload) => {
        if (cancelled) return;
        const players = pinArmbandsToXi(payload.players);
        const bands = armbandIds(players);
        setBoard({
          ...payload,
          players,
          team_xp: players.reduce((sum, player) => sum + appliedXp(player), 0),
        });
        setCaptainId(bands.captain);
        setViceId(bands.vice);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError) {
          if (err.status === 400 && eventFromUrl != null) {
            setSearchParams({}, { replace: true });
            return;
          }
          setError(err.status === 404 ? "Entry not found." : err.message);
        } else {
          setError("Could not reach the API. Is the backend running on port 8000?");
        }
        if (!boardRef.current) setBoard(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entryId, eventFromUrl, elements, fresh, setSearchParams]);

  const events = board?.events ?? [];
  const selectedId = board?.event.id;
  const selectedIndex = events.findIndex((e) => e.id === selectedId);
  const canPrev = selectedIndex > 0;
  const canNext = selectedIndex >= 0 && selectedIndex < events.length - 1;
  const replaceable = board?.mode === "predicted";
  const ftShown = ftOverride ?? board?.free_transfers ?? 0;
  const ftLabel =
    ftOverride != null ? "Adjusted here" : board?.free_transfers_source === "history_estimate" ? "Estimated" : "";
  const bankPounds = bankOverride ?? board?.bank.pounds ?? 0;
  const bankTenths = Math.round(bankPounds * 10);
  const bankLabel = bankOverride != null ? "Adjusted here" : "";
  const takenIds = useMemo(() => new Set((board?.players ?? []).map((p) => p.element_id)), [board]);
  const teamXp = useMemo(
    () => (board ? board.players.reduce((sum, player) => sum + appliedXp(player), 0) : 0),
    [board],
  );
  const legalSubTargets = useMemo(
    () => (board && subbing ? legalStarterIdsForSub(board.players, subbing) : new Set<number>()),
    [board, subbing],
  );

  function goEvent(nextId: number) {
    setSearchParams({ event: String(nextId) });
    setReplacing(null);
    setSubbing(null);
  }

  useEffect(() => {
    if (!subbing && !replacing) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSubbing(null);
        setReplacing(null);
        setSubError("");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [subbing, replacing]);

  function rememberDraft(patch: Omit<SquadSnapshot, "entryId">) {
    writeDraft(entryId, {
      elements: patch.elements ?? elements,
      ft: patch.ft ?? ftOverride,
      bank: patch.bank ?? bankOverride,
      captain: patch.captain ?? captainId,
      vice: patch.vice ?? viceId,
    });
    setSessionTick((value) => value + 1);
  }

  function persistSquad(players: BoardPlayer[]) {
    const ids = sortPlayers(players).map((p) => p.element_id);
    const bands = armbandIds(players);
    setElements(ids);
    setCaptainId(bands.captain);
    setViceId(bands.vice);
    rememberDraft({ elements: ids, captain: bands.captain, vice: bands.vice });
  }

  function applySub(benchPlayer: BoardPlayer, starter: BoardPlayer) {
    if (!board) return;
    const next = substitutePlayers(board.players, benchPlayer, starter);
    if (!next) {
      setSubError("That sub would not be a legal XI (1 GK, 3–5 DEF, 2–5 MID, 1–3 FWD).");
      return;
    }
    const teamXpNext = next.reduce((sum, player) => sum + appliedXp(player), 0);
    setSubError("");
    setBoard({ ...board, players: next, team_xp: Math.round(teamXpNext * 1000) / 1000 });
    persistSquad(next);
    setSubbing(null);
    setReplacing(null);
  }

  function onSubTarget(player: BoardPlayer) {
    if (!replaceable || !subbing) return;
    if (legalSubTargets.has(player.element_id)) applySub(subbing, player);
  }

  function onReplace(player: BoardPlayer) {
    if (!replaceable) return;
    setSubbing(null);
    setReplacing(player);
  }

  function applyArmband(player: BoardPlayer, role: "captain" | "vice") {
    if (!board || !replaceable || !isStarter(player)) return;
    const next = assignArmband(board.players, player, role);
    const teamXpNext = next.reduce((sum, row) => sum + appliedXp(row), 0);
    setBoard({ ...board, players: next, team_xp: Math.round(teamXpNext * 1000) / 1000 });
    persistSquad(next);
  }

  function onBenchSubClick(player: BoardPlayer) {
    if (!replaceable) return;
    if (subbing?.element_id === player.element_id) {
      setSubbing(null);
      setSubError("");
      return;
    }
    setSubbing(player);
    setReplacing(null);
    setSubError("");
  }

  function applyReplacement(hit: PlayerSearchHit) {
    if (!board || !replacing) return;
    const sell = replacing.selling_price?.tenths ?? replacing.now_cost.tenths;
    const afterTenths = bankTenths + sell - hit.now_cost.tenths;
    if (afterTenths < 0) return;
    const nextBank = Math.round(afterTenths) / 10;
    const currentIds = sortPlayers(board.players).map((p) => p.element_id);
    const nextIds = currentIds.map((id) => (id === replacing.element_id ? hit.element_id : id));
    const nextCaptain = replacing.is_captain ? hit.element_id : captainId;
    const nextVice = replacing.is_vice_captain ? hit.element_id : viceId;
    setElements(nextIds);
    setBankOverride(nextBank);
    setCaptainId(nextCaptain);
    setViceId(nextVice);
    rememberDraft({
      elements: nextIds,
      bank: nextBank,
      captain: nextCaptain,
      vice: nextVice,
    });
    setReplacing(null);
  }

  function currentSnapshot(): SquadSnapshot | null {
    if (!board) return null;
    return {
      entryId,
      elements: sortPlayers(board.players).map((player) => player.element_id),
      ft: ftOverride ?? board.free_transfers,
      bank: bankOverride ?? board.bank.pounds,
      captain: captainId,
      vice: viceId,
    };
  }

  function saveSquad() {
    const snapshot = currentSnapshot();
    if (!snapshot) return;
    saveSquadSnapshot(snapshot);
    setSessionTick((value) => value + 1);
  }

  function resetSquad() {
    clearSquadSession(entryId);
    setElements(undefined);
    setBankOverride(undefined);
    setFtOverride(undefined);
    setCaptainId(undefined);
    setViceId(undefined);
    setReplacing(null);
    setSubbing(null);
    setSubError("");
    setBoard(null);
    setLoading(true);
    setFresh((value) => value + 1);
    setSessionTick((value) => value + 1);
  }

  function adjustFt(delta: number) {
    const base = ftOverride ?? board?.free_transfers ?? 1;
    const next = Math.max(0, Math.min(MAX_FT, base + delta));
    setFtOverride(next);
    rememberDraft({ ft: next });
  }

  function adjustBank(deltaTenths: number) {
    const nextTenths = Math.max(0, bankTenths + deltaTenths);
    const next = nextTenths / 10;
    setBankOverride(next);
    rememberDraft({ bank: next });
  }

  const xiGrouped = useMemo(() => {
    const xi = sortPlayers(board?.players ?? []).filter(isStarter);
    return XI_ROWS.map((row) => ({
      ...row,
      players: xi.filter((p) => p.element_type === row.type),
    }));
  }, [board]);

  const bench = useMemo(() => sortPlayers(board?.players ?? []).filter((p) => !isStarter(p)), [board]);
  const savedSquad = useMemo(() => readSavedSquad(entryId), [entryId, sessionTick]);
  const draftSquad = useMemo(() => readDraft(entryId), [entryId, sessionTick]);
  const hasEdits = Boolean(elements || bankOverride != null || ftOverride != null || draftSquad);
  const savedForTabs = Boolean(savedSquad);
  const unsaved = snapshotFingerprint(currentSnapshot()) !== snapshotFingerprint(savedSquad);

  return (
    <Shell entryId={entryId}>
      {board?.placeholder ? (
        <div className="banner">Model features are not ready yet — showing FPL ep_next as placeholder xP.</div>
      ) : null}
      {loading && !board ? <div className="loading">Loading squad…</div> : null}
      {error ? (
        <p className="error">
          {error}{" "}
          <Link to="/?switch=1">Change FPL ID</Link>
        </p>
      ) : null}
      {board ? (
        <>
          <section className="summary-panel">
            <div className="summary-main">
              <h1>{board.name || `Team ${board.entry_id}`}</h1>
              <div className="stat-tiles">
                <div className="stat-tile ft-tile">
                  <span className="stat-label">Budget</span>
                  <span className="stat-value ft-value">
                    <button type="button" className="ft-btn" onClick={() => adjustBank(-1)} aria-label="Lower budget">
                      <span>−</span>
                    </button>
                    £{bankPounds.toFixed(1)}m
                    <button type="button" className="ft-btn" onClick={() => adjustBank(1)} aria-label="Raise budget">
                      <span>+</span>
                    </button>
                  </span>
                  {bankLabel ? <span className="stat-hint">{bankLabel}</span> : null}
                </div>
                <div className="stat-tile ft-tile">
                  <span className="stat-label">Free transfers</span>
                  <span className="stat-value ft-value">
                    <button type="button" className="ft-btn" onClick={() => adjustFt(-1)} aria-label="Fewer free transfers">
                      <span>−</span>
                    </button>
                    {ftShown}
                    <button type="button" className="ft-btn" onClick={() => adjustFt(1)} aria-label="More free transfers">
                      <span>+</span>
                    </button>
                  </span>
                  {ftLabel ? <span className="stat-hint">{ftLabel}</span> : null}
                </div>
                <div className="stat-tile">
                  <span className="stat-label">
                    XI <em>xP</em>
                  </span>
                  <span className="stat-value">{teamXp.toFixed(1)}</span>
                  <span className="stat-hint">Captain ×2, bench out</span>
                </div>
              </div>
            </div>
            <div className="summary-side">
              <div className="id-row">
                <span>FPL ID: {entryId}</span>
                <Link to="/?switch=1">Change</Link>
              </div>
              <div className="controls">
                <div className="gw-strip">
                  <button
                    type="button"
                    disabled={!canPrev}
                    onClick={() => canPrev && goEvent(events[selectedIndex - 1].id)}
                    aria-label="Previous gameweek"
                  >
                    ‹
                  </button>
                  <div className="gw-label">GW {board.event.id}</div>
                  <button
                    type="button"
                    disabled={!canNext}
                    onClick={() => canNext && goEvent(events[selectedIndex + 1].id)}
                    aria-label="Next gameweek"
                  >
                    ›
                  </button>
                </div>
                <select
                  className="metric"
                  value={metric}
                  onChange={(e) => setMetric(e.target.value as MetricId)}
                  aria-label="Player metric"
                >
                  <option value="xp">Expected points</option>
                  <option value="opponent">Opponent</option>
                  <option value="xgi90">xGI/90</option>
                  <option value="ownership">Ownership %</option>
                </select>
              </div>
            </div>
          </section>
          {replaceable ? (
            <div className="board-toolbar">
              <p className="board-hint">
                {subbing
                  ? `Choose a highlighted starter to swap in ${subbing.web_name}. Illegal options are dimmed.`
                  : "Click a player for info or replace. Use the swap arrows on the bench to substitute."}
              </p>
              <div className="board-actions">
                <button type="button" className="save-btn" onClick={saveSquad}>
                  Save squad
                </button>
                {hasEdits || savedForTabs ? (
                  <button type="button" className="text-btn" onClick={resetSquad}>
                    Reset to defaults
                  </button>
                ) : null}
                <span className="save-status">
                  {savedForTabs
                    ? unsaved
                      ? "Unsaved — other tabs still use the last save"
                      : "Saved for Transfers and Plan this session"
                    : "Save this XI, bench, budget, FTs, and armbands for other tabs"}
                </span>
              </div>
            </div>
          ) : null}
          {subError ? <p className="error">{subError}</p> : null}
          <div className={`pitch-wrap${replacing ? " with-drawer" : ""}`}>
            <div className="pitch">
              {xiGrouped.map((row) =>
                row.players.length ? (
                  <section key={row.type} className="pitch-section">
                    <div className="pitch-row">
                      {row.players.map((player) => (
                        <PlayerCard
                          key={`${player.position}-${player.element_id}`}
                          player={player}
                          metric={metric}
                          interactive={replaceable}
                          selected={replacing?.element_id === player.element_id}
                          subTone={
                            subbing
                              ? legalSubTargets.has(player.element_id)
                                ? "legal"
                                : "illegal"
                              : undefined
                          }
                          onSelect={subbing ? onSubTarget : undefined}
                          onReplace={subbing ? undefined : onReplace}
                          onMakeCaptain={subbing ? undefined : (p) => applyArmband(p, "captain")}
                          onMakeVice={subbing ? undefined : (p) => applyArmband(p, "vice")}
                        />
                      ))}
                    </div>
                  </section>
                ) : null,
              )}
              {bench.length ? (
                <section className="pitch-section bench-section">
                  <div className="row-label">BENCH</div>
                  <div className="pitch-row">
                    {bench.map((player) => (
                      <PlayerCard
                        key={`${player.position}-${player.element_id}`}
                        player={player}
                        metric={metric}
                        interactive={replaceable}
                        selected={subbing?.element_id === player.element_id}
                        subTone={subbing?.element_id === player.element_id ? "source" : undefined}
                        onReplace={subbing ? undefined : onReplace}
                        onSubClick={replaceable ? onBenchSubClick : undefined}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
            {replacing && replaceable ? (
              <ReplaceDrawer
                player={replacing}
                takenIds={takenIds}
                bankTenths={bankTenths}
                onPick={applyReplacement}
                onClose={() => setReplacing(null)}
              />
            ) : null}
          </div>
        </>
      ) : null}
    </Shell>
  );
}
