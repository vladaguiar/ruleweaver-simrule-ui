// useLocalStorage Hook - Custom hook for persisting state to localStorage

import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = T | ((prevValue: T) => T);

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void, () => void] {
  // Get value from localStorage or use initial value
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes to localStorage from other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue) as T);
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
}

// Hook for auto-saving form data
export function useAutoSave<T>(
  key: string,
  value: T,
  debounceMs: number = 30000
): {
  savedValue: T | null;
  isSaving: boolean;
  lastSavedAt: Date | null;
  clearSaved: () => void;
} {
  const [savedValue, setSavedValue, removeSavedValue] = useLocalStorage<{
    value: T;
    savedAt: string;
  } | null>(`autosave_${key}`, null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    savedValue?.savedAt ? new Date(savedValue.savedAt) : null
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsSaving(true);
      const now = new Date();
      setSavedValue({
        value,
        savedAt: now.toISOString(),
      });
      setLastSavedAt(now);
      setIsSaving(false);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [value, debounceMs, setSavedValue]);

  const clearSaved = useCallback(() => {
    removeSavedValue();
    setLastSavedAt(null);
  }, [removeSavedValue]);

  return {
    savedValue: savedValue?.value || null,
    isSaving,
    lastSavedAt,
    clearSaved,
  };
}
