/**
 * useStudioStore — cross-tab state management for the Dark Factory Studio.
 *
 * Each tab (Image, Video, Cinema, LipSync) preserves its own state when
 * switching away and back. Tab state is persisted to sessionStorage.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

type GenerateFn = () => void | Promise<void>;
type SaveFn = () => void;

// Per-tab shortcut callback refs (avoid re-renders on registration)
type ShortcutFns = Record<TabId, { generate: GenerateFn | null; save: SaveFn | null }>;
const DEFAULT_SHORTCUTS: ShortcutFns = {
  image: { generate: null, save: null },
  video: { generate: null, save: null },
  cinema: { generate: null, save: null },
  lipsync: { generate: null, save: null },
};

export type TabId = 'image' | 'video' | 'cinema' | 'lipsync';

export interface ImageTabState {
  prompt: string;
  model: string;
  referenceImage: string | null;
  stylePreset: string;
  seed: number | null;
  resultUrl: string | null;
  history: Array<{ prompt: string; resultUrl: string; timestamp: number }>;
  // SmartControls state — optional fields driven by model inputs
  aspectRatio?: string;
  width?: number;
  height?: number;
  quality?: string;
  steps?: number;
  guidance?: number;
}

export interface VideoTabState {
  prompt: string;
  model: string;
  duration: 5 | 10 | 15 | 30;
  startFrame: number;
  loop: boolean;
  resultUrl: string | null;
  history: Array<{ prompt: string; resultUrl: string; timestamp: number }>;
}

export interface CinemaTabState {
  prompt: string;
  model: string;
  lensType: 'Anamorphic' | 'Macro' | 'Cinema Prime' | 'Wide Angle' | 'Telephoto' | 'Fisheye';
  focalLength: number;
  aperture: number;
  cameraBody: '70mm Film' | '16mm Film' | 'Large Format Digital' | 'Mirrorless Full Frame';
  resultUrl: string | null;
  history: Array<{ prompt: string; resultUrl: string; timestamp: number }>;
}

export interface LipSyncTabState {
  portraitImage: string | null;
  audioFile: string | null;
  audioName: string | null;
  audioDuration: number | null;
  resultUrl: string | null;
  history: Array<{ portraitImage: string; audioName: string; resultUrl: string; timestamp: number }>;
}

export interface StudioState {
  activeTab: TabId;
  imageTab: ImageTabState;
  videoTab: VideoTabState;
  cinemaTab: CinemaTabState;
  lipsyncTab: LipSyncTabState;
}

const STORAGE_KEY = 'dark-factory-studio';

const DEFAULT_STATE: StudioState = {
  activeTab: 'image',
  imageTab: {
    prompt: '',
    model: '',
    referenceImage: null,
    stylePreset: 'none',
    seed: null,
    resultUrl: null,
    history: [],
  },
  videoTab: {
    prompt: '',
    model: '',
    duration: 5,
    startFrame: 0,
    loop: false,
    resultUrl: null,
    history: [],
  },
  cinemaTab: {
    prompt: '',
    model: '',
    lensType: 'Cinema Prime',
    focalLength: 50,
    aperture: 2.8,
    cameraBody: 'Mirrorless Full Frame',
    resultUrl: null,
    history: [],
  },
  lipsyncTab: {
    portraitImage: null,
    audioFile: null,
    audioName: null,
    audioDuration: null,
    resultUrl: null,
    history: [],
  },
};

function loadState(): StudioState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) } as StudioState;
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: StudioState): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage may be unavailable (e.g. private browsing with storage quota)
  }
}

export function useStudioStore(): {
  state: StudioState;
  setActiveTab: (tab: TabId) => void;
  updateImageTab: (updates: Partial<ImageTabState>) => void;
  updateVideoTab: (updates: Partial<VideoTabState>) => void;
  updateCinemaTab: (updates: Partial<CinemaTabState>) => void;
  updateLipSyncTab: (updates: Partial<LipSyncTabState>) => void;
  registerShortcut: (tab: TabId, type: 'generate' | 'save', fn: (() => void) | null) => void;
  triggerActiveGenerate: () => void;
  triggerActiveSave: () => void;
} {
  const [state, setState] = useState<StudioState>(loadState);
  const isFirstRender = useRef(true);

  // Persist to sessionStorage on every state change (skip first render to avoid double-write on mount)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveState(state);
  }, [state]);

  const setActiveTab = useCallback((tab: TabId) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  const updateImageTab = useCallback((updates: Partial<ImageTabState>) => {
    setState((prev) => ({ ...prev, imageTab: { ...prev.imageTab, ...updates } }));
  }, []);

  const updateVideoTab = useCallback((updates: Partial<VideoTabState>) => {
    setState((prev) => ({ ...prev, videoTab: { ...prev.videoTab, ...updates } }));
  }, []);

  const updateCinemaTab = useCallback((updates: Partial<CinemaTabState>) => {
    setState((prev) => ({ ...prev, cinemaTab: { ...prev.cinemaTab, ...updates } }));
  }, []);

  const updateLipSyncTab = useCallback((updates: Partial<LipSyncTabState>) => {
    setState((prev) => ({ ...prev, lipsyncTab: { ...prev.lipsyncTab, ...updates } }));
  }, []);

  // Mutable shortcut refs — not part of render state
  const shortcutRefs = useRef<ShortcutFns>(DEFAULT_SHORTCUTS);

  const registerShortcut = useCallback((tab: TabId, type: 'generate' | 'save', fn: GenerateFn | SaveFn | null) => {
    shortcutRefs.current[tab][type] = fn ?? null;
  }, []);

  const triggerActiveGenerate = useCallback(() => {
    shortcutRefs.current[state.activeTab]?.generate?.();
  }, [state.activeTab]);

  const triggerActiveSave = useCallback(() => {
    shortcutRefs.current[state.activeTab]?.save?.();
  }, [state.activeTab]);

  return {
    state,
    setActiveTab,
    updateImageTab,
    updateVideoTab,
    updateCinemaTab,
    updateLipSyncTab,
    registerShortcut,
    triggerActiveGenerate,
    triggerActiveSave,
  };
}
