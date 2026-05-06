'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Toast } from './Toast';
import { useToastStore } from './toastStore';

export type { ToastType } from './toastStore';

export function ToastContainer(): React.ReactElement | null {
  const { toasts, removeToast } = useToastStore();

  if (typeof window === 'undefined') return null;

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>,
    document.body
  );
}

// Convenience hook for easy toast triggering
export function useToast() {
  const store = useToastStore();

  return {
    toasts: store.toasts,
    success: (message: string, duration?: number) => store.addToast(message, 'success', duration),
    error: (message: string, duration?: number) => store.addToast(message, 'error', duration),
    info: (message: string, duration?: number) => store.addToast(message, 'info', duration),
    removeToast: store.removeToast,
  };
}
