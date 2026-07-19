'use client';
import { useEffect, useRef } from 'react';

interface Node {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  isMajor: boolean;
}

const GRID_COLS = 14;
const GRID_ROWS = 10;
const TOTAL_NODES = GRID_COLS * GRID_ROWS;

function quantizeAngle(angle: number): number {
  return Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
}

export default function VaultCanvas() {
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
    let mouseX = -1000;
    let mouseY = -1000;
    let time = 0;

    const nodes: Node[] = [];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      const spacingX = canvas!.width / (GRID_COLS + 1);
      const spacingY = canvas!.height / (GRID_ROWS + 1);
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const i = r * GRID_COLS + c;
          if (!nodes[i]) {
            nodes[i] = {
              baseX: (c + 1) * spacingX,
              baseY: (r + 1) * spacingY,
              x: (c + 1) * spacingX,
              y: (r + 1) * spacingY,
              isMajor: Math.random() < 0.15,
            };
          } else {
            nodes[i].baseX = (c + 1) * spacingX;
            nodes[i].baseY = (r + 1) * spacingY;
          }
        }
      }
    }
    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    const onMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };
    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);

    function isAdjacent(i: number, j: number): boolean {
      const ri = Math.floor(i / GRID_COLS);
      const ci = i % GRID_COLS;
      const rj = Math.floor(j / GRID_COLS);
      const cj = j % GRID_COLS;
      const dr = Math.abs(ri - rj);
      const dc = Math.abs(ci - cj);
      return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      time += 0.016;

      for (const node of nodes) {
        const dx = Math.sin(time + node.baseY * 0.1) * 5;
        const dy = Math.cos(time + node.baseX * 0.1) * 5;
        node.x = node.baseX + dx;
        node.y = node.baseY + dy;
      }

      const mouseDistances = nodes.map((node) => {
        const d = Math.sqrt((mouseX - node.baseX) ** 2 + (mouseY - node.baseY) ** 2);
        const closeness = Math.max(0, 1 - d / 300);
        return closeness;
      });

      for (let i = 0; i < TOTAL_NODES; i++) {
        const node = nodes[i];
        const closeness = mouseDistances[i];

        if (closeness > 0 && mouseX > -1000) {
          const angle = Math.atan2(node.baseY - mouseY, node.baseX - mouseX);
          const qAngle = quantizeAngle(angle);
          const snapDist = Math.min(closeness * 30, 20);
          node.x = node.baseX + Math.cos(qAngle) * snapDist;
          node.y = node.baseY + Math.sin(qAngle) * snapDist;
        }

        if (node.isMajor && closeness > 0) {
          const glow = ctx!.createRadialGradient(node.x, node.y, 0, node.x, node.y, 12);
          glow.addColorStop(0, `rgba(37, 99, 235, ${closeness * 0.4})`);
          glow.addColorStop(1, 'rgba(37, 99, 235, 0)');
          ctx!.fillStyle = glow;
          ctx!.fillRect(node.x - 12, node.y - 12, 24, 24);
        }

        ctx!.fillStyle = node.isMajor
          ? `rgba(37, 99, 235, ${0.4 + closeness * 0.4})`
          : `rgba(37, 99, 235, ${0.15 + closeness * 0.3})`;

        if (node.isMajor) {
          const size = 3 + closeness * 2;
          ctx!.fillRect(node.x - size / 2, node.y - size / 2, size, size);
        } else {
          ctx!.beginPath();
          ctx!.arc(node.x, node.y, 1.5, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      for (let i = 0; i < TOTAL_NODES; i++) {
        for (let j = i + 1; j < TOTAL_NODES; j++) {
          if (!isAdjacent(i, j)) continue;
          const closeness = Math.max(mouseDistances[i], mouseDistances[j]);
          if (closeness <= 0.05) continue;
          const ni = nodes[i];
          const nj = nodes[j];
          ctx!.beginPath();
          ctx!.moveTo(ni.x, ni.y);
          ctx!.lineTo(nj.x, nj.y);
          ctx!.strokeStyle = `rgba(37, 99, 235, ${0.1 + closeness * 0.5})`;
          ctx!.lineWidth = 0.5 + closeness * 0.5;
          ctx!.stroke();
        }
      }
    }

    const loop = (timeStamp: number) => {
      const delta = timeStamp - lastTime;
      if (delta >= FRAME_INTERVAL) {
        lastTime = timeStamp - (delta % FRAME_INTERVAL);
        draw();
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
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
