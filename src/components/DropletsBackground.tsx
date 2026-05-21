import React, { useEffect, useRef } from 'react';

// ==========================================================================
// 1. Environmental Simulation Config
// ==========================================================================
const CONFIG = {
  rainIntensity: 0.45,  // 0.0 to 1.0 (Organic condensation rate)
  windVelocity: 0.5,    // 0.0 to 1.0 (0.5 means calm center, no horizontal sway)
  maxDroplets: 250      // Safety cap to avoid frame rate drops on low-end systems
};

interface TrailPoint {
  x: number;
  y: number;
  r: number;
  alpha: number;
}

// ==========================================================================
// 2. Strongly-Typed GlassDroplet Physics Engine
// ==========================================================================
class GlassDroplet {
  x: number;
  y: number;
  r: number;
  targetR: number;
  currentR: number = 0;
  
  isStatic: boolean = true;
  speedY: number = 0;
  speedX: number = 0;
  
  wiggleOffset: number;
  wiggleSpeed: number;
  
  trail: TrailPoint[] = [];
  lastTrailTime: number = 0;
  mass: number;
  landProgress: number = 0;

  constructor(x: number, y: number, r: number) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.targetR = r;
    this.mass = r * r;
    
    this.wiggleOffset = Math.random() * Math.PI * 2;
    this.wiggleSpeed = Math.random() * 0.06 + 0.03;
  }

  update(time: number, windScale: number, width: number) {
    // 1. Landing expansion animation (creating "splat" condensation feel)
    if (this.currentR < this.targetR) {
      this.landProgress += 0.08;
      this.currentR = Math.min(this.targetR, this.targetR * Math.sin((this.landProgress * Math.PI) / 2));
    }

    // 2. Glass Sliding Physics
    if (!this.isStatic) {
      // Gravity downward push scale based on droplet mass
      const gravityPush = this.mass * 0.02 + 0.65;
      this.speedY = gravityPush;
      this.speedX = (windScale - 0.5) * 1.5; // Wind displacement

      // Lateral organic wiggle
      const wiggle = Math.sin(this.y * 0.04 + this.wiggleOffset) * 0.5;

      this.y += this.speedY;
      this.x += this.speedX + wiggle;

      // Wrap-around horizontal bounds safely
      if (this.x < -this.r) this.x = width + this.r;
      if (this.x > width + this.r) this.x = -this.r;

      // Spawn trails (traces of water sliding down)
      if (time - this.lastTrailTime > 60) {
        const trailR = Math.random() * 0.35 + 0.75;
        this.trail.push({
          x: this.x - (this.speedX + wiggle) * 0.4,
          y: this.y - this.speedY * 0.4,
          r: trailR,
          alpha: 0.7
        });

        // Cap trail size
        if (this.trail.length > 40) this.trail.shift();

        // Mass erosion during slide (water drops smaller droplets behind, losing mass)
        this.r -= 0.022;
        this.mass = this.r * this.r;
        this.lastTrailTime = time;
      }

      // If droplet becomes too small, it loses momentum and adheres statically to glass
      if (this.r < 1.8) {
        this.isStatic = true;
        this.r = 1.8;
        this.mass = this.r * this.r;
      }
    }

    // 3. Update fading trails
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const tr = this.trail[i];
      tr.alpha -= 0.00045; // Water trails dry slowly
      if (tr.alpha <= 0) {
        this.trail.splice(i, 1);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    // 1. Draw water residue trail paths behind (Enhanced opacity for better trace visibility)
    for (let i = 0; i < this.trail.length; i++) {
      const tr = this.trail[i];
      ctx.fillStyle = `rgba(255, 255, 255, ${tr.alpha * 0.36})`;
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, tr.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const r = this.currentR;
    if (r <= 0) return;

    ctx.save();

    // 2. Soft Drop Shadow (Darkened for better contrast on lighter background)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.38)';
    ctx.shadowBlur = r * 0.3 + 1.2;
    ctx.shadowOffsetX = r * 0.12 + 0.5;
    ctx.shadowOffsetY = r * 0.18 + 0.5;

    ctx.fillStyle = 'rgba(5, 12, 8, 0.09)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Reset shadow parameters for inner elements
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 3. Convex Water Lens Radial Gradient (Light refocused in center for 3D transparency)
    const baseGrad = ctx.createRadialGradient(
      this.x - r * 0.25,
      this.y - r * 0.25,
      0,
      this.x,
      this.y,
      r
    );
    baseGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)'); // Glowing core refraction
    baseGrad.addColorStop(0.5, 'rgba(15, 28, 22, 0.04)');
    baseGrad.addColorStop(1, 'rgba(3, 8, 5, 0.48)');

    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();

    // 4. Inner Shadow Refraction (Dark arc top-left, Light focus arc bottom-right)
    
    // Top-left dark shadow boundary (increased opacity for stronger refraction shadow)
    const darkGrad = ctx.createLinearGradient(
      this.x - r * 0.6,
      this.y - r * 0.6,
      this.x + r * 0.5,
      this.y + r * 0.5
    );
    darkGrad.addColorStop(0, 'rgba(0, 0, 0, 0.78)');
    darkGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.08)');
    darkGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.strokeStyle = darkGrad;
    ctx.lineWidth = Math.max(1.2, r * 0.16);
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0.1, r - ctx.lineWidth / 2 - 0.5), Math.PI * 0.8, Math.PI * 1.7);
    ctx.stroke();

    // Bottom-right illuminated focal boundary (Increased brightness for brilliant light collection)
    const lightGrad = ctx.createLinearGradient(
      this.x - r * 0.5,
      this.y - r * 0.5,
      this.x + r * 0.6,
      this.y + r * 0.6
    );
    lightGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    lightGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
    lightGrad.addColorStop(1, 'rgba(255, 255, 255, 0.58)');

    ctx.strokeStyle = lightGrad;
    ctx.lineWidth = Math.max(1.2, r * 0.22);
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0.1, r - ctx.lineWidth / 2 - 0.5), Math.PI * 1.85, Math.PI * 0.7);
    ctx.stroke();

    // 5. Sharp Specular Reflection Spot (Brilliant shine dot)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
    ctx.beginPath();
    const specX = this.x - r * 0.42;
    const specY = this.y - r * 0.42;
    const specR = Math.max(0.75, r * 0.15);
    ctx.arc(specX, specY, specR, 0, Math.PI * 2);
    ctx.fill();

    // 6. Secondary soft ground glint (reflections from environmental sky glow)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.beginPath();
    const glintX = this.x + r * 0.35;
    const glintY = this.y + r * 0.35;
    const glintR = Math.max(0.4, r * 0.08);
    ctx.arc(glintX, glintY, glintR, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ==========================================================================
// 3. React Canvas Integration Component
// ==========================================================================
export const DropletsBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dropletsRef = useRef<GlassDroplet[]>([]);
  const isPlayingRef = useRef<boolean>(true);
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resizing & Retina High-DPI Scaling handler
    const resizeCanvas = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      // Scale standard drawing coordinates to high resolution
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initial condensation seeding: populate viewport immediately with random static droplets
    const initialSeedCount = 45;
    const width = window.innerWidth;
    const height = window.innerHeight;
    for (let i = 0; i < initialSeedCount; i++) {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      const val = Math.random();
      let rr = 2.0;

      if (val > 0.96) {
        rr = Math.random() * 3.5 + 4.5;
      } else if (val > 0.8) {
        rr = Math.random() * 2.0 + 2.5;
      } else {
        rr = Math.random() * 0.8 + 1.6;
      }

      const drop = new GlassDroplet(rx, ry, rr);
      // Let initial drops start fully landed so they don't all pop in simultaneously
      drop.landProgress = 1.0;
      drop.currentR = rr;
      dropletsRef.current.push(drop);
    }

    // Spawning function during loop
    const spawnRandomDroplet = (w: number, h: number) => {
      const list = dropletsRef.current;
      if (list.length >= CONFIG.maxDroplets) return;

      const rx = Math.random() * w;
      const ry = Math.random() * h;
      const val = Math.random();
      let rr = 2.0;

      // Organic droplet sizes (mostly small, sparse large sliders)
      if (val > 0.94) {
        rr = Math.random() * 4.2 + 5.2; // Large drops (5.2 - 9.4px)
      } else if (val > 0.75) {
        rr = Math.random() * 2.2 + 2.8; // Medium drops (2.8 - 5.0px)
      } else {
        rr = Math.random() * 0.8 + 1.6; // Small condensation beads (1.6 - 2.4px)
      }

      list.push(new GlassDroplet(rx, ry, rr));
    };

    // Main animation step
    const tick = (currentTime: number) => {
      if (!isPlayingRef.current) return;

      const w = window.innerWidth;
      const h = window.innerHeight;

      // 1. Organic spawning based on condensation rate
      if (Math.random() < CONFIG.rainIntensity * 0.45) {
        spawnRandomDroplet(w, h);
      }

      // 2. Physics logic updates
      const list = dropletsRef.current;
      for (let i = 0; i < list.length; i++) {
        list[i].update(currentTime, CONFIG.windVelocity, w);
      }

      // 3. Collision Merging (Double loop collision solver)
      for (let i = 0; i < list.length; i++) {
        const d1 = list[i];
        for (let j = i + 1; j < list.length; j++) {
          const d2 = list[j];
          
          const dx = d2.x - d1.x;
          const dy = d2.y - d1.y;
          const distSq = dx * dx + dy * dy;
          const overlap = d1.r + d2.r;

          // Merge if overlapping (touching beads)
          if (distSq < overlap * overlap) {
            const m1 = d1.mass;
            const m2 = d2.mass;
            const totalMass = m1 + m2;

            // Center of mass recalculation for position
            d1.x = (d1.x * m1 + d2.x * m2) / totalMass;
            d1.y = (d1.y * m1 + d2.y * m2) / totalMass;

            // Area preservation: R_new = sqrt(R_1^2 + R_2^2)
            d1.r = Math.min(12, Math.sqrt(d1.r * d1.r + d2.r * d2.r));
            d1.targetR = d1.r;
            d1.mass = d1.r * d1.r;

            // Merge residue trails smoothly
            d1.trail = d1.trail.concat(d2.trail);
            if (d1.trail.length > 50) {
              d1.trail = d1.trail.slice(-50);
            }

            d1.currentR = d1.r; // Reset scale visual instantly

            // Set state: If either was sliding, or mass is large, activate slide
            if (!d1.isStatic || !d2.isStatic || d1.r > 5.0) {
              d1.isStatic = false;
            }

            // Remove the merged droplet from the array
            list.splice(j, 1);
            j--; // Adjust index
          }
        }
      }

      // 4. Heavy gravity sliding activation & boundary garbage collection
      for (let i = 0; i < list.length; i++) {
        const drop = list[i];

        // Heavy droplet sliding activation threshold
        if (drop.isStatic && drop.r > 5.0) {
          if (Math.random() < 0.05) { // Delay slide slightly for realism
            drop.isStatic = false;
          }
        }

        // Garbage collection: Remove droplet once it slides past the viewport bottom
        if (drop.y - drop.r > h) {
          list.splice(i, 1);
          i--;
        }
      }

      // 5. Draw Canvas pipeline
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < list.length; i++) {
        list[i].draw(ctx);
      }

      animationFrameIdRef.current = requestAnimationFrame(tick);
    };

    animationFrameIdRef.current = requestAnimationFrame(tick);

    // Visibility Listener: Pause animation fully when tab is inactive to preserve CPU / Battery
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

    // Cleanup logic
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
        zIndex: 99999,
        pointerEvents: 'none',
        display: 'block'
      }}
    />
  );
};

export default DropletsBackground;
