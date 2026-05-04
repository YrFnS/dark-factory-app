'use client';

import { useCallback, useRef, useState } from 'react';
import type { TabId } from '@/store/useStudioStore';

export interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function Tabs({ tabs, activeTab, onTabChange }: TabsProps): JSX.Element {
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});
  const tabRefs = useRef<Map<TabId, HTMLButtonElement | null>>(new Map());

  const updateIndicator = useCallback(
    (tabId: TabId) => {
      const el = tabRefs.current.get(tabId);
      if (!el) return;
      setIndicatorStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
      });
    },
    []
  );

  const handleTabClick = (tabId: TabId) => {
    onTabChange(tabId);
    updateIndicator(tabId);
  };

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    const nextTab = tabs[nextIndex]!;
    if (nextTab.disabled) return;
    onTabChange(nextTab.id);
    tabRefs.current.get(nextTab.id)?.focus();
    updateIndicator(nextTab.id);
  };

  // Use a dedicated ref callback to update indicator after mount
  const tabButtonRef = (id: TabId) => (el: HTMLButtonElement | null) => {
    tabRefs.current.set(id, el);
    if (id === activeTab && el) {
      // Slight delay to ensure layout is complete
      setTimeout(() => updateIndicator(id), 0);
    }
  };

  return (
    <div className="tabs-root" role="tablist" aria-label="Studio modes">
      <div className="tabs-inner">
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              ref={tabButtonRef(tab.id)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              disabled={tab.disabled}
              className={`tab-item ${isActive ? 'tab-item--active' : ''} ${tab.disabled ? 'tab-item--disabled' : ''}`}
              onClick={() => handleTabClick(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              type="button"
            >
              <span className="tab-icon" aria-hidden="true">
                {tab.icon}
              </span>
              <span className="tab-label">{tab.label}</span>
            </button>
          );
        })}
        {/* Active indicator */}
        <span
          className="tab-indicator"
          style={indicatorStyle}
          aria-hidden="true"
        />
      </div>

      <style jsx>{`
        .tabs-root {
          width: 100%;
          background: #0d0d0f;
          border-bottom: 1px solid #2a2a2e;
          padding: 0 16px;
        }
        .tabs-inner {
          position: relative;
          display: flex;
          gap: 0;
          max-width: 600px;
        }
        .tab-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: transparent;
          border: none;
          color: #6b6b78;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s;
          position: relative;
          white-space: nowrap;
          font-family: inherit;
          letter-spacing: 0.02em;
        }
        .tab-item:hover:not(.tab-item--disabled) {
          color: #aaa;
        }
        .tab-item--active {
          color: #e2e2e8;
        }
        .tab-item--disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .tab-item:focus-visible {
          outline: 2px solid #d9ff00;
          outline-offset: -2px;
          border-radius: 4px;
        }
        .tab-icon {
          display: flex;
          align-items: center;
          font-size: 1rem;
          line-height: 1;
        }
        .tab-label {
          font-size: 0.8rem;
        }
        .tab-indicator {
          position: absolute;
          bottom: 0;
          height: 2px;
          background: #d9ff00;
          transition: left 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                      width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 2px 2px 0 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
