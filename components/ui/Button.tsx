'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps): React.ReactElement {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#050505]';

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-[#d9ff00] text-black hover:shadow-[0_0_20px_rgba(217,255,0,0.4)] active:bg-[#c4e600] focus:ring-[#d9ff00]',
    ghost:
      'bg-transparent text-[#d9ff00] border border-[#d9ff00] hover:bg-[rgba(217,255,0,0.08)] focus:ring-[#d9ff00]',
    outline:
      'bg-transparent text-white border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] focus:ring-[rgba(255,255,255,0.3)]',
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${base} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {loading ? 'Loading...' : children}
    </button>
  );
}
