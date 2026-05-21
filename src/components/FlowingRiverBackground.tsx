import React, { useEffect, useRef } from 'react';

interface Wave {
  yFactor: number;
  length: number;
  amplitude: number;
  speed: number;
  offset: number;
  gradientColors: [string, string];
}

export const FlowingRiverBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPlayingRef = useRef<boolean>(true);
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Define 4 waves with elegant ink-wash gradients and gold accents
    const waves: Wave[] = [
      {
        yFactor: 0.55,
        length: 0.003,
        amplitude: 45,
        speed: 0.0035,
        offset: 0,
        gradientColors: ['rgba(33, 33, 33, 0.12)', 'rgba(66, 66, 66, 0.06)'], // Deep ink
      },
      {
        yFactor: 0.68,
        length: 0.005,
        amplitude: 35,
        speed: 0.006,
        offset: Math.PI / 2,
        gradientColors: ['rgba(117, 117, 117, 0.15)', 'rgba(189, 189, 189, 0.05)'], // Misty grey
      },
      {
        yFactor: 0.8,
        length: 0.004,
        amplitude: 55,
        speed: 0.0025,
        offset: Math.PI,
        gradientColors: ['rgba(178, 146, 26, 0.09)', 'rgba(250, 243, 224, 0.03)'], // Subtle gold mist
      },
      {
        yFactor: 0.88,
        length: 0.006,
        amplitude: 25,
        speed: 0.0045,
        offset: Math.PI * 1.5,
        gradientColors: ['rgba(40, 44, 52, 0.14)', 'rgba(74, 85, 104, 0.04)'], // Soft charcoal
      },
    ];

    const tick = () => {
      if (!isPlayingRef.current) return;

      const w = window.innerWidth;
      const h = window.innerHeight;

      // Clear with elegant off-white watercolor paper gradient
      ctx.clearRect(0, 0, w, h);
      const paperGrad = ctx.createLinearGradient(0, 0, 0, h);
      paperGrad.addColorStop(0, '#FAF7F2');  // Warm off-white
      paperGrad.addColorStop(0.5, '#F5F1E9');
      paperGrad.addColorStop(1, '#EDE7DC');   // Soft ivory paper base
      ctx.fillStyle = paperGrad;
      ctx.fillRect(0, 0, w, h);

      // Draw subtle paper grain/noise to simulate actual watercolor paper
      ctx.fillStyle = 'rgba(0, 0, 0, 0.015)';
      for (let i = 0; i < 80; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const size = Math.random() * 2 + 1;
        ctx.fillRect(x, y, size, size);
      }

      // Draw each wave
      waves.forEach((wave, idx) => {
        ctx.beginPath();
        
        const startY = h * wave.yFactor;
        
        ctx.moveTo(0, h);
        
        for (let x = 0; x <= w; x += 5) {
          const y = startY + Math.sin(x * wave.length + wave.offset) * wave.amplitude;
          ctx.lineTo(x, y);
        }
        
        ctx.lineTo(w, h);
        ctx.closePath();

        // Create a vertical gradient for the wave
        const waveGrad = ctx.createLinearGradient(0, startY - wave.amplitude, 0, h);
        waveGrad.addColorStop(0, wave.gradientColors[0]);
        waveGrad.addColorStop(1, wave.gradientColors[1]);

        ctx.fillStyle = waveGrad;
        ctx.fill();

        // Draw wave crest outlines (subtle gold strokes for specific waves, ink strokes for others)
        ctx.beginPath();
        for (let x = 0; x <= w; x += 8) {
          const y = startY + Math.sin(x * wave.length + wave.offset) * wave.amplitude;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        
        if (idx === 2) {
          // Gold wave crest
          ctx.strokeStyle = 'rgba(178, 146, 26, 0.28)';
          ctx.lineWidth = 1.8;
        } else {
          // Ink-wash crest
          ctx.strokeStyle = 'rgba(66, 66, 66, 0.12)';
          ctx.lineWidth = 1.2;
        }
        ctx.stroke();

        // Update offset for animation
        wave.offset += wave.speed;
      });

      animationFrameIdRef.current = requestAnimationFrame(tick);
    };

    animationFrameIdRef.current = requestAnimationFrame(tick);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPlayingRef.current = false;
        if (animationFrameIdRef.current !== null) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
      } else {
        if (!isPlayingRef.current) {
          isPlayingRef.current = true;
          animationFrameIdRef.current = requestAnimationFrame(tick);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isPlayingRef.current = false;
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1, // Behind the content
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
};

export default FlowingRiverBackground;
