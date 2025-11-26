// useLocalStorage Hook - Custom hook for persisting state to localStorage

import { useState, useEffect, useCallback, useRef } from 'react';

type SetValue<T> = T | ((prevValue: T) => T);

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void, () => void] {
  // Use refs to avoid recreating callbacks when values change
  const keyRef = useRef(key);
  keyRef.current = key;

  const initialValueRef = useRef(initialValue);
  initialValueRef.current = initialValue;

  // Get value from localStorage or use initial value
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValueRef.current;
    }

    try {
      const item = window.localStorage.getItem(keyRef.current);
      return item ? (JSON.parse(item) as T) : initialValueRef.current;
    } catch (error) {
      console.warn(`Error reading localStorage key "${keyRef.current}":`, error);
      return initialValueRef.current;
    }
  }, []);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Use ref to track if update came from storage event
  const isStorageUpdateRef = useRef(false);

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        // Allow value to be a function so we have same API as useState
        setStoredValue((prevValue) => {
          const valueToStore = value instanceof Function ? value(prevValue) : value;

          if (typeof window !== 'undefined') {
            window.localStorage.setItem(keyRef.current, JSON.stringify(valueToStore));
          }

          return valueToStore;
        });
      } catch (error) {
        console.warn(`Error setting localStorage key "${keyRef.current}":`, error);
      }
    },
    [] // No dependencies - uses refs for values
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(keyRef.current);
      }
      setStoredValue(initialValueRef.current);
    } catch (error) {
      console.warn(`Error removing localStorage key "${keyRef.current}":`, error);
    }
  }, []); // No dependencies - uses refs for values

  // Listen for changes to localStorage from other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === keyRef.current) {
        // Mark this update as coming from storage event to prevent loops
        isStorageUpdateRef.current = true;
        try {
          if (event.newValue !== null) {
            setStoredValue(JSON.parse(event.newValue) as T);
          } else {
            // Key was removed
            setStoredValue(initialValueRef.current);
          }
        } catch {
          // Ignore parse errors
        } finally {
          // Reset flag after state update is processed
          setTimeout(() => {
            isStorageUpdateRef.current = false;
          }, 0);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []); // Empty deps - uses refs

  // Re-read value when key changes
  useEffect(() => {
    setStoredValue(readValue());
  }, [key, readValue]);

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

  // Use refs to track value and mounted state
  const valueRef = useRef(value);
  valueRef.current = value;

  const setSavedValueRef = useRef(setSavedValue);
  setSavedValueRef.current = setSavedValue;

  const isMountedRef = useRef(true);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Show saving indicator briefly before actual save
    const savingIndicatorTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        setIsSaving(true);
      }
    }, Math.max(0, debounceMs - 500)); // Show "saving" 500ms before actual save

    const saveTimeout = setTimeout(() => {
      const now = new Date();
      setSavedValueRef.current({
        value: valueRef.current,
        savedAt: now.toISOString(),
      });
      if (isMountedRef.current) {
        setLastSavedAt(now);
      }
      // Keep isSaving true briefly to show user the save completed
      setTimeout(() => {
        if (isMountedRef.current) {
          setIsSaving(false);
        }
      }, 200);
    }, debounceMs);

    return () => {
      clearTimeout(savingIndicatorTimeout);
      clearTimeout(saveTimeout);
      // Don't call setIsSaving in cleanup - component may be unmounted
    };
  }, [value, debounceMs]);

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
