// Tests for useKeyboardShortcuts hook
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts, formatShortcut, KeyboardShortcut } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  let mockAction: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockAction = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createKeyboardEvent = (
    key: string,
    options: Partial<KeyboardEventInit> = {}
  ): KeyboardEvent => {
    return new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      ...options,
    });
  };

  it('should call action when matching shortcut is pressed', () => {
    const shortcuts: KeyboardShortcut[] = [
      { key: 's', ctrl: true, action: mockAction, description: 'Save' },
    ];

    renderHook(() => useKeyboardShortcuts({ shortcuts }));

    const event = createKeyboardEvent('s', { ctrlKey: true });
    document.dispatchEvent(event);

    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should not call action when wrong key is pressed', () => {
    const shortcuts: KeyboardShortcut[] = [
      { key: 's', ctrl: true, action: mockAction, description: 'Save' },
    ];

    renderHook(() => useKeyboardShortcuts({ shortcuts }));

    const event = createKeyboardEvent('a', { ctrlKey: true });
    document.dispatchEvent(event);

    expect(mockAction).not.toHaveBeenCalled();
  });

  it('should not call action when modifier key is missing', () => {
    const shortcuts: KeyboardShortcut[] = [
      { key: 's', ctrl: true, action: mockAction, description: 'Save' },
    ];

    renderHook(() => useKeyboardShortcuts({ shortcuts }));

    const event = createKeyboardEvent('s', { ctrlKey: false });
    document.dispatchEvent(event);

    expect(mockAction).not.toHaveBeenCalled();
  });

  it('should handle multiple shortcuts', () => {
    const saveAction = vi.fn();
    const runAction = vi.fn();

    const shortcuts: KeyboardShortcut[] = [
      { key: 's', ctrl: true, action: saveAction, description: 'Save' },
      { key: 'Enter', ctrl: true, action: runAction, description: 'Run' },
    ];

    renderHook(() => useKeyboardShortcuts({ shortcuts }));

    document.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true }));
    expect(saveAction).toHaveBeenCalledTimes(1);
    expect(runAction).not.toHaveBeenCalled();

    document.dispatchEvent(createKeyboardEvent('Enter', { ctrlKey: true }));
    expect(saveAction).toHaveBeenCalledTimes(1);
    expect(runAction).toHaveBeenCalledTimes(1);
  });

  it('should respect shift modifier', () => {
    const shortcuts: KeyboardShortcut[] = [
      { key: 's', ctrl: true, shift: true, action: mockAction, description: 'Save As' },
    ];

    renderHook(() => useKeyboardShortcuts({ shortcuts }));

    // Without shift - should not trigger
    document.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true, shiftKey: false }));
    expect(mockAction).not.toHaveBeenCalled();

    // With shift - should trigger
    document.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true, shiftKey: true }));
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should respect alt modifier', () => {
    const shortcuts: KeyboardShortcut[] = [
      { key: 'n', alt: true, action: mockAction, description: 'New' },
    ];

    renderHook(() => useKeyboardShortcuts({ shortcuts }));

    // Without alt - should not trigger
    document.dispatchEvent(createKeyboardEvent('n', { altKey: false }));
    expect(mockAction).not.toHaveBeenCalled();

    // With alt - should trigger
    document.dispatchEvent(createKeyboardEvent('n', { altKey: true }));
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should not trigger when enabled is false globally', () => {
    const shortcuts: KeyboardShortcut[] = [
      { key: 's', ctrl: true, action: mockAction, description: 'Save' },
    ];

    renderHook(() => useKeyboardShortcuts({ shortcuts, enabled: false }));

    document.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true }));
    expect(mockAction).not.toHaveBeenCalled();
  });

  it('should not trigger when specific shortcut is disabled', () => {
    const shortcuts: KeyboardShortcut[] = [
      { key: 's', ctrl: true, action: mockAction, description: 'Save', enabled: false },
    ];

    renderHook(() => useKeyboardShortcuts({ shortcuts }));

    document.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true }));
    expect(mockAction).not.toHaveBeenCalled();
  });

  it('should be case insensitive for key matching', () => {
    const shortcuts: KeyboardShortcut[] = [
      { key: 'S', ctrl: true, action: mockAction, description: 'Save' },
    ];

    renderHook(() => useKeyboardShortcuts({ shortcuts }));

    document.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true }));
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should clean up event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const shortcuts: KeyboardShortcut[] = [
      { key: 's', ctrl: true, action: mockAction, description: 'Save' },
    ];

    const { unmount } = renderHook(() => useKeyboardShortcuts({ shortcuts }));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});

describe('formatShortcut', () => {
  // Mock navigator.platform for consistent testing
  const originalPlatform = Object.getOwnPropertyDescriptor(navigator, 'platform');

  afterEach(() => {
    if (originalPlatform) {
      Object.defineProperty(navigator, 'platform', originalPlatform);
    }
  });

  const setMockPlatform = (platform: string) => {
    Object.defineProperty(navigator, 'platform', {
      value: platform,
      configurable: true,
    });
  };

  describe('on Windows', () => {
    beforeEach(() => {
      setMockPlatform('Win32');
    });

    it('should format Ctrl shortcut', () => {
      const result = formatShortcut({ key: 's', ctrl: true });
      expect(result).toBe('Ctrl+S');
    });

    it('should format Ctrl+Shift shortcut', () => {
      const result = formatShortcut({ key: 's', ctrl: true, shift: true });
      expect(result).toBe('Ctrl+Shift+S');
    });

    it('should format Ctrl+Alt shortcut', () => {
      const result = formatShortcut({ key: 'n', ctrl: true, alt: true });
      expect(result).toBe('Ctrl+Alt+N');
    });

    it('should format Enter key', () => {
      const result = formatShortcut({ key: 'Enter', ctrl: true });
      expect(result).toBe('Ctrl+↵');
    });

    it('should format Escape key', () => {
      const result = formatShortcut({ key: 'Escape' });
      expect(result).toBe('Esc');
    });

    it('should format arrow keys', () => {
      expect(formatShortcut({ key: 'ArrowUp' })).toBe('↑');
      expect(formatShortcut({ key: 'ArrowDown' })).toBe('↓');
      expect(formatShortcut({ key: 'ArrowLeft' })).toBe('←');
      expect(formatShortcut({ key: 'ArrowRight' })).toBe('→');
    });

    it('should format Space key', () => {
      const result = formatShortcut({ key: ' ' });
      expect(result).toBe('Space');
    });

    it('should format Backspace key', () => {
      const result = formatShortcut({ key: 'Backspace' });
      expect(result).toBe('⌫');
    });

    it('should format Delete key', () => {
      const result = formatShortcut({ key: 'Delete' });
      expect(result).toBe('Del');
    });

    it('should format Tab key', () => {
      const result = formatShortcut({ key: 'Tab' });
      expect(result).toBe('Tab');
    });
  });

  describe('on Mac', () => {
    beforeEach(() => {
      setMockPlatform('MacIntel');
    });

    it('should format Ctrl shortcut with Mac symbols', () => {
      const result = formatShortcut({ key: 's', ctrl: true });
      expect(result).toBe('⌘S');
    });

    it('should format Ctrl+Shift shortcut with Mac symbols', () => {
      const result = formatShortcut({ key: 's', ctrl: true, shift: true });
      expect(result).toBe('⌘⇧S');
    });

    it('should format Ctrl+Alt shortcut with Mac symbols', () => {
      const result = formatShortcut({ key: 'n', ctrl: true, alt: true });
      expect(result).toBe('⌘⌥N');
    });
  });
});
