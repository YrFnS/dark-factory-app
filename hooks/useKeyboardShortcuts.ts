/**
 * useKeyboardShortcuts — global keyboard shortcut handler for the studio.
 *
 * - Cmd/Ctrl + Enter → trigger generate
 * - Cmd/Ctrl + S     → trigger save/download (prevents browser save)
 * - Escape           → already handled by Modal.tsx
 */

import { useEffect } from 'react';

interface KeyboardShortcutsOptions {
  onGenerate: () => void;
  onSave: () => void;
}

/**
 * Register keyboard shortcuts on the window object.
 * Call this from a client component that is mounted for the lifetime
 * of the studio session (e.g. inside StudioShell).
 */
export function useKeyboardShortcuts({ onGenerate, onSave }: KeyboardShortcutsOptions): void {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      const hasModifier = e.metaKey || e.ctrlKey;

      if (hasModifier && e.key === 'Enter') {
        e.preventDefault();
        onGenerate();
        return;
      }

      if (hasModifier && e.key === 's') {
        e.preventDefault();
        onSave();
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onGenerate, onSave]);
}
