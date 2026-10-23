import { type FormEvent, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { RadarMark } from "../layout/RadarMark";
import { readStoredEntryId, storeEntryId } from "../storage";

export function EntryGate() {
  const stored = readStoredEntryId();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const switching = searchParams.get("switch") === "1";
  const [value, setValue] = useState(stored ?? "");
  const [error, setError] = useState("");

  if (stored && !switching) {
    return <Navigate to={`/${stored}`} replace />;
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) {
      setError("Enter your numeric FPL team id.");
      return;
    }
    storeEntryId(trimmed);
    navigate(`/${trimmed}`);
  }

  return (
    <div className="app-shell">
      <div className="gate">
        <div className="gate-brand">
          <RadarMark />
          <h1>FPL Radar</h1>
        </div>
        <p>
          {switching
            ? "Enter a different FPL team id. The board URL updates so you can share it."
            : "Enter your FPL team id to load the 15. It stays on this browser so refresh and shareable URLs work."}
        </p>
        <form onSubmit={onSubmit}>
          <input
            inputMode="numeric"
            autoComplete="off"
            placeholder="e.g. 123456"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label="FPL team id"
          />
          <button type="submit">{switching ? "Switch team" : "Open board"}</button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </div>
    </div>
  );
}
