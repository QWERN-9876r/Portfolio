import { Graphics, Container } from "pixi.js";
import type { Application } from "pixi.js";

interface Star {
  x: number;
  y: number;
  radius: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
  connections: number[];
}

interface ConstellationScene {
  destroy: () => void;
  setActiveTech: (name: string | null) => void;
  onMouseMove: (x: number, y: number) => void;
  onMouseLeave: () => void;
}

const HEX_BLUE = 0x2979ff;
const HEX_SOFT = 0x448aff;

export const createConstellationPreset = (
  app: Application,
): ConstellationScene => {
  const { width, height } = app.screen;
  const container = new Container();
  app.stage.addChild(container);

  let mouseX = width / 2;
  let mouseY = height / 2;
  let isOver = false;
  let time = 0;

  // Создаем звезды
  const stars: Star[] = [];
  const starCount = window.innerWidth < 768 ? 60 : 100;

  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.5 + Math.random() * 2,
      brightness: 0.3 + Math.random() * 0.7,
      twinkleSpeed: 0.02 + Math.random() * 0.03,
      twinklePhase: Math.random() * Math.PI * 2,
      connections: [],
    });
  }

  // Создаем связи (созвездия)
  stars.forEach((star, i) => {
    // Каждая звезда соединяется с 1-3 ближайшими
    const distances: Array<{ index: number; dist: number }> = [];

    stars.forEach((other, j) => {
      if (i === j) return;
      const dx = other.x - star.x;
      const dy = other.y - star.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        distances.push({ index: j, dist });
      }
    });

    // Сортируем по расстоянию и берем ближайшие 2-3
    distances.sort((a, b) => a.dist - b.dist);
    const connectionCount = Math.min(
      2 + Math.floor(Math.random() * 2),
      distances.length,
    );

    for (let k = 0; k < connectionCount; k++) {
      star.connections.push(distances[k].index);
    }
  });

  const gfx = new Graphics();
  container.addChild(gfx);

  const tick = () => {
    time += 0.016;
    gfx.clear();

    // Рисуем связи
    stars.forEach((star, i) => {
      star.connections.forEach((targetIdx) => {
        const target = stars[targetIdx];
        if (!target) return;

        const dx = target.x - star.x;
        const dy = target.y - star.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Анимация мерцания связи
        const connectionPhase = Math.sin(time * 0.5 + i * 0.3) * 0.5 + 0.5;
        const alpha = 0.05 + connectionPhase * 0.15;

        // Влияние мыши
        let lineAlpha = alpha;
        if (isOver) {
          const mouseDist1 = Math.sqrt(
            (mouseX - star.x) ** 2 + (mouseY - star.y) ** 2,
          );
          const mouseDist2 = Math.sqrt(
            (mouseX - target.x) ** 2 + (mouseY - target.y) ** 2,
          );
          if (mouseDist1 < 60 || mouseDist2 < 60) {
            lineAlpha = Math.min(0.4, alpha * 4);
          }
        }

        gfx.moveTo(star.x, star.y);
        gfx.lineTo(target.x, target.y);
        gfx.stroke({
          color: HEX_SOFT,
          alpha: lineAlpha,
          width: 0.5,
        });
      });
    });

    // Рисуем звезды
    stars.forEach((star, i) => {
      // Анимация мерцания
      star.twinklePhase += star.twinkleSpeed;
      const twinkle = Math.sin(star.twinklePhase) * 0.3 + 0.7;
      const currentBrightness = star.brightness * twinkle;

      // Влияние мыши
      let starAlpha = currentBrightness;
      let starRadius = star.radius;
      if (isOver) {
        const dx = mouseX - star.x;
        const dy = mouseY - star.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          const influence = (1 - dist / 100) * 0.8;
          starAlpha = Math.min(1, currentBrightness + influence);
          starRadius = star.radius * (1 + influence * 2);
        }
      }

      gfx.circle(star.x, star.y, starRadius);
      gfx.fill({
        color: HEX_BLUE,
        alpha: starAlpha,
      });

      // Glow эффект для ярких звезд
      if (starAlpha > 0.7) {
        gfx.circle(star.x, star.y, starRadius * 3);
        gfx.fill({
          color: HEX_BLUE,
          alpha: starAlpha * 0.2,
        });
      }
    });
  };

  app.ticker.add(tick);

  return {
    destroy: () => {
      app?.ticker?.remove(tick);
      container.destroy({ children: true });
    },
    setActiveTech: (name) => {
      if (name) {
        // Усиливаем мерцание всех звезд
        stars.forEach((star) => {
          star.twinkleSpeed *= 3;
          setTimeout(() => {
            star.twinkleSpeed /= 3;
          }, 800);
        });
      }
    },
    onMouseMove: (x, y) => {
      mouseX = x;
      mouseY = y;
      isOver = true;
    },
    onMouseLeave: () => {
      isOver = false;
    },
  };
};
