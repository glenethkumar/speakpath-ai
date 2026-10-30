import React, { useEffect, useRef } from 'react';
import type { VoiceState } from '../types';

interface AudioVisualizerProps {
  voiceState: VoiceState;
  volume: number; // 0 to 1
  isMuted: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  voiceState,
  volume,
  isMuted,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      phase += 0.08;

      if (isMuted || voiceState === 'idle' || voiceState === 'error') {
        // Flat calm baseline line
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
      }

      if (voiceState === 'coach_speaking') {
        // AI Speaking Waveform (Vibrant Purple / Indigo / Magenta gradient)
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#6366f1'); // Indigo
        gradient.addColorStop(0.5, '#a855f7'); // Purple
        gradient.addColorStop(1, '#ec4899'); // Pink

        const barCount = 36;
        const barWidth = width / barCount - 3;

        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + 3);
          const sinus = Math.sin(phase + i * 0.35);
          const barHeight = Math.max(6, Math.abs(sinus) * 38 + Math.sin(phase * 1.5 + i) * 12);
          const y = centerY - barHeight / 2;

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 3);
          ctx.fill();
        }
      } else {
        // Student Speaking / Listening Wave (Emerald / Cyan responsive wave)
        const effectiveAmp = Math.max(0.12, volume * 1.5);
        const waveCount = 3;

        for (let w = 0; w < waveCount; w++) {
          ctx.beginPath();
          const alpha = 0.8 - w * 0.25;
          ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`; // Emerald
          ctx.lineWidth = 3 - w * 0.8;

          for (let x = 0; x < width; x += 4) {
            const relX = (x / width) * Math.PI * 4;
            const y =
              centerY +
              Math.sin(relX + phase + w * 0.8) *
                (effectiveAmp * 32) *
                Math.sin((x / width) * Math.PI); // Envelope to 0 at edges
            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [voiceState, volume, isMuted]);

  return (
    <div className="w-full flex flex-col items-center justify-center py-2">
      <canvas
        ref={canvasRef}
        width={340}
        height={70}
        className="max-w-full drop-shadow-md"
      />
    </div>
  );
};
