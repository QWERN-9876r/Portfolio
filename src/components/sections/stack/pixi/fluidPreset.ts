import { Graphics, Container } from "pixi.js";
import type { Application } from "pixi.js";
import { COLORS } from "../../../../theme/theme";

interface WavePoint {
  x: number;
  baseY: number;
  y: number;
  phase: number;
  amplitude: number;
  speed: number;
}

interface FluidScene {
  destroy: () => void;
  setActiveTech: (name: string | null) => void;
  onMouseMove: (x: number, y: number) => void;
  onMouseLeave: () => void;
}

const HEX_BLUE = 0x2979ff;
const HEX_SOFT = 0x448aff;

// Кол-во волн
const WAVE_COUNT = 4;

export const createFluidPreset = (app: Application): FluidScene => {
  const { width, height } = app.screen;

  if (width <= 0 || height <= 0) {
    return {
      destroy: () => {},
      setActiveTech: () => {},
      onMouseMove: () => {},
      onMouseLeave: () => {},
    };
  }

  const container = new Container();
  app.stage.addChild(container);

  let mouseX = width / 2;
  let mouseY = height / 2;
  let isOver = false;
  let intensity = 1; // усиливается при hover на технологию
  let time = 0;
  let lastTime = Date.now();

  // Волновые точки (горизонтальные срезы)
  const COLS = 60;
  const waves: WavePoint[][] = Array.from({ length: WAVE_COUNT }, (_, wi) =>
    Array.from({ length: COLS }, (_, ci) => ({
      x: (ci / (COLS - 1)) * width,
      baseY: height * (0.25 + wi * 0.18),
      y: height * (0.25 + wi * 0.18),
      phase: (ci / COLS) * Math.PI * 2 + wi * 1.1,
      amplitude: 12 + wi * 8,
      speed: 0.018 + wi * 0.006,
    })),
  );

  const waveGfx = new Graphics();
  container.addChild(waveGfx);

  // Круги вокруг курсора
  const cursorGfx = new Graphics();
  container.addChild(cursorGfx);

  const tick = () => {
    if (!app.stage) return;

    time += (Date.now() - lastTime) / 1000;
    lastTime = Date.now();

    // Плавное затухание интенсивности
    if (!isOver) intensity = Math.max(1, intensity * 0.97);

    waveGfx.clear();
    cursorGfx.clear();

    waves.forEach((wave, wi) => {
      const alpha = 0.12 + wi * 0.04;
      const color = wi % 2 === 0 ? HEX_BLUE : HEX_SOFT;
      const lineW = 1 + wi * 0.4;

      waveGfx.moveTo(wave[0].x, wave[0].y);

      wave.forEach((p, ci) => {
        // Базовая синусоида
        let amp = p.amplitude * intensity;

        // Влияние курсора: искажаем волну ближе к мыши
        if (isOver) {
          const dx = p.x - mouseX;
          const dy = p.baseY - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            amp += (1 - dist / 120) * 40 * intensity;
          }
        }

        p.y =
          p.baseY + Math.sin(time * p.speed * 60 + p.phase + ci * 0.15) * amp;

        if (ci === 0) {
          waveGfx.moveTo(p.x, p.y);
        } else {
          // Кривая Безье через промежуточные точки
          const prev = wave[ci - 1];
          const cpx = (prev.x + p.x) / 2;
          const cpy = (prev.y + p.y) / 2;
          waveGfx.quadraticCurveTo(prev.x, prev.y, cpx, cpy);
        }
      });

      waveGfx.stroke({ color, alpha, width: lineW });
    });

    // Круги вокруг курсора (только если мышь над сценой)
    if (isOver) {
      [60, 100, 140].forEach((r, i) => {
        const a = (0.15 - i * 0.04) * intensity;
        cursorGfx.circle(mouseX, mouseY, r + Math.sin(time * 2 + i) * 8);
        cursorGfx.stroke({
          color: HEX_SOFT,
          alpha: Math.max(0, a),
          width: 0.8,
        });
      });
    }
  };

  app.ticker.add(tick);

  return {
    destroy: () => {
      try {
        app.ticker.remove(tick);
        container.destroy({ children: true });
      } catch (err) {
        console.warn("Fluid destroy error:", err);
      }
    },
    setActiveTech: (name) => {
      intensity = name ? 2.5 : 1;
    },
    onMouseMove: (x, y) => {
      mouseX = x;
      mouseY = y;
      isOver = true;
    },
    onMouseLeave: () => {
      isOver = false;
      intensity = Math.max(1, intensity * 0.5);
    },
  };
};
