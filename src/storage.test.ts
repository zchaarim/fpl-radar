import { afterEach, describe, expect, it } from "vitest";
import {
  clearSquadSession,
  readDraft,
  readSavedSquad,
  readStoredEntryId,
  saveSquadSnapshot,
  snapshotFingerprint,
  storeEntryId,
  writeDraft,
} from "./storage";

afterEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

describe("entry id", () => {
  it("stores and reads a numeric FPL id", () => {
    storeEntryId("2073702");
    expect(readStoredEntryId()).toBe("2073702");
  });

  it("ignores a non-numeric stored id", () => {
    localStorage.setItem("fpl-radar:entryId", "abc");
    expect(readStoredEntryId()).toBeNull();
  });
});

describe("draft vs saved", () => {
  it("keeps an in-progress draft off the saved snapshot until Save", () => {
    writeDraft("99", { elements: [1, 2, 3], ft: 2 });
    expect(readDraft("99")?.elements).toEqual([1, 2, 3]);
    expect(readSavedSquad("99")).toBeNull();
  });

  it("Save writes both draft and saved for that entry", () => {
    saveSquadSnapshot({ entryId: "99", elements: [1], ft: 1, bank: 0.5, captain: 11, vice: 10 });
    expect(readDraft("99")?.captain).toBe(11);
    expect(readSavedSquad("99")?.elements).toEqual([1]);
  });

  it("later draft edits do not change the last save", () => {
    saveSquadSnapshot({ entryId: "99", elements: [1, 2], ft: 1 });
    writeDraft("99", { ft: 3 });
    expect(readDraft("99")?.ft).toBe(3);
    expect(readSavedSquad("99")?.ft).toBe(1);
  });

  it("does not return another entry's snapshot", () => {
    writeDraft("99", { ft: 2 });
    expect(readDraft("100")).toBeNull();
  });

  it("Reset clears draft and saved for this entry", () => {
    saveSquadSnapshot({ entryId: "99", elements: [1], ft: 2 });
    clearSquadSession("99");
    expect(readDraft("99")).toBeNull();
    expect(readSavedSquad("99")).toBeNull();
  });

  it("treats invalid JSON as missing", () => {
    sessionStorage.setItem("fpl-radar:draftSquad", "{not-json");
    expect(readDraft("99")).toBeNull();
  });

  it("fingerprint ignores entryId so unsaved compares squad content", () => {
    const a = { entryId: "1", elements: [1, 2], ft: 1 };
    const b = { entryId: "2", elements: [1, 2], ft: 1 };
    expect(snapshotFingerprint(a)).toBe(snapshotFingerprint(b));
    expect(snapshotFingerprint({ ...a, ft: 2 })).not.toBe(snapshotFingerprint(a));
  });
});
