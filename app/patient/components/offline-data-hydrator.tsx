'use client';

import { useEffect } from 'react';
import {
  cachePatientReminders,
  cachePatientMemories,
  CachedReminderItem,
  CachedMemoryItem,
} from '@/lib/offline/db';

export default function OfflineDataHydrator({
  reminders,
  memories,
}: {
  reminders?: CachedReminderItem[];
  memories?: CachedMemoryItem[];
}) {
  useEffect(() => {
    if (reminders && reminders.length > 0) {
      cachePatientReminders(reminders).catch((err) =>
        console.warn('Failed to cache reminders in IndexedDB:', err)
      );
    }
    if (memories && memories.length > 0) {
      cachePatientMemories(memories).catch((err) =>
        console.warn('Failed to cache memories in IndexedDB:', err)
      );
    }
  }, [reminders, memories]);

  return null;
}
