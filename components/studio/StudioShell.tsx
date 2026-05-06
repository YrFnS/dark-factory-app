'use client';

import { useStudioStore, type TabId } from '@/store/useStudioStore';
import { Tabs, type Tab } from '@/components/ui/Tabs';
import { Header } from '@/components/studio/Header';
import { ImageTab } from '@/components/tabs/ImageTab';
import { VideoTab } from '@/components/tabs/VideoTab';
import { CinemaTab } from '@/components/tabs/CinemaTab';
import { LipSyncTab } from '@/components/tabs/LipSyncTab';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

// SVG Icons for tabs
const ImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21,15 16,10 5,21"/>
  </svg>
);

const VideoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23,7 16,12 23,17 23,7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);

const CinemaIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const LipSyncIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const STUDIO_TABS: Tab[] = [
  { id: 'image', label: 'Image', icon: <ImageIcon /> },
  { id: 'video', label: 'Video', icon: <VideoIcon /> },
  { id: 'cinema', label: 'Cinema', icon: <CinemaIcon /> },
  { id: 'lipsync', label: 'LipSync', icon: <LipSyncIcon /> },
];

function renderActiveTab(tabId: TabId, store: ReturnType<typeof useStudioStore>) {
  switch (tabId) {
    case 'image':
      return <ImageTab state={store.state.imageTab} update={store.updateImageTab} />;
    case 'video':
      return <VideoTab state={store.state.videoTab} update={store.updateVideoTab} />;
    case 'cinema':
      return <CinemaTab state={store.state.cinemaTab} update={store.updateCinemaTab} />;
    case 'lipsync':
      return <LipSyncTab state={store.state.lipsyncTab} update={store.updateLipSyncTab} />;
    default:
      return null;
  }
}

interface StudioShellProps {
  className?: string;
}

export function StudioShell({ className }: StudioShellProps): JSX.Element {
  const store = useStudioStore();

  useKeyboardShortcuts({
    onGenerate: store.triggerActiveGenerate,
    onSave: store.triggerActiveSave,
  });

  return (
    <div className={`studio-shell ${className ?? ''}`}>
      <Header />

      <Tabs
        tabs={STUDIO_TABS}
        activeTab={store.state.activeTab}
        onTabChange={store.setActiveTab}
      />

      <main
        className="studio-content"
        role="tabpanel"
        id={`panel-${store.state.activeTab}`}
        aria-labelledby={`tab-${store.state.activeTab}`}
      >
        {renderActiveTab(store.state.activeTab, store)}
      </main>

      <style jsx>{`
        .studio-shell {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #0a0a0c;
          color: #e2e2e8;
        }
        .studio-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
      `}</style>
    </div>
  );
}
