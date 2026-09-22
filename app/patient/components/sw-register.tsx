'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('CogniCare Service Worker registered with scope:', registration.scope);
        })
        .catch((err) => {
          console.warn('Service Worker registration failed:', err);
        });
    }
  }, []);

  return null;
}
