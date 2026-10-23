export function RadarMark() {
  return (
    <svg className="radar-mark" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.35" />
      <circle cx="16" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.55" />
      <circle cx="16" cy="16" r="4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M16 16 L27 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="16" cy="16" r="1.8" fill="currentColor" />
    </svg>
  );
}
