'use client';
import { useEffect, useRef } from 'react';

export default function KineticCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const bracketsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const brackets = bracketsRef.current;
    if (!dot || !brackets) return;

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    // Hide native cursor while this component is mounted
    document.body.style.cursor = 'none';

    let cursorX = window.innerWidth / 2;
    let cursorY = window.innerHeight / 2;
    let outlineX = cursorX;
    let outlineY = cursorY;
    let isHovering = false;
    let isOverInput = false;

    const isInputElement = (el: EventTarget | null): boolean => {
      if (!el || !(el instanceof Element)) return false;
      const tag = (el as Element).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      return (el as Element).getAttribute('contenteditable') === 'true';
    };

    const onMouseMove = (e: MouseEvent) => {
      cursorX = e.clientX;
      cursorY = e.clientY;
      isOverInput = isInputElement(e.target);
      dot.style.opacity = isOverInput ? '0' : '1';
      brackets.style.opacity = isOverInput ? '0' : '0.5';
      // Show native cursor over inputs
      document.body.style.cursor = isOverInput ? 'auto' : 'none';
    };

    window.addEventListener('mousemove', onMouseMove);

    const interactables = document.querySelectorAll('.interactive, .interactive-card, .btn');
    const onEnter = () => { isHovering = true; };
    const onLeave = () => { isHovering = false; };
    interactables.forEach((el) => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    let animId: number;
    const animate = () => {
      outlineX += (cursorX - outlineX) * 0.2;
      outlineY += (cursorY - outlineY) * 0.2;
      dot.style.left = `${cursorX}px`;
      dot.style.top = `${cursorY}px`;
      brackets.style.left = `${outlineX}px`;
      brackets.style.top = `${outlineY}px`;
      brackets.style.gap = isHovering ? '40px' : '20px';
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      document.body.style.cursor = '';
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
          backgroundColor: 'var(--mint-core)', borderRadius: '50%',
          zIndex: 9999, pointerEvents: 'none', transform: 'translate(-50%, -50%)',
          transition: 'opacity 0.15s',
        }}
      />
      <div
        ref={bracketsRef}
        style={{
          position: 'fixed', top: 0, left: 0, zIndex: 9999,
          pointerEvents: 'none', transform: 'translate(-50%, -50%)',
          display: 'flex', gap: 20, alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--text-main)',
          opacity: 0.5, transition: 'gap 0.2s cubic-bezier(0.16, 1, 0.3, 1), color 0.2s, opacity 0.15s',
        }}
      >
        <span>[</span>
        <span>]</span>
      </div>
    </>
  );
}
