import { useEffect, useRef, useState } from "react";
import type { Application } from "pixi.js";

interface UsePixiAppOptions {
  width: number;
  height: number;
  enabled: boolean;
}

// Не destroy(true): true ещё и чистит глобальные пулы Pixi (TexturePool),
// общие для всех сцен на странице, и соседняя сцена с Text падает при своём destroy
const DESTROY_OPTIONS = { removeView: true } as const;

export const usePixiApp = ({ width, height, enabled }: UsePixiAppOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;

    let cancelled = false;
    let app: Application | null = null;

    const init = async () => {
      const { Application } = await import("pixi.js");
      if (cancelled) return;

      const instance = new Application();
      await instance.init({
        width,
        height,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 1.5),
        autoDensity: true,
        powerPreference: "high-performance",
        hello: false,
      });

      if (cancelled) {
        instance.destroy(DESTROY_OPTIONS);
        return;
      }

      // Canvas создаёт сам Pixi: destroy теряет WebGL-контекст,
      // и повторно использовать тот же <canvas> после этого нельзя
      app = instance;
      container.appendChild(instance.canvas);
      appRef.current = instance;
      setReady(true);
    };

    init().catch((err) => console.warn("Pixi init error:", err));

    return () => {
      cancelled = true;
      appRef.current = null;
      setReady(false);
      app?.destroy(DESTROY_OPTIONS);
    };
  }, [enabled, width, height]);

  return { containerRef, appRef, ready };
};
