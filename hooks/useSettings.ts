'use client';

import { useState, useEffect } from 'react';
import type { UserSettings } from '@/types';

export function useSettings() {
  const [settings, setSettings] = useState<Partial<UserSettings> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => setSettings(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { settings, loading };
}
