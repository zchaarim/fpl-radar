function toneFor(status: string, chance: number | null): "yellow" | "orange" | "red" | null {
  if (status === "s" || status === "u" || status === "n" || status === "i") return "red";
  if (chance == null) {
    return status === "d" ? "yellow" : null;
  }
  if (chance >= 100 && status === "a") return null;
  if (chance <= 0) return "red";
  if (chance <= 25) return "red";
  if (chance <= 50) return "orange";
  return "yellow";
}

export function Availability({
  status,
  chance,
  news,
}: {
  status: string;
  chance: number | null;
  news: string;
}) {
  const tone = toneFor(status, chance);
  if (!tone) return null;
  return (
    <div className={`avail avail-${tone}`} title={news || undefined}>
      <svg className="avail-icon" viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M8 1.4 14.8 14H1.2L8 1.4z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinejoin="round"
        />
        <rect x="7.25" y="6" width="1.5" height="4.2" fill="#141c27" />
        <rect x="7.25" y="11.1" width="1.5" height="1.5" fill="#141c27" />
      </svg>
      {chance != null && chance < 100 ? <span className="avail-pct">{chance}%</span> : null}
    </div>
  );
}
