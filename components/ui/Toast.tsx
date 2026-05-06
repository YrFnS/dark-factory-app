'use client';

import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

const CheckIcon = () => (
  <svg
    className="w-5 h-5 text-[#22c55e]"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg
    className="w-5 h-5 text-[#ef4444]"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const InfoIcon = () => (
  <svg
    className="w-5 h-5 text-[#d9ff00]"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckIcon />,
  error: <XIcon />,
  info: <InfoIcon />,
};

export function Toast({
  message,
  type = 'info',
  duration = 3000,
  onClose,
}: ToastProps): React.ReactElement {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onClose?.();
      }, 300); // Match exit animation duration
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 min-w-[300px] max-w-[420px]
        bg-[#141414] border border-[rgba(255,255,255,0.08)]
        rounded-lg shadow-lg
        transition-all duration-300 ease-out
        ${isVisible && !isExiting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        ${isExiting ? 'opacity-0 translate-y-[-8px]' : ''}
      `}
    >
      <div className="flex-shrink-0">{iconMap[type]}</div>
      <p className="flex-1 text-sm text-white font-medium leading-snug">{message}</p>
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 text-[#a1a1aa] hover:text-white transition-colors rounded focus:outline-none focus:ring-2 focus:ring-[rgba(255,255,255,0.2)]"
        aria-label="Close"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
