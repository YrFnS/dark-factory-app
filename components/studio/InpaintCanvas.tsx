'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

interface InpaintCanvasProps {
  /** URL of the image to load */
  imageUrl: string | null;
  /** Current brush size in pixels */
  brushSize: number;
  /** Current brush hardness 0-1 */
  brushHardness: number;
  /** Whether eraser mode is active */
  eraserMode: boolean;
  /** Callback when image+mask data is ready */
  onDataReady?: (data: { original: string; mask: string }) => void;
}

interface Point {
  x: number;
  y: number;
}

/**
 * HTML5 canvas inpaint editor.
 * Renders an image on the main canvas, mask overlay on top.
 * Brush/eraser draws on the mask layer.
 * Zoom and pan via transform.
 */
export function InpaintCanvas({
  imageUrl,
  brushSize,
  brushHardness,
  eraserMode,
  onDataReady,
}: InpaintCanvasProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);

  // Mask stroke history for undo
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef(-1);

  // Load image when URL changes
  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setLoadedImage(img);
      // Reset zoom/pan on new image
      setZoom(1);
      setPan({ x: 0, y: 0 });
      historyRef.current = [];
      historyIndexRef.current = -1;
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Draw image onto canvas when loaded
  useEffect(() => {
    if (!loadedImage || !imageCanvasRef.current || !maskCanvasRef.current) return;

    const imageCanvas = imageCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;

    // Size canvases to image
    imageCanvas.width = loadedImage.width;
    imageCanvas.height = loadedImage.height;
    maskCanvas.width = loadedImage.width;
    maskCanvas.height = loadedImage.height;

    // Draw image
    const ictx = imageCanvas.getContext('2d');
    if (!ictx) return;
    ictx.drawImage(loadedImage, 0, 0);
  }, [loadedImage]);

  // Resize mask canvas to match image canvas
  useEffect(() => {
    if (!imageCanvasRef.current || !maskCanvasRef.current) return;
    maskCanvasRef.current.width = imageCanvasRef.current.width;
    maskCanvasRef.current.height = imageCanvasRef.current.height;
  }, [loadedImage]);

  // Push current mask state to history
  const pushHistory = useCallback(() => {
    if (!maskCanvasRef.current) return;
    const ctx = maskCanvasRef.current.getContext('2d');
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    // Truncate any redo history
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(data);
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const data = historyRef.current[historyIndexRef.current];
    if (!maskCanvasRef.current || !data) return;
    const ctx = maskCanvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(data, 0, 0);
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const data = historyRef.current[historyIndexRef.current];
    if (!maskCanvasRef.current || !data) return;
    const ctx = maskCanvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(data, 0, 0);
  }, []);

  // Get canvas coordinates from mouse event
  const getCanvasPoint = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): Point | null => {
      if (!maskCanvasRef.current || !containerRef.current) return null;
      const rect = maskCanvasRef.current.getBoundingClientRect();
      // Account for zoom and pan
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      return { x, y };
    },
    [zoom]
  );

  // Draw a brush stroke between two points
  const drawStroke = useCallback(
    (from: Point, to: Point) => {
      if (!maskCanvasRef.current) return;
      const ctx = maskCanvasRef.current.getContext('2d');
      if (!ctx) return;

      ctx.save();
      if (eraserMode) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.globalAlpha = 1;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = brushHardness * 0.5; // scale hardness to a useful range
        ctx.fillStyle = '#ff0000';
      }

      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.restore();
    },
    [brushSize, brushHardness, eraserMode]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!loadedImage) return;

      // Middle mouse or Ctrl+click = pan
      if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
        setIsPanning(true);
        setLastPoint({ x: e.clientX, y: e.clientY });
        return;
      }

      if (e.button !== 0) return;
      const pt = getCanvasPoint(e);
      if (!pt) return;

      // Save history before starting stroke
      pushHistory();
      setIsDrawing(true);
      setLastPoint(pt);
    },
    [loadedImage, getCanvasPoint, pushHistory]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isPanning && lastPoint) {
        setPan((prev) => ({
          x: prev.x + e.clientX - lastPoint.x,
          y: prev.y + e.clientY - lastPoint.y,
        }));
        setLastPoint({ x: e.clientX, y: e.clientY });
        return;
      }

      if (!isDrawing || !lastPoint) return;
      const pt = getCanvasPoint(e);
      if (!pt) return;
      drawStroke(lastPoint, pt);
      setLastPoint(pt);
    },
    [isDrawing, lastPoint, isPanning, getCanvasPoint, drawStroke]
  );

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
    setIsPanning(false);
    setLastPoint(null);
  }, []);

  // Expose undo/redo externally via window (simple approach)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        e.preventDefault();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        redo();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [undo, redo]);

  // Call onDataReady when image changes
  useEffect(() => {
    if (!loadedImage || !onDataReady) return;
    const data = {
      original: imageCanvasRef.current?.toDataURL('image/png') ?? '',
      mask: maskCanvasRef.current?.toDataURL('image/png') ?? '',
    };
    onDataReady(data);
  }, [loadedImage, onDataReady]);

  const containerCursor = isPanning
    ? 'grabbing'
    : eraserMode
    ? 'cell'
    : 'crosshair';

  return (
    <div
      ref={containerRef}
      className="inpaint-container"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#0a0a0c',
        cursor: containerCursor,
      }}
      onMouseLeave={handleMouseUp}
    >
      {/* Canvas layers */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Image canvas (bottom) */}
        <canvas
          ref={imageCanvasRef}
          style={{ display: 'block', position: 'absolute', top: 0, left: 0 }}
        />
        {/* Mask canvas (top) */}
        <canvas
          ref={maskCanvasRef}
          style={{
            display: 'block',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      </div>

      {/* Invisible full-area overlay for better mouse tracking when zoomed */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Fit button hint */}
      {!loadedImage && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#52525b',
            fontSize: '14px',
          }}
        >
          No image loaded
        </div>
      )}

      <style jsx>{`
        .inpaint-container {
          user-select: none;
        }
      `}</style>
    </div>
  );
}

// Expose fitToView, undo, redo as methods — call via ref if needed
export type InpaintCanvasHandle = {
  fitToView: () => void;
  undo: () => void;
  redo: () => void;
};
