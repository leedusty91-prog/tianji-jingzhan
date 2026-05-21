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

    // Define 4 waves with different frequencies, speeds, and bright colors
    const waves: Wave[] = [
      {
        yFactor: 0.55,
        length: 0.003,
        amplitude: 45,
        speed: 0.004,
        offset: 0,
        gradientColors: ['rgba(224, 242, 241, 0.45)', 'rgba(179, 229, 252, 0.35)'],
      },
      {
        yFactor: 0.68,
        length: 0.005,
        amplitude: 35,
        speed: 0.007,
        offset: Math.PI / 2,
        gradientColors: ['rgba(179, 229, 252, 0.4)', 'rgba(128, 222, 234, 0.3)'],
      },
      {
        yFactor: 0.8,
        length: 0.004,
        amplitude: 55,
        speed: 0.003,
        offset: Math.PI,
        gradientColors: ['rgba(230, 244, 255, 0.5)', 'rgba(251, 230, 156, 0.18)'], // Gold hint
      },
      {
        yFactor: 0.88,
        length: 0.006,
        amplitude: 25,
        speed: 0.005,
        offset: Math.PI * 1.5,
        gradientColors: ['rgba(128, 203, 196, 0.35)', 'rgba(179, 229, 252, 0.45)'],
      },
    ];

    const tick = () => {
      if (!isPlayingRef.current) return;

      const w = window.innerWidth;
      const h = window.innerHeight;

      // Clear with a bright watercolor gradient representing sky/mist
      ctx.clearRect(0, 0, w, h);
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#f2f8f7');
      skyGrad.addColorStop(0.5, '#e0f2f1');
      skyGrad.addColorStop(1, '#e1f5fe');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Draw each wave
      waves.forEach((wave) => {
        ctx.beginPath();
        
        const startY = h * wave.yFactor;
        
        ctx.moveTo(0, h);
        
        for (let x = 0; x <= w; x += 5) {
          // Calculate wave height using sine wave function
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
