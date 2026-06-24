import type { HistoryVideoCard } from '../../interfaces/index.ts';

const DB_NAME = 'subdowns';
const DB_VERSION = 1;
const STORE = 'history';

type PersistedEntry = HistoryVideoCard & { video?: HistoryVideoCard['video']; author?: HistoryVideoCard['author'] };

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'timestamp' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(db: IDBDatabase, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const store = db.transaction(STORE, mode).objectStore(STORE);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveHistoryEntry(entry: Omit<HistoryVideoCard, 'timestamp'>): Promise<void> {
  try {
    const db = await openDB();
    const timestamp = Date.now();
    const plain = JSON.parse(JSON.stringify(entry)) as PersistedEntry;
    await tx(db, 'readwrite', (store) => store.add({ ...plain, timestamp }));
    db.close();
  } catch (err) {
    console.error('Failed to save download history to IndexedDB', err);
  }
}

export async function loadHistoryEntries(): Promise<HistoryVideoCard[]> {
  try {
    const db = await openDB();
    const all = await tx<PersistedEntry[]>(db, 'readonly', (store) => store.getAll());
    db.close();
    return all.sort((a, b) => b.timestamp - a.timestamp);
  } catch (err) {
    console.error('Failed to read download history from IndexedDB', err);
    return [];
  }
}

export async function clearHistoryEntries(): Promise<void> {
  try {
    const db = await openDB();
    await tx(db, 'readwrite', (store) => store.clear());
    db.close();
  } catch (err) {
    console.error('Failed to clear download history in IndexedDB', err);
  }
}
