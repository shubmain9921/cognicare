import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { GameSessionPayload } from '@/app/actions/games';
import { MemoryCategory } from '@/types/database.types';

export interface QueuedGameSession {
  id?: number;
  payload: GameSessionPayload;
  queuedAt: number;
  attempts?: number;
}

export interface CachedReminderItem {
  id: string;
  type: 'recurring' | 'one_time';
  title: string;
  scheduled_time: string;
  recurrence_rule: string | null;
  is_done: boolean;
}

export interface CachedMemoryItem {
  id: string;
  category: MemoryCategory;
  key_term: string;
  description: string;
}

interface CogniCareOfflineDB extends DBSchema {
  queued_sessions: {
    key: number;
    value: QueuedGameSession;
    autoIncrement: true;
  };
  cached_reminders: {
    key: string;
    value: CachedReminderItem;
  };
  cached_memories: {
    key: string;
    value: CachedMemoryItem;
  };
  patient_meta: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'cognicare-offline-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<CogniCareOfflineDB>> | null = null;

export function getOfflineDB(): Promise<IDBPDatabase<CogniCareOfflineDB>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is only accessible in browser environment.'));
  }

  if (!dbPromise) {
    dbPromise = openDB<CogniCareOfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('queued_sessions')) {
          db.createObjectStore('queued_sessions', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }
        if (!db.objectStoreNames.contains('cached_reminders')) {
          db.createObjectStore('cached_reminders', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cached_memories')) {
          db.createObjectStore('cached_memories', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('patient_meta')) {
          db.createObjectStore('patient_meta');
        }
      },
    });
  }

  return dbPromise;
}

// -----------------------------------------------------------------------------
// Queued Game Sessions
// -----------------------------------------------------------------------------

export async function queueGameSession(payload: GameSessionPayload): Promise<number> {
  const db = await getOfflineDB();
  return db.add('queued_sessions', {
    payload,
    queuedAt: Date.now(),
    attempts: 0,
  });
}

export async function getQueuedGameSessions(): Promise<QueuedGameSession[]> {
  const db = await getOfflineDB();
  return db.getAll('queued_sessions');
}

export async function deleteQueuedGameSession(id: number): Promise<void> {
  const db = await getOfflineDB();
  return db.delete('queued_sessions', id);
}

export async function clearQueuedGameSessions(): Promise<void> {
  const db = await getOfflineDB();
  return db.clear('queued_sessions');
}

// -----------------------------------------------------------------------------
// Reminders Caching
// -----------------------------------------------------------------------------

export async function cachePatientReminders(reminders: CachedReminderItem[]): Promise<void> {
  const db = await getOfflineDB();
  const tx = db.transaction('cached_reminders', 'readwrite');
  await tx.store.clear();
  for (const r of reminders) {
    await tx.store.put(r);
  }
  await tx.done;
}

export async function getCachedPatientReminders(): Promise<CachedReminderItem[]> {
  const db = await getOfflineDB();
  return db.getAll('cached_reminders');
}

// -----------------------------------------------------------------------------
// Memories Caching
// -----------------------------------------------------------------------------

export async function cachePatientMemories(memories: CachedMemoryItem[]): Promise<void> {
  const db = await getOfflineDB();
  const tx = db.transaction('cached_memories', 'readwrite');
  await tx.store.clear();
  for (const m of memories) {
    await tx.store.put(m);
  }
  await tx.done;
}

export async function getCachedPatientMemories(): Promise<CachedMemoryItem[]> {
  const db = await getOfflineDB();
  return db.getAll('cached_memories');
}

// -----------------------------------------------------------------------------
// Patient Metadata Caching
// -----------------------------------------------------------------------------

export async function setPatientMeta(key: string, value: any): Promise<void> {
  const db = await getOfflineDB();
  await db.put('patient_meta', value, key);
}

export async function getPatientMeta<T>(key: string): Promise<T | undefined> {
  const db = await getOfflineDB();
  return db.get('patient_meta', key);
}
