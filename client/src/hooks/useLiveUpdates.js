import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api';

export function useLiveUpdates({ enabled = true, intervalMs = 20000 } = {}) {
  const mountTime = useRef(new Date().toISOString());
  const [newCount, setNewCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    const poll = async () => {
      try {
        const data = await api.getLastUpdate(mountTime.current);
        if (cancelled || !data) return;
        setNewCount(typeof data.newCount === 'number' ? data.newCount : 0);
        setLastUpdate(data.lastUpdate || null);
      } catch {
        // backend offline — silent
      }
    };
    poll();
    const id = setInterval(poll, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled, intervalMs, refreshKey]);

  const consumeUpdates = useCallback(() => {
    mountTime.current = new Date().toISOString();
    setNewCount(0);
    setUpdatedAt(new Date());
    setRefreshKey((k) => k + 1);
  }, []);

  return { newCount, lastUpdate, updatedAt, consumeUpdates, refreshKey };
}
