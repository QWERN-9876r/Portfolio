import { useEffect, useRef, useState } from "react";
import type { Application } from "pixi.js";

interface UsePixiAppOptions {
  width: number;
  height: number;
}

export const usePixiApp = ({ width, height }: UsePixiAppOptions) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const [ready, setReady] = useState(false);
  const destroyedRef = useRef(false); // ← флаг размонтирования

  useEffect(() => {
    if (!canvasRef.current) return;

    destroyedRef.current = false; // ← сброс при монтировании

    const init = async () => {
      const { Application } = await import("pixi.js");

      // Проверка после await
      if (destroyedRef.current || !canvasRef.current) return;

      const app = new Application();
      await app.init({
        canvas: canvasRef.current,
        width,
        height,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 1.5),
        autoDensity: true,
        powerPreference: "high-performance",
        hello: false,
      });

      // Повторная проверка после await
      if (destroyedRef.current) {
        app.destroy(false);
        return;
      }

      appRef.current = app;
      setReady(true);
    };

    init();

    return () => {
      destroyedRef.current = true; // ← установка флага
      if (appRef.current) {
        appRef.current.destroy(false);
        appRef.current = null;
        setReady(false);
      }
    };
  }, [width, height]);

  return { canvasRef, appRef, ready };
};
