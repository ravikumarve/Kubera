'use client';
import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  state: 'inbound' | 'escrow' | 'released';
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  age: number;
}

export default function KineticCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = 0;
    const FPS = 30;
    const FRAME_INTERVAL = 1000 / FPS;

    const PARTICLE_COUNT = 300;
    const CENTER_X = () => canvas!.width / 2;
    const CENTER_Y = () => canvas!.height / 2;
    const ESCROW_RADIUS = 220;

    const resize = () => {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: Particle[] = [];

    function createParticle(index: number): Particle {
      const cx = CENTER_X();
      const cy = CENTER_Y();
      const angle = Math.random() * Math.PI * 2;
      const dist = 200 + Math.random() * 400;
      return {
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        state: 'inbound',
        vx: 0.3 + Math.random() * 0.5,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: 0.15 + Math.random() * 0.25,
        size: 1 + Math.random() * 2,
        age: index * 2,
      };
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle(i));
    }

    let mouseX = CENTER_X();
    let mouseY = CENTER_Y();
    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', onMouseMove);

    function update() {
      const cx = CENTER_X();
      const cy = CENTER_Y();

      for (const p of particles) {
        p.age++;

        if (p.state === 'inbound') {
          const dx = cx - p.x;
          const dy = cy - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          p.x += (dx / dist) * p.vx;
          p.y += (dy / dist) * p.vy;
          p.x += Math.sin(p.age * 0.01) * 0.3;

          if (dist < ESCROW_RADIUS + 20) {
            p.state = 'escrow';
            p.vx = (Math.random() - 0.5) * 0.8;
            p.vy = (Math.random() - 0.5) * 0.8;
          }
        } else if (p.state === 'escrow') {
          const dx = p.x - cx;
          const dy = p.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const tangentX = -dy / (dist || 1);
          const tangentY = dx / (dist || 1);
          p.vx += tangentX * 0.003;
          p.vy += tangentY * 0.003;
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (speed > 1.5) {
            p.vx = (p.vx / speed) * 1.5;
            p.vy = (p.vy / speed) * 1.5;
          }
          p.x += p.vx;
          p.y += p.vy;

          const mouseDist = Math.sqrt((p.x - mouseX) ** 2 + (p.y - mouseY) ** 2);
          if (mouseDist < 80) {
            p.state = 'released';
            p.vx = 3 + Math.random() * 4;
            p.vy = (Math.random() - 0.5) * 2;
          }
        } else if (p.state === 'released') {
          p.vx += 0.05;
          p.x += p.vx;
          p.y += p.vy;
          p.alpha *= 0.99;

          if (p.x > canvas!.width + 50 || p.alpha < 0.01) {
            Object.assign(p, createParticle(0));
            p.x = cx + (Math.random() - 0.5) * 200;
            p.y = cy + (Math.random() - 0.5) * 200;
          }
        }
      }
    }

    function draw() {
      ctx!.globalAlpha = 1;
      ctx!.fillStyle = 'rgba(3, 3, 3, 0.15)';
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      const cx = CENTER_X();
      const cy = CENTER_Y();

      ctx!.beginPath();
      ctx!.arc(cx, cy, ESCROW_RADIUS, 0, Math.PI * 2);
      ctx!.strokeStyle = 'rgba(0, 255, 163, 0.06)';
      ctx!.lineWidth = 1;
      ctx!.setLineDash([6, 12]);
      ctx!.stroke();
      ctx!.setLineDash([]);

      for (const p of particles) {
        let color: string;
        if (p.state === 'escrow') {
          color = `rgba(0, 255, 163, ${p.alpha})`;
        } else if (p.state === 'released') {
          color = `rgba(255, 255, 255, ${p.alpha * 0.8})`;
        } else {
          color = `rgba(255, 255, 255, ${p.alpha * 0.3})`;
        }
        ctx!.fillStyle = color;
        ctx!.fillRect(p.x, p.y, p.size, p.size);
      }
    }

    const loop = (time: number) => {
      const delta = time - lastTime;
      if (delta >= FRAME_INTERVAL) {
        lastTime = time - (delta % FRAME_INTERVAL);
        update();
        draw();
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, width: '100vw', height: '100vh',
        zIndex: 0, pointerEvents: 'none', mixBlendMode: 'screen' as const,
        display: 'block',
      }}
    />
  );
}
