import { useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';

const LAYER_COUNT = 32;
const ANIMATION_DURATION_MS = 2500;

/**
 * Hook for the Thanos snap disintegration effect.
 * Captures a DOM element via html2canvas, slices into particle layers,
 * and animates them dissolving away.
 */
export function useThanosSnap() {
  const isRunningRef = useRef(false);

  const triggerSnap = useCallback(async (targetElement, onComplete) => {
    if (isRunningRef.current || !targetElement) return;
    isRunningRef.current = true;

    try {
      // Capture the element as a canvas
      const sourceCanvas = await html2canvas(targetElement, {
        backgroundColor: null,
        scale: 1,
        logging: false,
        useCORS: true,
      });

      const { width, height } = sourceCanvas;
      const sourceCtx = sourceCanvas.getContext('2d');
      const imageData = sourceCtx.getImageData(0, 0, width, height);
      const pixelData = imageData.data;

      // Create layer canvases
      const layers = [];
      const layerCanvases = [];

      for (let i = 0; i < LAYER_COUNT; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.transition = `transform ${ANIMATION_DURATION_MS}ms ease-out, opacity ${ANIMATION_DURATION_MS}ms ease-out, filter ${ANIMATION_DURATION_MS}ms ease-out`;
        canvas.style.pointerEvents = 'none';

        const ctx = canvas.getContext('2d');
        const data = ctx.createImageData(width, height);
        layers.push({ canvas, ctx, data });
        layerCanvases.push(canvas);
      }

      // Distribute pixels across layers with gaussian-weighted randomness
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          // Skip transparent pixels
          if (pixelData[idx + 3] === 0) continue;

          // Weight distribution: outer pixels go to earlier layers
          const cx = width / 2;
          const cy = height / 2;
          const distFromCenter = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
          const maxDist = Math.sqrt(cx ** 2 + cy ** 2);
          const normalizedDist = distFromCenter / maxDist;

          // Gaussian-weighted layer selection
          const baseLayer = Math.floor(normalizedDist * (LAYER_COUNT - 1));
          const jitter = Math.floor((Math.random() - 0.5) * 8);
          const layerIdx = Math.max(0, Math.min(LAYER_COUNT - 1, baseLayer + jitter));

          const layer = layers[layerIdx];
          layer.data.data[idx] = pixelData[idx];
          layer.data.data[idx + 1] = pixelData[idx + 1];
          layer.data.data[idx + 2] = pixelData[idx + 2];
          layer.data.data[idx + 3] = pixelData[idx + 3];
        }
      }

      // Put image data onto each layer canvas
      layers.forEach((layer) => {
        layer.ctx.putImageData(layer.data, 0, 0);
      });

      // Position overlay container
      const rect = targetElement.getBoundingClientRect();
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = `${rect.top}px`;
      container.style.left = `${rect.left}px`;
      container.style.width = `${width}px`;
      container.style.height = `${height}px`;
      container.style.zIndex = '9999';
      container.style.pointerEvents = 'none';
      container.style.overflow = 'visible';

      layerCanvases.forEach((canvas) => container.appendChild(canvas));
      document.body.appendChild(container);

      // Hide original element
      targetElement.style.opacity = '0';

      // Stagger-animate each layer
      requestAnimationFrame(() => {
        layers.forEach((layer, i) => {
          const delay = (i / LAYER_COUNT) * 800;
          setTimeout(() => {
            const translateX = (Math.random() - 0.3) * 200;
            const translateY = -(Math.random() * 100 + 30);
            const rotate = (Math.random() - 0.5) * 45;

            layer.canvas.style.transform = `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg)`;
            layer.canvas.style.opacity = '0';
            layer.canvas.style.filter = 'blur(3px)';
          }, delay);
        });
      });

      // Cleanup after animation
      setTimeout(() => {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
        isRunningRef.current = false;
        if (onComplete) onComplete();
      }, ANIMATION_DURATION_MS + 1000);
    } catch (err) {
      console.error('Thanos snap failed:', err);
      isRunningRef.current = false;
      if (onComplete) onComplete();
    }
  }, []);

  return { triggerSnap, isRunning: isRunningRef.current };
}
