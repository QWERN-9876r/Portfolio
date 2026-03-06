import { Graphics, Container, Text, TextStyle } from "pixi.js";
import type { Application } from "pixi.js";
import { COLORS } from "../../../../theme/theme";

interface Particle {
  gfx: Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  speed: number;
}

interface ParticlesScene {
  destroy: () => void;
  setActiveTech: (name: string | null) => void;
  onMouseMove: (x: number, y: number) => void;
  onMouseLeave: () => void;
}

const HEX_BLUE = 0x2979ff;
const HEX_SOFT = 0x448aff;

// Кол-во частиц в зависимости от устройства
const getParticleCount = () => (window.innerWidth < 768 ? 40 : 80);

export const createParticlesPreset = (app: Application): ParticlesScene => {
  const { width, height } = app.screen;

  if (width <= 0 || height <= 0) {
    return {
      destroy: () => {},
      setActiveTech: () => {},
      onMouseMove: () => {},
      onMouseLeave: () => {},
    };
  }

  const count = getParticleCount();
  const container = new Container();
  app.stage.addChild(container);

  // Метка активной технологии
  let labelText: Text | null = null;

  // Позиция курсора (нормализованная)
  let mouseX = width / 2;
  let mouseY = height / 2;
  let isMouseOver = false;

  // Генерируем частицы
  const particles: Particle[] = Array.from({ length: count }, (_, i) => {
    const gfx = new Graphics();
    const radius = 1.5 + ((i * 7) % 5); // 1.5–6.5
    const x = (i / count) * width + Math.sin(i * 1.3) * 40;
    const y = (i / count) * height + Math.cos(i * 1.7) * 40;
    const speed = 0.3 + (i % 5) * 0.15;

    gfx.circle(0, 0, radius);
    gfx.fill({ color: HEX_BLUE, alpha: 0.3 + (i % 4) * 0.1 });
    gfx.position.set(
      Math.max(radius, Math.min(width - radius, x)),
      Math.max(radius, Math.min(height - radius, y)),
    );

    container.addChild(gfx);

    return {
      gfx,
      x: gfx.x,
      y: gfx.y,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      radius,
      alpha: 0.3 + (i % 4) * 0.1,
      speed,
    };
  });

  const linesGfx = new Graphics();
  container.addChildAt(linesGfx, 0);

  const tick = () => {
    if (!app.stage) return;

    linesGfx.clear();

    particles.forEach((p, i) => {
      // Движение
      p.x += p.vx;
      p.y += p.vy;

      // Отскок от стен
      if (p.x < p.radius || p.x > width - p.radius) p.vx *= -1;
      if (p.y < p.radius || p.y > height - p.radius) p.vy *= -1;

      // Притяжение к курсору (если мышь над сценой)
      if (isMouseOver) {
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 160 && dist > 0) {
          const force = ((160 - dist) / 160) * 0.015;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
        // Ограничиваем скорость
        const maxSpeed = p.speed * 3;
        const curSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (curSpeed > maxSpeed) {
          p.vx = (p.vx / curSpeed) * maxSpeed;
          p.vy = (p.vy / curSpeed) * maxSpeed;
        }
      } else {
        // Возврат к базовой скорости
        p.vx *= 0.995;
        p.vy *= 0.995;
        const minSpeed = p.speed * 0.5;
        const curSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (curSpeed < minSpeed) {
          p.vx += (Math.random() - 0.5) * 0.05;
          p.vy += (Math.random() - 0.5) * 0.05;
        }
      }

      p.gfx.x = p.x;
      p.gfx.y = p.y;

      // Линии между близкими частицами
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = q.x - p.x;
        const dy = q.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 80) {
          const lineAlpha = (1 - dist / 80) * 0.25;
          linesGfx.moveTo(p.x, p.y);
          linesGfx.lineTo(q.x, q.y);
          linesGfx.stroke({ color: HEX_SOFT, alpha: lineAlpha, width: 0.6 });
        }
      }
    });
  };

  app.ticker.add(tick);

  // Burst: импульс при клике на технологию
  const burst = (cx: number, cy: number) => {
    particles.forEach((p) => {
      const dx = p.x - cx;
      const dy = p.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = Math.min(200 / dist, 6);
      p.vx += (dx / dist) * force;
      p.vy += (dy / dist) * force;
    });
  };

  // Показать метку активной технологии
  const setActiveTech = (name: string | null) => {
    if (labelText) {
      container.removeChild(labelText);
      labelText.destroy();
      labelText = null;
    }

    if (name) {
      const style = new TextStyle({
        fontFamily: "'Rubik Mono One', monospace",
        fontSize: 18,
        fill: HEX_SOFT,
        align: "center",
      });
      labelText = new Text({ text: name, style });
      labelText.anchor.set(0.5);
      labelText.x = width / 2;
      labelText.y = height / 2;
      labelText.alpha = 0.35;
      container.addChild(labelText);

      // Burst из центра при появлении метки
      burst(width / 2, height / 2);
    }
  };

  return {
    destroy: () => {
      try {
        app?.ticker.remove(tick);
        container.destroy({ children: true });
      } catch {}
    },
    setActiveTech,
    onMouseMove: (x, y) => {
      mouseX = x;
      mouseY = y;
      isMouseOver = true;
    },
    onMouseLeave: () => {
      isMouseOver = false;
    },
  };
};
