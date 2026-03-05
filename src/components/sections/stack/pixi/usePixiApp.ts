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

  useEffect(() => {
    if (!canvasRef.current) return;

    let destroyed = false;

    const init = async () => {
      try {
        // Динамический импорт — Pixi в отдельном чанке
        const { Application } = await import("pixi.js");

        if (destroyed || !canvasRef.current) return;

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

        if (destroyed) {
          app.destroy(false);
          return;
        }

        appRef.current = app;
        setReady(true);
      } catch (err) {
        console.warn("Pixi init error:", err);
        // Не критично — просто не показываем сцену
      }
    };

    init();

    return () => {
      destroyed = true;
      if (appRef.current) {
        try {
          appRef.current.destroy(false);
        } catch (err) {
          console.warn("Pixi destroy error:", err);
        }
        appRef.current = null;
        setReady(false);
      }
    };
    // Перезапускаем только если размер изменился
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  return { canvasRef, appRef, ready };
};
