export const ENTRY_STORAGE_KEY = "fpl-radar:entryId";

const DRAFT_KEY = "fpl-radar:draftSquad";
const SAVED_KEY = "fpl-radar:savedSquad";
const LEGACY_PREFIX = "fpl-radar:overrides:";

export type SquadSnapshot = {
  entryId: string;
  ft?: number;
  bank?: number;
  elements?: number[];
  captain?: number;
  vice?: number;
};

function forgetLegacyOverrides() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LEGACY_PREFIX)) keys.push(key);
    }
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

forgetLegacyOverrides();

function readSession(key: string, entryId: string): SquadSnapshot | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SquadSnapshot;
    if (!parsed || parsed.entryId !== entryId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(key: string, snapshot: SquadSnapshot) {
  const next: SquadSnapshot = { entryId: snapshot.entryId };
  if (snapshot.elements != null) next.elements = snapshot.elements;
  if (snapshot.ft != null) next.ft = snapshot.ft;
  if (snapshot.bank != null) next.bank = snapshot.bank;
  if (snapshot.captain != null) next.captain = snapshot.captain;
  if (snapshot.vice != null) next.vice = snapshot.vice;
  sessionStorage.setItem(key, JSON.stringify(next));
}

export function readStoredEntryId(): string | null {
  try {
    const value = localStorage.getItem(ENTRY_STORAGE_KEY);
    return value && /^\d+$/.test(value) ? value : null;
  } catch {
    return null;
  }
}

export function storeEntryId(entryId: string): void {
  localStorage.setItem(ENTRY_STORAGE_KEY, entryId);
}

/** In-progress board edits for this tab session. */
export function readDraft(entryId: string): SquadSnapshot | null {
  return readSession(DRAFT_KEY, entryId);
}

export function writeDraft(entryId: string, patch: Omit<SquadSnapshot, "entryId">): void {
  const current = readDraft(entryId) ?? { entryId };
  writeSession(DRAFT_KEY, { ...current, ...patch, entryId });
}

/** Last explicitly saved squad — what Transfers and Plan should use. */
export function readSavedSquad(entryId: string): SquadSnapshot | null {
  return readSession(SAVED_KEY, entryId);
}

export function saveSquadSnapshot(snapshot: SquadSnapshot): void {
  writeSession(DRAFT_KEY, snapshot);
  writeSession(SAVED_KEY, snapshot);
}

export function clearSquadSession(entryId: string): void {
  const draft = readSession(DRAFT_KEY, entryId);
  if (draft) sessionStorage.removeItem(DRAFT_KEY);
  const saved = readSession(SAVED_KEY, entryId);
  if (saved) sessionStorage.removeItem(SAVED_KEY);
}

export function snapshotFingerprint(snapshot: SquadSnapshot | null): string {
  if (!snapshot) return "";
  return JSON.stringify({
    elements: snapshot.elements ?? null,
    ft: snapshot.ft ?? null,
    bank: snapshot.bank ?? null,
    captain: snapshot.captain ?? null,
    vice: snapshot.vice ?? null,
  });
}
