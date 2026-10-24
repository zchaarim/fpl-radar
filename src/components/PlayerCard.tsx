import { useEffect, useRef, useState } from "react";
import type { BoardPlayer, MetricId } from "../api/types";
import { appliedXp, isStarter } from "../squadRules";
import { Availability } from "./Availability";

function photoUrl(code: number): string {
  return `https://resources.premierleague.com/premierleague/photos/players/250x250/p${code}.png`;
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatMetric(player: BoardPlayer, metric: MetricId): string {
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

function SwapIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M11.5 4H3.5M3.5 4 6 1.75M3.5 4 6 6.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 12h8M12.5 12 10 9.75M12.5 12 10 14.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type SubTone = "source" | "legal" | "illegal";

type Props = {
  player: BoardPlayer;
  metric: MetricId;
  interactive?: boolean;
  selected?: boolean;
  subTone?: SubTone;
  onSelect?: (player: BoardPlayer) => void;
  onReplace?: (player: BoardPlayer) => void;
  onMakeCaptain?: (player: BoardPlayer) => void;
  onMakeVice?: (player: BoardPlayer) => void;
  onSubClick?: (player: BoardPlayer) => void;
};

export function PlayerCard({
  player,
  metric,
  interactive,
  selected,
  subTone,
  onSelect,
  onReplace,
  onMakeCaptain,
  onMakeVice,
  onSubClick,
}: Props) {
  const [broken, setBroken] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const showPhoto = player.photo_code != null && !broken;
  const subTarget = Boolean(onSelect && subTone === "legal");
  const clickable = Boolean(interactive && (subTarget || onReplace) && subTone !== "illegal");
  const roles = [
    "card",
    interactive ? "replaceable" : "",
    selected ? "selected" : "",
    menuOpen ? "menu-open" : "",
    player.is_captain ? "captain" : "",
    player.is_vice_captain && !player.is_captain ? "vice" : "",
    isStarter(player) ? "" : "bench-card",
    subTone ? `sub-${subTone}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function onFaceClick() {
    if (!clickable) return;
    if (subTarget) {
      onSelect?.(player);
      setMenuOpen(false);
      return;
    }
    setMenuOpen((open) => !open);
  }

  const body = (
    <>
      {showPhoto ? (
        <img
          src={photoUrl(player.photo_code as number)}
          alt=""
          onError={() => setBroken(true)}
        />
      ) : (
        <div className="initials">{initials(player.web_name)}</div>
      )}
      <div className="name">
        {player.web_name}
        {player.is_captain ? " (C)" : player.is_vice_captain ? " (VC)" : ""}
      </div>
      <div className="meta">
        <span className="club">{player.team_short}</span>
        <span className="meta-sep">·</span>
        <span className="price">£{player.now_cost.pounds.toFixed(1)}m</span>
      </div>
      <div className="metric-value">
        <span>{formatMetric(player, metric)}</span>
        {metric === "xp" && player.is_captain && isStarter(player) ? (
          <span className="cap-mult">({player.metric_xp.toFixed(1)} ×2)</span>
        ) : null}
        {metric === "actual" &&
        player.is_captain &&
        isStarter(player) &&
        player.minutes_played != null &&
        player.minutes_played > 0 ? (
          <span className="cap-mult">({(player.metric_actual ?? 0).toFixed(0)} ×2)</span>
        ) : null}
      </div>
    </>
  );
  return (
    <article className={roles} ref={rootRef}>
      {clickable ? (
        <button type="button" className="card-face" onClick={onFaceClick}>
          {body}
        </button>
      ) : (
        <div className="card-face static">{body}</div>
      )}
      <Availability status={player.status} chance={player.chance_of_playing} news={player.news} />
      {onSubClick ? (
        <button
          type="button"
          className={`sub-btn${subTone === "source" ? " active" : ""}`}
          onClick={() => {
            setMenuOpen(false);
            onSubClick(player);
          }}
          aria-label={`Substitute ${player.web_name}`}
          title="Substitute"
        >
          <SwapIcon />
        </button>
      ) : null}
      {menuOpen && onReplace ? (
        <div className="card-menu" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => setMenuOpen(false)}
            title="Player details coming soon"
          >
            Info
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              onReplace(player);
            }}
          >
            Replace
          </button>
          {!player.is_captain && isStarter(player) && onMakeCaptain ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onMakeCaptain(player);
              }}
            >
              Make Captain
            </button>
          ) : null}
          {!(player.is_vice_captain && !player.is_captain) && isStarter(player) && onMakeVice ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onMakeVice(player);
              }}
            >
              Make Vice Captain
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
