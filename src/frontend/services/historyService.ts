import type { HistoryVideoCard } from '../../interfaces/index.ts';

const STORAGE_KEY = 'subdowns.history';

type PersistedEntry = HistoryVideoCard & { video?: HistoryVideoCard['video']; author?: HistoryVideoCard['author'] };

function readAll(): PersistedEntry[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as PersistedEntry[] : [];
  } catch (err) {
    console.error('Failed to read download history from localStorage', err);
    return [];
  }
}

function writeAll(entries: PersistedEntry[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error('Failed to write download history to localStorage', err);
  }
}

export async function saveHistoryEntry(entry: Omit<HistoryVideoCard, 'timestamp'>): Promise<void> {
  const entries = readAll();
  const timestamp = Date.now();
  const next: PersistedEntry = { ...entry, timestamp };
  entries.unshift(next);
  writeAll(entries);
}

export async function loadHistoryEntries(): Promise<HistoryVideoCard[]> {
  return readAll();
}

export async function clearHistoryEntries(): Promise<void> {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
