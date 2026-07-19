'use client';
import { useEffect, useRef } from 'react';

export default function VaultCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    let cursorX = window.innerWidth / 2;
    let cursorY = window.innerHeight / 2;
    let outlineX = cursorX;
    let outlineY = cursorY;
    let isHovering = false;

    const onMouseMove = (e: MouseEvent) => {
      cursorX = e.clientX;
      cursorY = e.clientY;
    };

    window.addEventListener('mousemove', onMouseMove);

    const interactables = document.querySelectorAll('.interactive');
    const onEnter = () => { isHovering = true; };
    const onLeave = () => { isHovering = false; };
    interactables.forEach((el) => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    let animId: number;
    const animate = () => {
      outlineX += (cursorX - outlineX) * 0.15;
      outlineY += (cursorY - outlineY) * 0.15;
      dot.style.left = `${cursorX}px`;
      dot.style.top = `${cursorY}px`;
      ring.style.left = `${outlineX}px`;
      ring.style.top = `${outlineY}px`;
      const size = isHovering ? 48 : 32;
      ring.style.width = `${size}px`;
      ring.style.height = `${size}px`;
      ring.style.borderColor = isHovering ? 'var(--accent)' : 'rgba(255,255,255,0.3)';
      ring.style.background = isHovering ? 'rgba(37,99,235,0.05)' : 'transparent';
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      interactables.forEach((el) => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: 'fixed', top: 0, left: 0, width: 4, height: 4,
          backgroundColor: '#ffffff', borderRadius: '50%',
          zIndex: 9999, pointerEvents: 'none', transform: 'translate(-50%, -50%)',
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: 'fixed', top: 0, left: 0, width: 32, height: 32,
          borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)',
          zIndex: 9999, pointerEvents: 'none', transform: 'translate(-50%, -50%)',
          transition: 'width 0.15s cubic-bezier(0.16, 1, 0.3, 1), height 0.15s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.15s, background 0.15s',
        }}
      />
    </>
  );
}
