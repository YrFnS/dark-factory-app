import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStudioStore } from '../useStudioStore';

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(globalThis, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
  configurable: true,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockSessionStorage.getItem.mockReturnValue(null);
});

describe('useStudioStore', () => {
  it('returns default state on first render with no stored state', () => {
    const { result } = renderHook(() => useStudioStore());
    expect(result.current.state.activeTab).toBe('image');
    expect(result.current.state.imageTab.model).toBe('sdxl');
    expect(result.current.state.videoTab.duration).toBe(5);
    expect(result.current.state.cinemaTab.lensType).toBe('Cinema Prime');
    expect(result.current.state.lipsyncTab.portraitImage).toBeNull();
  });

  it('updates active tab', () => {
    const { result } = renderHook(() => useStudioStore());
    act(() => result.current.setActiveTab('video'));
    expect(result.current.state.activeTab).toBe('video');
  });

  it('persists state to sessionStorage on tab change', () => {
    const { result } = renderHook(() => useStudioStore());
    act(() => result.current.setActiveTab('cinema'));
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'dark-factory-studio',
      expect.stringContaining('"activeTab":"cinema"')
    );
  });

  it('loads persisted state from sessionStorage', () => {
    mockSessionStorage.getItem.mockReturnValue(
      JSON.stringify({
        activeTab: 'lipsync',
        imageTab: {
          prompt: 'a sunset',
          model: 'sdxl',
          referenceImage: null,
          stylePreset: 'none',
          seed: 42,
          resultUrl: null,
          history: [],
        },
        videoTab: {
          prompt: '',
          model: 'zeroscope',
          duration: 10,
          startFrame: 0,
          loop: true,
          resultUrl: null,
          history: [],
        },
        cinemaTab: {
          prompt: '',
          model: 'sdxl-cinema',
          lensType: 'Anamorphic',
          focalLength: 85,
          aperture: 1.4,
          cameraBody: '70mm Film',
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
      })
    );
    const { result } = renderHook(() => useStudioStore());
    expect(result.current.state.activeTab).toBe('lipsync');
    expect(result.current.state.imageTab.seed).toBe(42);
    expect(result.current.state.videoTab.duration).toBe(10);
    expect(result.current.state.videoTab.loop).toBe(true);
    expect(result.current.state.cinemaTab.lensType).toBe('Anamorphic');
    expect(result.current.state.cinemaTab.aperture).toBe(1.4);
  });

  it('updateImageTab only modifies imageTab fields', () => {
    const { result } = renderHook(() => useStudioStore());
    act(() => result.current.updateImageTab({ prompt: 'hello', seed: 123 }));
    expect(result.current.state.imageTab.prompt).toBe('hello');
    expect(result.current.state.imageTab.seed).toBe(123);
    expect(result.current.state.videoTab.duration).toBe(5); // unchanged
    expect(result.current.state.cinemaTab.lensType).toBe('Cinema Prime'); // unchanged
  });

  it('updateVideoTab only modifies videoTab fields', () => {
    const { result } = renderHook(() => useStudioStore());
    act(() => result.current.updateVideoTab({ duration: 30, loop: true }));
    expect(result.current.state.videoTab.duration).toBe(30);
    expect(result.current.state.videoTab.loop).toBe(true);
    expect(result.current.state.imageTab.model).toBe('sdxl'); // unchanged
  });

  it('updateCinemaTab only modifies cinemaTab fields', () => {
    const { result } = renderHook(() => useStudioStore());
    act(() =>
      result.current.updateCinemaTab({ lensType: 'Telephoto', focalLength: 200 })
    );
    expect(result.current.state.cinemaTab.lensType).toBe('Telephoto');
    expect(result.current.state.cinemaTab.focalLength).toBe(200);
    expect(result.current.state.cinemaTab.aperture).toBe(2.8); // unchanged default
  });

  it('updateLipSyncTab only modifies lipsyncTab fields', () => {
    const { result } = renderHook(() => useStudioStore());
    act(() =>
      result.current.updateLipSyncTab({
        portraitImage: 'http://example.com/portrait.jpg',
        audioName: 'speech.wav',
        audioDuration: 5,
      })
    );
    expect(result.current.state.lipsyncTab.portraitImage).toBe('http://example.com/portrait.jpg');
    expect(result.current.state.lipsyncTab.audioName).toBe('speech.wav');
    expect(result.current.state.lipsyncTab.audioDuration).toBe(5);
    expect(result.current.state.imageTab.model).toBe('sdxl'); // unchanged
  });

  it('does not persist to sessionStorage on first render (isFirstRender guard)', () => {
    renderHook(() => useStudioStore());
    expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
  });

  it('preserves history across tab state updates', () => {
    const { result } = renderHook(() => useStudioStore());
    const historyEntry = {
      prompt: 'test prompt',
      resultUrl: 'http://example.com/result.jpg',
      timestamp: 999999,
    };
    act(() =>
      result.current.updateImageTab({
        history: [...result.current.state.imageTab.history, historyEntry],
      })
    );
    expect(result.current.state.imageTab.history).toContainEqual(historyEntry);
  });
});
