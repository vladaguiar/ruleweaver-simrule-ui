// useKeyboardShortcuts - Global keyboard shortcut handling hook

import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Custom hook for handling keyboard shortcuts
 *
 * @example
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     { key: 's', ctrl: true, action: handleSave, description: 'Save' },
 *     { key: 'Enter', ctrl: true, action: handleRun, description: 'Run' },
 *   ],
 * });
 */
export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef(shortcuts);

  // Keep shortcuts reference up to date
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore shortcuts when typing in input fields (except for specific shortcuts)
    const target = event.target as HTMLElement;
    const isInputField =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable;

    for (const shortcut of shortcutsRef.current) {
      if (shortcut.enabled === false) continue;

      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const metaMatch = shortcut.meta ? event.metaKey : true; // Don't require non-meta

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        // For Ctrl/Cmd shortcuts, always handle even in input fields
        if (shortcut.ctrl || shortcut.meta) {
          event.preventDefault();
          shortcut.action();
          return;
        }

        // For non-modified shortcuts, only handle if not in input field
        if (!isInputField) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    }
  }, [enabled]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Format a shortcut for display
 */
export function formatShortcut(shortcut: Pick<KeyboardShortcut, 'key' | 'ctrl' | 'shift' | 'alt' | 'meta'>): string {
  const parts: string[] = [];

  // Detect OS for proper key display
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  if (shortcut.ctrl) parts.push(isMac ? '⌘' : 'Ctrl');
  if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt');
  if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift');
  if (shortcut.meta && !isMac) parts.push('Win');

  // Format special keys
  let keyDisplay = shortcut.key;
  switch (shortcut.key.toLowerCase()) {
    case 'enter': keyDisplay = '↵'; break;
    case 'escape': keyDisplay = 'Esc'; break;
    case 'arrowup': keyDisplay = '↑'; break;
    case 'arrowdown': keyDisplay = '↓'; break;
    case 'arrowleft': keyDisplay = '←'; break;
    case 'arrowright': keyDisplay = '→'; break;
    case 'backspace': keyDisplay = '⌫'; break;
    case 'delete': keyDisplay = 'Del'; break;
    case 'tab': keyDisplay = 'Tab'; break;
    case ' ': keyDisplay = 'Space'; break;
    default: keyDisplay = shortcut.key.toUpperCase();
  }

  parts.push(keyDisplay);

  return parts.join(isMac ? '' : '+');
}

export default useKeyboardShortcuts;
