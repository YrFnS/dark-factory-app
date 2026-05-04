'use client';

import Link from 'next/link';

const SettingsIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block' }}
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export function Header(): React.ReactElement {
  return (
    <header className="studio-header">
      <div className="studio-header-left">
        <span className="studio-logo">DARK FACTORY</span>
        <span className="studio-tagline">Studio</span>
      </div>
      <Link href="/settings" className="settings-btn" aria-label="Open settings">
        <SettingsIcon />
      </Link>

      <style jsx>{`
        .studio-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          background: #0d0d0f;
          flex-shrink: 0;
        }
        .studio-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .studio-logo {
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #d9ff00;
          text-transform: uppercase;
        }
        .studio-tagline {
          font-size: 0.75rem;
          color: #52525b;
          font-weight: 400;
        }
        .settings-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #a1a1aa;
          cursor: pointer;
          transition: color 0.15s, background 0.15s, border-color 0.15s;
          text-decoration: none;
        }
        .settings-btn:hover {
          color: #d9ff00;
          background: rgba(217, 255, 0, 0.05);
          border-color: rgba(217, 255, 0, 0.2);
        }
      `}</style>
    </header>
  );
}
