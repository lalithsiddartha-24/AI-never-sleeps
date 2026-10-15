import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import api from '../api';

const STORAGE_KEY = 'aihub:bookmarks:default';
const USER_ID = 'default';

const BookmarkContext = createContext(null);

function readLocal() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function writeLocal(set) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // storage unavailable
  }
}

export function BookmarkProvider({ children }) {
  const [keys, setKeys] = useState(readLocal);

  const keyOf = (itemType, itemId) => `${itemType}:${itemId}`;

  const isBookmarked = useCallback((itemType, itemId) => keys.has(keyOf(itemType, itemId)), [keys]);

  const toggle = useCallback(
    async (itemType, itemId) => {
      const key = keyOf(itemType, itemId);
      const wasSet = keys.has(key);
      const next = new Set(keys);
      if (wasSet) next.delete(key);
      else next.add(key);
      setKeys(next);
      writeLocal(next);
      try {
        if (wasSet) await api.removeBookmark(itemType, itemId, USER_ID);
        else await api.addBookmark(itemType, itemId, USER_ID);
      } catch {
        setKeys(keys);
        writeLocal(keys);
      }
      return !wasSet;
    },
    [keys]
  );

  const remove = useCallback(
    (itemType, itemId) => {
      const next = new Set(keys);
      next.delete(keyOf(itemType, itemId));
      setKeys(next);
      writeLocal(next);
    },
    [keys]
  );

  const value = useMemo(
    () => ({ isBookmarked, toggle, remove, count: keys.size }),
    [isBookmarked, toggle, remove, keys.size]
  );

  return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>;
}

export function useBookmarks() {
  const ctx = useContext(BookmarkContext);
  if (!ctx) throw new Error('useBookmarks must be used within BookmarkProvider');
  return ctx;
}
