// Tests for useLocalStorage hook
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  // Mock localStorage
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key: string) => localStorageMock[key] || null
    );

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
      (key: string, value: string) => {
        localStorageMock[key] = value;
      }
    );

    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(
      (key: string) => {
        delete localStorageMock[key];
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return initial value when localStorage is empty', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial')
    );

    expect(result.current[0]).toBe('initial');
  });

  it('should return stored value when localStorage has data', () => {
    localStorageMock['test-key'] = JSON.stringify('stored-value');

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial')
    );

    expect(result.current[0]).toBe('stored-value');
  });

  it('should persist value to localStorage when setting', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial')
    );

    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');
    expect(localStorageMock['test-key']).toBe(JSON.stringify('new-value'));
  });

  it('should support functional updates', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 0)
    );

    act(() => {
      result.current[1](prev => prev + 1);
    });

    expect(result.current[0]).toBe(1);

    act(() => {
      result.current[1](prev => prev + 10);
    });

    expect(result.current[0]).toBe(11);
  });

  it('should handle object values', () => {
    const initialValue = { name: 'John', age: 30 };
    const { result } = renderHook(() =>
      useLocalStorage('test-key', initialValue)
    );

    expect(result.current[0]).toEqual(initialValue);

    act(() => {
      result.current[1]({ name: 'Jane', age: 25 });
    });

    expect(result.current[0]).toEqual({ name: 'Jane', age: 25 });
    expect(JSON.parse(localStorageMock['test-key'])).toEqual({ name: 'Jane', age: 25 });
  });

  it('should handle array values', () => {
    const initialValue = [1, 2, 3];
    const { result } = renderHook(() =>
      useLocalStorage('test-key', initialValue)
    );

    expect(result.current[0]).toEqual(initialValue);

    act(() => {
      result.current[1]([4, 5, 6]);
    });

    expect(result.current[0]).toEqual([4, 5, 6]);
  });

  it('should remove value from localStorage', () => {
    localStorageMock['test-key'] = JSON.stringify('stored-value');

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial')
    );

    expect(result.current[0]).toBe('stored-value');

    act(() => {
      result.current[2](); // removeValue
    });

    expect(result.current[0]).toBe('initial');
    expect(localStorageMock['test-key']).toBeUndefined();
  });

  it('should handle invalid JSON in localStorage gracefully', () => {
    localStorageMock['test-key'] = 'not-valid-json';
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial')
    );

    expect(result.current[0]).toBe('initial');
    expect(consoleWarnSpy).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should update value when key changes', () => {
    localStorageMock['key-1'] = JSON.stringify('value-1');
    localStorageMock['key-2'] = JSON.stringify('value-2');

    const { result, rerender } = renderHook(
      ({ key }) => useLocalStorage(key, 'default'),
      { initialProps: { key: 'key-1' } }
    );

    expect(result.current[0]).toBe('value-1');

    rerender({ key: 'key-2' });

    expect(result.current[0]).toBe('value-2');
  });

  it('should handle boolean values', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', false)
    );

    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1](true);
    });

    expect(result.current[0]).toBe(true);
    expect(JSON.parse(localStorageMock['test-key'])).toBe(true);
  });

  it('should handle null values', () => {
    const { result } = renderHook(() =>
      useLocalStorage<string | null>('test-key', null)
    );

    expect(result.current[0]).toBe(null);

    act(() => {
      result.current[1]('value');
    });

    expect(result.current[0]).toBe('value');

    act(() => {
      result.current[1](null);
    });

    expect(result.current[0]).toBe(null);
  });

  it('should sync across storage events', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial')
    );

    expect(result.current[0]).toBe('initial');

    // Simulate a storage event from another tab
    act(() => {
      const event = new StorageEvent('storage', {
        key: 'test-key',
        newValue: JSON.stringify('updated-from-other-tab'),
      });
      window.dispatchEvent(event);
    });

    expect(result.current[0]).toBe('updated-from-other-tab');
  });

  it('should handle storage events with null value (key removed)', () => {
    localStorageMock['test-key'] = JSON.stringify('stored');

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial')
    );

    expect(result.current[0]).toBe('stored');

    // Simulate removal from another tab
    act(() => {
      const event = new StorageEvent('storage', {
        key: 'test-key',
        newValue: null,
      });
      window.dispatchEvent(event);
    });

    expect(result.current[0]).toBe('initial');
  });

  it('should ignore storage events for different keys', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial')
    );

    // Simulate a storage event for a different key
    act(() => {
      const event = new StorageEvent('storage', {
        key: 'other-key',
        newValue: JSON.stringify('different-value'),
      });
      window.dispatchEvent(event);
    });

    expect(result.current[0]).toBe('initial');
  });

  it('should clean up storage event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useLocalStorage('test-key', 'initial')
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
  });
});
