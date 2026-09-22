'use client';

import {
  queueGameSession,
  getQueuedGameSessions,
  deleteQueuedGameSession,
  QueuedGameSession,
} from './db';
import { logGameSession, GameSessionPayload, LogGameResult } from '@/app/actions/games';

/**
 * Logs a game session immediately if online, or queues it to IndexedDB if offline.
 */
export async function logGameSessionWithOfflineSupport(
  payload: GameSessionPayload
): Promise<LogGameResult & { offlineQueued?: boolean }> {
  // If browser is offline, store in IndexedDB queue
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    try {
      const queueId = await queueGameSession(payload);
      return {
        success: true,
        offlineQueued: true,
        sessionId: `local-offline-${queueId}`,
      };
    } catch (dbErr) {
      console.error('Failed to queue game session in IndexedDB:', dbErr);
      return { error: 'Failed to queue offline session.' };
    }
  }

  // If online, try server action
  try {
    const result = await logGameSession(payload);
    if (result.error) {
      // If network failed during action, fallback to queue
      const queueId = await queueGameSession(payload);
      return {
        success: true,
        offlineQueued: true,
        sessionId: `local-offline-${queueId}`,
      };
    }
    return result;
  } catch (err) {
    console.warn('Network error logging session, fallback to offline queue:', err);
    const queueId = await queueGameSession(payload);
    return {
      success: true,
      offlineQueued: true,
      sessionId: `local-offline-${queueId}`,
    };
  }
}

/**
 * Synchronizes all queued game sessions to Supabase.
 * Returns count of successfully synced items.
 */
export async function syncQueuedGameSessions(): Promise<{
  syncedCount: number;
  remainingCount: number;
}> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { syncedCount: 0, remainingCount: 0 };
  }

  const queued: QueuedGameSession[] = await getQueuedGameSessions();
  if (!queued || queued.length === 0) {
    return { syncedCount: 0, remainingCount: 0 };
  }

  let syncedCount = 0;

  for (const item of queued) {
    if (!item.id) continue;

    try {
      const res = await logGameSession(item.payload);
      if (res.success) {
        await deleteQueuedGameSession(item.id);
        syncedCount++;
      }
    } catch (syncErr) {
      console.error(`Failed to sync queued session ${item.id}:`, syncErr);
    }
  }

  const remaining = await getQueuedGameSessions();
  return {
    syncedCount,
    remainingCount: remaining.length,
  };
}
