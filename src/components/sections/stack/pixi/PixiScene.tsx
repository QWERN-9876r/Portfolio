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

  const { canvasRef, appRef, ready } = usePixiApp({
    width: sceneW,
    height: sceneH,
  });
  const sceneRef = useRef<Scene | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!appRef.current) return;

    if (isVisible) {
      appRef.current.ticker.start();
    } else {
      appRef.current.ticker.stop();
    }
  }, [isVisible, appRef]);

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

  // Пауза тикера когда секция не видна
  useEffect(() => {
    if (!appRef.current) return;
    if (isVisible) {
      appRef.current.ticker.start();
    } else {
      appRef.current.ticker.stop();
    }
  }, [isVisible, appRef]);

  // Пауза при скрытии вкладки
  useEffect(() => {
    const handleVisibility = () => {
      if (!appRef.current) return;
      if (document.hidden) {
        appRef.current.ticker.stop();
      } else if (isVisible) {
        appRef.current.ticker.start();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [isVisible, appRef]);

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
    >
      <canvas ref={canvasRef} />
    </Box>
  );
};
