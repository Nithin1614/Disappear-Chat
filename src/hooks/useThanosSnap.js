import { useCallback, useRef } from 'react';

const PARTICLE_COUNT = 60;

/**
 * Hook for in-place Thanos snap text disintegration effect (NO black background, NO skull).
 * Spawns particle particles floating away from text while dissolving target element with CSS.
 * Works 100% reliably on all mobile & desktop browsers.
 */
export function useThanosSnap() {
  const isRunningRef = useRef(false);

  const triggerSnap = useCallback((targetElement, onComplete) => {
    if (isRunningRef.current || !targetElement) {
      if (onComplete) onComplete();
      return;
    }
    isRunningRef.current = true;

    try {
      const rect = targetElement.getBoundingClientRect();

      // Create particle overlay container over target element
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = `${rect.top}px`;
      overlay.style.left = `${rect.left}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '99999';
      overlay.style.overflow = 'visible';

      // Generate particles over the target element area
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = document.createElement('div');
        const size = Math.random() * 6 + 2;
        const x = Math.random() * rect.width;
        const y = Math.random() * rect.height;
        const driftX = (Math.random() - 0.4) * 160;
        const driftY = -(Math.random() * 120 + 30);
        const duration = Math.random() * 1.5 + 1.2; // 1.2s to 2.7s
        const delay = Math.random() * 0.6;
        const hue = Math.random() > 0.5 ? 270 : 330; // Purple / Pink cyber particles

        p.style.position = 'absolute';
        p.style.left = `${x}px`;
        p.style.top = `${y}px`;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.borderRadius = '50%';
        p.style.background = `hsl(${hue}, 85%, 65%)`;
        p.style.boxShadow = `0 0 8px hsl(${hue}, 90%, 60%)`;
        p.style.transition = `transform ${duration}s ease-out ${delay}s, opacity ${duration}s ease-out ${delay}s, filter ${duration}s ease-out ${delay}s`;
        p.style.opacity = '1';

        overlay.appendChild(p);

        // Trigger particle animation on next frame
        requestAnimationFrame(() => {
          setTimeout(() => {
            p.style.transform = `translate(${driftX}px, ${driftY}px) scale(0.1)`;
            p.style.opacity = '0';
            p.style.filter = 'blur(4px)';
          }, 20);
        });
      }

      document.body.appendChild(overlay);

      // Apply disintegration CSS to target text/chat element
      targetElement.style.transition = 'transform 2.2s cubic-bezier(0.25, 1, 0.5, 1), opacity 2.2s cubic-bezier(0.25, 1, 0.5, 1), filter 2.2s cubic-bezier(0.25, 1, 0.5, 1)';
      targetElement.style.transform = 'translateY(-20px) scale(0.96) rotate(-1deg)';
      targetElement.style.opacity = '0';
      targetElement.style.filter = 'blur(10px) contrast(1.5)';

      // Clean up after 2.8s & trigger completion callback
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        isRunningRef.current = false;
        if (onComplete) onComplete();
      }, 2800);

    } catch (err) {
      console.error('Thanos snap failed:', err);
      isRunningRef.current = false;
      if (onComplete) onComplete();
    }
  }, []);

  return { triggerSnap, isRunning: isRunningRef.current };
}
