/**
 * LipSyncControls — portrait selector, audio upload with drag-drop,
 * and waveform canvas preview.
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { ReferencePicker } from '@/components/studio/StudioControls';

interface LipSyncControlsProps {
  portraitImage: string | null;
  onPortraitChange: (url: string | string[] | null) => void;
  audioFile: string | null;
  audioName: string | null;
  audioDuration: number | null;
  onAudioChange: (file: string | null, name: string | null, duration: number | null) => void;
}

function AudioWaveform({ audioUrl }: { audioUrl: string | null }): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!audioUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw placeholder waveform bars
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#d9ff00';
    const barCount = 80;
    const barWidth = canvas.width / barCount - 1;
    for (let i = 0; i < barCount; i++) {
      // Pseudo-random height based on sine wave composite
      const h = (Math.abs(Math.sin(i * 0.3) * 0.5 + Math.sin(i * 0.7) * 0.3 + Math.sin(i * 1.1) * 0.2)) * canvas.height * 0.8;
      const x = i * (barWidth + 1);
      const y = (canvas.height - h) / 2;
      ctx.fillRect(x, y, barWidth, h);
    }
  }, [audioUrl]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={60}
      className="waveform-canvas"
      aria-label="Audio waveform preview"
    />
  );
}

export function LipSyncControls({
  portraitImage,
  onPortraitChange,
  audioFile,
  audioName,
  audioDuration,
  onAudioChange,
}: LipSyncControlsProps): React.ReactElement {
  const dropRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('audio/')) return;
    const url = URL.createObjectURL(file);
    // Estimate duration (real implementation would use Web Audio API)
    // For stub: duration derived from file size as proxy (very rough)
    const estimatedDuration = Math.round(file.size / 8000); // ~8kB/s estimate
    onAudioChange(url, file.name, estimatedDuration);
  }, [onAudioChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    isDragging.current = false;
    dropRef.current?.classList.remove('drop-zone--active');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dropRef.current?.classList.add('drop-zone--active');
  }, []);

  const handleDragLeave = useCallback(() => {
    isDragging.current = false;
    dropRef.current?.classList.remove('drop-zone--active');
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const formatDuration = (s: number | null): string => {
    if (s === null) return '--:--';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="lipsync-controls">
      {/* Portrait */}
      <div className="control-group">
        <ReferencePicker
          label="Portrait Image"
          value={portraitImage}
          onChange={onPortraitChange}
        />
      </div>

      {/* Audio Upload */}
      <div className="control-group">
        <label className="control-label">Audio File (MP3 / WAV / OGG)</label>
        <div
          ref={dropRef}
          className={`drop-zone ${audioFile ? 'drop-zone--has-file' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {audioFile ? (
            <div className="audio-info">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d9ff00" strokeWidth="2">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
              <div className="audio-meta">
                <span className="audio-name">{audioName ?? 'audio file'}</span>
                <span className="audio-dur">{formatDuration(audioDuration)}</span>
              </div>
              <button
                type="button"
                className="remove-btn"
                onClick={() => onAudioChange(null, null, null)}
                aria-label="Remove audio"
              >
                ×
              </button>
            </div>
          ) : (
            <label className="drop-prompt">
              <input
                type="file"
                accept="audio/mp3,audio/wav,audio/ogg"
                onChange={handleInputChange}
                style={{ display: 'none' }}
              />
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17,8 12,3 7,8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span>Drag & drop audio or click to browse</span>
            </label>
          )}
        </div>
      </div>

      {/* Waveform */}
      <div className="control-group">
        <label className="control-label">Waveform Preview</label>
        <div className="waveform-container">
          <AudioWaveform audioUrl={audioFile} />
        </div>
      </div>

      {/* Duration display */}
      <div className="duration-display">
        <span className="duration-label">Duration</span>
        <span className="duration-value">{formatDuration(audioDuration)}</span>
      </div>

      <style jsx>{`
        .lipsync-controls { display: flex; flex-direction: column; gap: 16px; }
        .control-group { display: flex; flex-direction: column; gap: 6px; }
        .control-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #6b6b78;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .drop-zone {
          background: #161618;
          border: 1px dashed #2a2a2e;
          border-radius: 8px;
          min-height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.2s, background 0.2s;
          cursor: default;
        }
        .drop-zone--active {
          border-color: #d9ff00;
          background: rgba(217,255,0,0.05);
        }
        .drop-zone--has-file { border-style: solid; border-color: #2a2a2e; }
        .drop-prompt {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #555;
          font-size: 0.75rem;
          cursor: pointer;
          padding: 16px;
          text-align: center;
        }
        .drop-prompt:hover { color: #888; }
        .audio-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          width: 100%;
        }
        .audio-meta {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .audio-name {
          font-size: 0.8rem;
          color: #aaa;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .audio-dur { font-size: 0.7rem; color: #555; }
        .remove-btn {
          background: transparent;
          border: none;
          color: #555;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          line-height: 1;
          transition: color 0.15s;
          font-family: inherit;
        }
        .remove-btn:hover { color: #ef4444; }
        .waveform-container {
          background: #0d0d0f;
          border: 1px solid #2a2a2e;
          border-radius: 6px;
          overflow: hidden;
          display: flex;
          align-items: center;
        }
        .waveform-canvas { display: block; width: 100%; height: 60px; }
        .duration-display {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #161618;
          border: 1px solid #2a2a2e;
          border-radius: 6px;
          padding: 10px 14px;
        }
        .duration-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #6b6b78;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .duration-value { font-size: 0.85rem; color: #e2e2e8; font-variant-numeric: tabular-nums; }
      `}</style>
    </div>
  );
}
