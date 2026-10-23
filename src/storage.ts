export const ENTRY_STORAGE_KEY = "fpl-radar:entryId";

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
