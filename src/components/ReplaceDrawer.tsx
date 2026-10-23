import { useEffect, useState } from "react";
import { ApiError, searchPlayers } from "../api/client";
import type { BoardPlayer, PlayerSearchHit } from "../api/types";

type Props = {
  player: BoardPlayer;
  takenIds: Set<number>;
  bankTenths: number;
  onPick: (hit: PlayerSearchHit) => void;
  onClose: () => void;
};

export function ReplaceDrawer({ player, takenIds, bankTenths, onPick, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<PlayerSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setError("");
      setLoading(false);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      searchPlayers(q, player.element_type)
        .then((payload) => {
          if (cancelled) return;
          setHits(payload.players);
          setError("");
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setHits([]);
          setError(err instanceof ApiError ? err.message : "Search failed.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, player.element_type]);

  const visible = hits.filter((row) => row.element_id !== player.element_id && !takenIds.has(row.element_id));
  const sell = player.selling_price?.tenths ?? player.now_cost.tenths;

  return (
    <aside className="drawer" aria-label={`Replace ${player.web_name}`}>
      <div className="drawer-head">
        <div>
          <div className="drawer-kicker">Replace</div>
          <strong>
            {player.web_name} · {player.team_short}
          </strong>
        </div>
        <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <p className="drawer-copy">Same position. Must leave budget at £0.0m or more (sell {player.web_name} at £{(sell / 10).toFixed(1)}m).</p>
      <input
        className="drawer-search"
        autoFocus
        value={query}
        placeholder="Type a name…"
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search players"
      />
      {loading ? <div className="loading">Searching…</div> : null}
      {error ? <p className="error">{error}</p> : null}
      <ul className="replace-list">
        {visible.map((row) => {
          const after = bankTenths + sell - row.now_cost.tenths;
          const affordable = after >= 0;
          return (
            <li key={row.element_id}>
              <button type="button" disabled={!affordable} onClick={() => affordable && onPick(row)}>
                <span className="replace-name">{row.web_name}</span>
                <span className="replace-meta">
                  {row.team_short} · £{row.now_cost.pounds.toFixed(1)}
                  {affordable ? ` · bank £${(after / 10).toFixed(1)}m` : " · over budget"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {!loading && query.trim().length >= 2 && visible.length === 0 ? <p className="drawer-copy">No matching players.</p> : null}
    </aside>
  );
}
