import React, { useRef, useEffect } from 'react';

interface MatrixBackgroundProps {
  speed?: number;
  density?: number;
  colorPrimary?: string;
}

const CHARACTERS = '>_{}[];:ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/\\|!?@#$%^&*()';

export default function MatrixBackground({ speed = 1, density = 1, colorPrimary = '#1a6cf5' }: MatrixBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let burstIntervalId: NodeJS.Timeout;

    const baseFontSize = 18;
    let columns = 0;
    
    interface ColumnData {
        x: number;
        y: number;
        speed: number;
        opacity: number;
        chars: { char: string; opacityScale: number }[];
        tick: number;
        changeRate: number;
        isCenter: boolean;
        centerDist: number;
        columnFontSize: number;
        active: boolean;
        delayFrames: number;
    }

    let drops: ColumnData[] = [];
    
    let speedMultiplier = 1;
    let burstState = 0; // 0: normal, 1: ramping up, 2: hold, 3: ramping down
    let burstFrame = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.ceil(canvas.width / 12); // Higher density potential

      drops = [];
      for (let i = 0; i < columns; i++) {
        const centerDist = 1 - Math.abs((i / columns) - 0.5) * 2;
        const isCenter = centerDist > 0.6;
        const active = Math.random() < 0.7;
        
        // Depth-based font size: 9-11px edges, 14-16px center
        const columnFontSize = isCenter 
            ? Math.floor(Math.random() * 3) + 14 
            : Math.floor(Math.random() * 3) + 9;

        // Cluster logic: 1-3 characters
        const clusterSize = Math.floor(Math.random() * 3) + 1;
        const chars = [];
        for (let c = 0; c < clusterSize; c++) {
            chars.push({
                char: CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)],
                // Lead is c=0, brightest. Others fade.
                opacityScale: c === 0 ? 1 : (c === 1 ? 0.3 : 0.1)
            });
        }

        drops.push({
          x: i * 15, // distribute based on a fixed step
          y: Math.random() * -canvas.height, // Initial random height (starting off-screen or partway)
          speed: (Math.random() * 0.8 + 0.4) * (1 + centerDist * 1.5), 
          opacity: (Math.random() * 0.2 + 0.05) + (centerDist * 0.2), // Depth brightness
          chars,
          tick: 0,
          changeRate: Math.floor(Math.random() * 15) + 5,
          isCenter,
          centerDist,
          columnFontSize,
          active,
          delayFrames: 0
        });
      }
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Handle Burst State
      if (burstState === 1) {
          burstFrame++;
          speedMultiplier = 1 + (3.0 * (burstFrame / 15)); // ramp from 1 to 4.0
          if (burstFrame >= 15) {
              burstState = 2;
              burstFrame = 0;
          }
      } else if (burstState === 2) {
          burstFrame++;
          if (burstFrame >= 60) {
              burstState = 3;
              burstFrame = 0;
          }
      } else if (burstState === 3) {
          burstFrame++;
          const t = burstFrame / 20;
          speedMultiplier = 4.0 - (3.0 * t); // ramp from 4.0 down to 1.0
          if (burstFrame >= 20) {
              burstState = 0;
              burstFrame = 0;
              speedMultiplier = 1;
          }
      }

      ctx.save();
      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        if (!drop.active) continue;
        
        if (drop.delayFrames > 0) {
            drop.delayFrames--;
            continue;
        }

        // Update character change
        drop.tick++;
        if (drop.tick > drop.changeRate) {
            drop.chars.forEach(c => {
                c.char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
            });
            drop.tick = 0;
        }

        // Draw Cluster
        ctx.font = `${drop.columnFontSize}px Montserrat`;
        
        drop.chars.forEach((c, idx) => {
            const charY = drop.y - (idx * drop.columnFontSize);
            if (charY < 0 || charY > canvas.height + drop.columnFontSize) return;

            // Trail opacity: Top brightest (0.6-0.8), others fade.
            const leadBaseOpacity = Math.random() * 0.2 + 0.6;
            const finalOpacity = idx === 0 
                ? leadBaseOpacity * drop.opacity * 2 // boost lead
                : c.opacityScale * drop.opacity;

            const renderOpacity = Math.min(finalOpacity, 1);
            
            // Burst Glow Effect
            if (burstState !== 0 && idx === 0 && renderOpacity > 0.1) {
                ctx.shadowColor = '#00cfff';
                ctx.shadowBlur = 8;
            } else {
                ctx.shadowBlur = 0;
            }

            let colorStr = drop.isCenter 
                ? `rgba(0, 207, 255, ${renderOpacity})`
                : `rgba(26, 108, 245, ${renderOpacity})`;
                
            ctx.fillStyle = colorStr;
            ctx.fillText(c.char, drop.x, charY);

            // Lead White Overlay (50% opacity of the lead's brightness)
            if (idx === 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${renderOpacity * 0.5})`;
                ctx.fillText(c.char, drop.x, charY);
            }
        });

        // Move drop
        drop.y += drop.speed * speed * speedMultiplier;

        // Reset if off screen (including the trail)
        const clusterVisualHeight = drop.chars.length * drop.columnFontSize;
        if (drop.y > canvas.height + clusterVisualHeight) {
          drop.y = -drop.columnFontSize;
          // 2-4 seconds pause (approx 60fps * 2 to 60fps * 4)
          drop.delayFrames = Math.floor(Math.random() * 120) + 120;
          
          // Refresh column properties slightly for variety
          drop.speed = (Math.random() * 0.8 + 0.4) * (1 + drop.centerDist * 1.5);
          drop.opacity = (Math.random() * 0.2 + 0.05) + (drop.centerDist * 0.2);
        }
      }
      ctx.restore();

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    burstIntervalId = setInterval(() => {
        if (burstState === 0) {
            burstState = 1;
            burstFrame = 0;
        }
    }, 3000);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
      clearInterval(burstIntervalId);
    };
  }, [speed, density, colorPrimary]);

  return <canvas ref={canvasRef} style={{ display: 'block', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />;
}
