'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { BoundingBox } from '@/lib/api';

type ViewType = 'original' | 'noise' | 'clone' | 'overall';

interface Props {
  orgUrl: string;
  maskUrl: string;
  coords: BoundingBox[];
}

const VIEW_BUTTONS: { id: ViewType; label: string }[] = [
  { id: 'original', label: 'Original Image' },
  { id: 'noise', label: 'Noise Mask' },
  { id: 'clone', label: 'Clone Detection' },
  { id: 'overall', label: 'Overall' },
];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
}

function drawAIOverlay(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  maskImg: HTMLImageElement
) {
  const off = document.createElement('canvas');
  off.width = canvas.width;
  off.height = canvas.height;
  const offCtx = off.getContext('2d')!;
  offCtx.drawImage(maskImg, 0, 0);
  const imageData = offCtx.getImageData(0, 0, off.width, off.height);
  const pixels = imageData.data;
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i] > 128) {
      pixels[i] = 255;
      pixels[i + 1] = 0;
      pixels[i + 2] = 0;
      pixels[i + 3] = 128;
    } else {
      pixels[i + 3] = 0;
    }
  }
  offCtx.putImageData(imageData, 0, 0);
  ctx.drawImage(off, 0, 0);
}

function drawBoxes(ctx: CanvasRenderingContext2D, coords: BoundingBox[]) {
  ctx.strokeStyle = '#00FF00';
  ctx.lineWidth = 4;
  coords.forEach((box) => {
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.w, box.h);
    ctx.stroke();
  });
}

export default function CanvasView({ orgUrl, maskUrl, coords }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orgImgRef = useRef<HTMLImageElement | null>(null);
  const maskImgRef = useRef<HTMLImageElement | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('overall');

  const renderView = useCallback(
    (view: ViewType) => {
      const canvas = canvasRef.current;
      const orgImg = orgImgRef.current;
      const maskImg = maskImgRef.current;
      if (!canvas || !orgImg || !maskImg) return;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(orgImg, 0, 0);
      if (view === 'noise' || view === 'overall') drawAIOverlay(canvas, ctx, maskImg);
      if (view === 'clone' || view === 'overall') drawBoxes(ctx, coords);
    },
    [coords]
  );

  useEffect(() => {
    (async () => {
      const [org, mask] = await Promise.all([loadImage(orgUrl), loadImage(maskUrl)]);
      orgImgRef.current = org;
      maskImgRef.current = mask;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = org.width;
        canvas.height = org.height;
      }
      renderView('overall');
    })();
  }, [orgUrl, maskUrl, renderView]);

  const handleViewChange = (view: ViewType) => {
    setActiveView(view);
    renderView(view);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <canvas
        ref={canvasRef}
        className="w-[90%] h-auto block mx-auto rounded-lg shadow-md"
      />
      <div className="flex gap-2 flex-wrap justify-center">
        {VIEW_BUTTONS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => handleViewChange(id)}
            className={`rounded-lg border-2 px-4 py-2 text-base cursor-pointer transition-all duration-300 ${
              activeView === id
                ? 'border-cyan-400 bg-[#002850] text-cyan-400'
                : 'border-[#020a1c] bg-[#080f32]/40 text-cyan-400 hover:bg-[#002850] hover:border-cyan-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
