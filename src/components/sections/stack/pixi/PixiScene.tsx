import { Box } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { alpha } from "@mui/material/styles";
import { COLORS } from "../../../../theme/theme";
import { usePixiApp } from "./usePixiApp";
import type { createParticlesPreset } from "./particlesPreset";
import type { createFluidPreset } from "./fluidPreset";
import { Preset } from "../../../../data/techGroups";

type Scene =
  | ReturnType<typeof createParticlesPreset>
  | ReturnType<typeof createFluidPreset>;

interface PixiSceneProps {
  preset: Preset;
  activeTech: string | null;
  isVisible: boolean;
}

const SCENE_W = 400;
const SCENE_H = 400;

export const PixiScene = ({
  preset,
  activeTech,
  isVisible,
}: PixiSceneProps) => {
  const isMobile = window.innerWidth < 768;
  const sceneW = isMobile ? Math.min(window.innerWidth - 32, SCENE_W) : SCENE_W;
  const sceneH = isMobile ? 220 : SCENE_H;

  // WebGL-контекст живёт, только пока секция в пределах экрана от видимой области
  const [isNear, setIsNear] = useState(false);
  const { containerRef, appRef, ready } = usePixiApp({
    width: sceneW,
    height: sceneH,
    enabled: isNear,
  });
  const sceneRef = useRef<Scene | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // root — скролл-контейнер: у viewport rootMargin не выходит за его overflow
    const observer = new IntersectionObserver(
      ([entry]) => setIsNear(entry.isIntersecting),
      { root: el.closest("#scroll-root"), rootMargin: "100% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  // Тикер крутится, только когда секция видна и вкладка активна
  useEffect(() => {
    const app = appRef.current;
    if (!ready || !app) return;

    const syncTicker = () => {
      if (isVisible && !document.hidden) {
        app.ticker.start();
      } else {
        app.ticker.stop();
      }
    };

    syncTicker();
    document.addEventListener("visibilitychange", syncTicker);
    return () =>
      document.removeEventListener("visibilitychange", syncTicker);
  }, [ready, isVisible, appRef]);

  useEffect(() => {
    if (!ready || !appRef.current) return;

    let destroyed = false;

    const initScene = async () => {
      if (!appRef.current || destroyed) return;

      try {
        switch (preset) {
          case "particles": {
            const { createParticlesPreset } = await import("./particlesPreset");
            if (!destroyed && appRef.current) {
              sceneRef.current = createParticlesPreset(appRef.current);
              setMounted(true);
            }
            break;
          }
          case "fluid": {
            const { createFluidPreset } = await import("./fluidPreset");
            if (!destroyed && appRef.current) {
              sceneRef.current = createFluidPreset(appRef.current);
              setMounted(true);
            }
            break;
          }
          case "neural": {
            const { createNeuralPreset } = await import("./neuralPreset");
            if (!destroyed && appRef.current) {
              sceneRef.current = createNeuralPreset(appRef.current);
              setMounted(true);
            }
            break;
          }
          case "constellation": {
            const { createConstellationPreset } =
              await import("./constellationPreset");
            if (!destroyed && appRef.current) {
              sceneRef.current = createConstellationPreset(appRef.current);
              setMounted(true);
            }
            break;
          }
          case "matrix": {
            const { createMatrixPreset } = await import("./matrixPreset");
            if (!destroyed && appRef.current) {
              sceneRef.current = createMatrixPreset(appRef.current);
              setMounted(true);
            }
            break;
          }
        }
      } catch (err) {
        console.warn("Pixi scene init error:", err);
        // Не критично — просто не показываем сцену
      }
    };

    initScene();

    return () => {
      destroyed = true;
      // Безопасный вызов destroy
      if (sceneRef.current?.destroy) {
        try {
          sceneRef.current.destroy();
        } catch (err) {
          console.warn("Pixi scene destroy error:", err);
        }
      }
      sceneRef.current = null;
      setMounted(false);
    };
  }, [ready, preset, appRef]);

  // Обновляем активную технологию в сцене
  useEffect(() => {
    if (mounted && sceneRef.current) {
      try {
        sceneRef.current.setActiveTech(activeTech);
      } catch (err) {
        console.warn("Pixi setActiveTech error:", err);
      }
    }
  }, [activeTech, mounted]);

  // Обработчики мыши
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sceneRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    try {
      sceneRef.current.onMouseMove(e.clientX - rect.left, e.clientY - rect.top);
    } catch (err) {
      console.warn("Pixi onMouseMove error:", err);
    }
  };

  const handleMouseLeave = () => {
    if (sceneRef.current) {
      try {
        sceneRef.current.onMouseLeave();
      } catch (err) {
        console.warn("Pixi onMouseLeave error:", err);
      }
    }
  };

  return (
    <Box
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      sx={{
        width: sceneW,
        height: sceneH,
        borderRadius: "20px",
        border: `1px solid ${alpha(COLORS.neonBlue, 0.15)}`,
        background: `
          radial-gradient(ellipse 70% 60% at 50% 50%,
            ${alpha(COLORS.neonBlue, 0.04)} 0%,
            transparent 70%
          ),
          ${alpha(COLORS.bgElevated, 0.25)}
        `,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        overflow: "hidden",
        position: "relative",
        flexShrink: 0,
        "& canvas": {
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.5s ease",
          display: "block",
          width: "100%",
          height: "100%",
        },
      }}
    />
  );
};
