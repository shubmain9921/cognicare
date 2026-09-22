'use client';

import { useState, useEffect } from 'react';
import { syncQueuedGameSessions } from '@/lib/offline/sync';
import { useI18n } from '@/lib/i18n/context';

export default function OfflineBanner() {
  const { dict } = useI18n();
  const [isOffline, setIsOffline] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  useEffect(() => {
    // Check initial online status
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }

    const handleOnline = async () => {
      setIsOffline(false);
      setSyncStatus((dict.common as any).syncing || 'Syncing offline results...');
      try {
        const result = await syncQueuedGameSessions();
        if (result.syncedCount > 0) {
          const syncSuccessMsg = (dict.common as any).syncedSuccess
            ? (dict.common as any).syncedSuccess.replace('{count}', String(result.syncedCount))
            : `✓ Synced ${result.syncedCount} game session${result.syncedCount > 1 ? 's' : ''}!`;
          setSyncStatus(syncSuccessMsg);
          setTimeout(() => setSyncStatus(null), 4000);
        } else {
          setSyncStatus(null);
        }
      } catch (err) {
        console.error('Error during auto-sync:', err);
        setSyncStatus(null);
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check for any pending items when component mounts while online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      syncQueuedGameSessions().then((res) => {
        if (res.syncedCount > 0) {
          const syncSuccessMsg = (dict.common as any).syncedSuccess
            ? (dict.common as any).syncedSuccess.replace('{count}', String(res.syncedCount))
            : `✓ Synced ${res.syncedCount} game session${res.syncedCount > 1 ? 's' : ''}!`;
          setSyncStatus(syncSuccessMsg);
          setTimeout(() => setSyncStatus(null), 3000);
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dict]);

  if (!isOffline && !syncStatus) {
    return null;
  }

  return (
    <div className="w-full fixed top-0 left-0 z-50 animate-fadeIn">
      {isOffline && (
        <div className="bg-amber-500 text-black px-4 py-2.5 shadow-md flex items-center justify-center gap-2 text-sm md:text-base font-extrabold border-b-2 border-black">
          <span className="text-xl">⚡</span>
          <span>{(dict.common as any).offlineBanner || 'Offline — results will sync later'}</span>
        </div>
      )}

      {!isOffline && syncStatus && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 shadow-md flex items-center justify-center gap-2 text-sm md:text-base font-extrabold border-b-2 border-emerald-800">
          <span className="text-xl">🔄</span>
          <span>{syncStatus}</span>
        </div>
      )}
    </div>
  );
}
