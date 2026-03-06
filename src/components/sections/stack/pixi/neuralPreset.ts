import { Graphics, Container } from "pixi.js";
import type { Application } from "pixi.js";
import { COLORS } from "../../../../theme/theme";

interface Neuron {
  x: number;
  y: number;
  radius: number;
  pulse: number;
  connections: number[];
}

interface NeuralScene {
  destroy: () => void;
  setActiveTech: (name: string | null) => void;
  onMouseMove: (x: number, y: number) => void;
  onMouseLeave: () => void;
}

const HEX_BLUE = 0x2979ff;
const HEX_SOFT = 0x448aff;

export const createNeuralPreset = (app: Application): NeuralScene => {
  const { width, height } = app.screen;
  const container = new Container();
  app.stage.addChild(container);

  let mouseX = width / 2;
  let mouseY = height / 2;
  let isOver = false;
  let activeNeuron: number | null = null;
  let time = 0;

  // Широкая нейросеть с оригинальной плотностью
  const neurons: Neuron[] = [];
  const layers = [4, 6, 5, 3]; // та же плотность
  // Увеличиваем расстояние между слоями для ширины
  const layerSpacing = width / (layers.length + 0.5); // меньше делитель = больше расстояние
  const verticalSpacing = height / 8; // та же вертикальная плотность

  layers.forEach((count, layerIndex) => {
    const layerX = layerSpacing * (layerIndex + 0.75); // смещение для центрирования
    const startY = (height - (count - 1) * verticalSpacing) / 2;

    for (let i = 0; i < count; i++) {
      const y = startY + i * verticalSpacing;
      neurons.push({
        x: layerX,
        y: y,
        radius: 4 + Math.random() * 3,
        pulse: Math.random() * Math.PI * 2,
        connections: [],
      });
    }
  });

  // Создаем связи между слоями (оригинальная плотность)
  for (let layer = 0; layer < layers.length - 1; layer++) {
    const startIdx = layers.slice(0, layer).reduce((a, b) => a + b, 0);
    const endIdx = startIdx + layers[layer];
    const nextStartIdx = endIdx;
    const nextEndIdx = nextStartIdx + layers[layer + 1];

    for (let i = startIdx; i < endIdx; i++) {
      // Та же логика: каждый нейрон соединяется с 2-3 нейронами следующего слоя
      const connectionCount = 2 + Math.floor(Math.random() * 2);
      for (let j = 0; j < connectionCount; j++) {
        const target =
          nextStartIdx + Math.floor(Math.random() * layers[layer + 1]);
        neurons[i].connections.push(target);
      }
    }
  }

  const gfx = new Graphics();
  container.addChild(gfx);

  const tick = () => {
    time += 0.016;
    gfx.clear();

    // Рисуем связи
    neurons.forEach((neuron, i) => {
      neuron.connections.forEach((targetIdx) => {
        const target = neurons[targetIdx];
        if (!target) return;

        const dx = target.x - neuron.x;
        const dy = target.y - neuron.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Пульсация связи
        const pulse = Math.sin(time * 2 + i * 0.5) * 0.5 + 0.5;
        const alpha = 0.1 + pulse * 0.2;

        // Влияние мыши
        let lineAlpha = alpha;
        if (isOver) {
          const mouseDist1 = Math.sqrt(
            (mouseX - neuron.x) ** 2 + (mouseY - neuron.y) ** 2,
          );
          const mouseDist2 = Math.sqrt(
            (mouseX - target.x) ** 2 + (mouseY - target.y) ** 2,
          );
          if (mouseDist1 < 100 || mouseDist2 < 100) {
            lineAlpha = Math.min(0.8, alpha * 3);
          }
        }

        gfx.moveTo(neuron.x, neuron.y);
        gfx.lineTo(target.x, target.y);
        gfx.stroke({
          color: HEX_SOFT,
          alpha: lineAlpha,
          width: 1 + pulse * 1.5,
        });
      });
    });

    // Рисуем нейроны
    neurons.forEach((neuron, i) => {
      neuron.pulse += 0.05;

      // Пульсация нейрона
      const pulseSize = Math.sin(neuron.pulse) * 0.3 + 1;
      const radius = neuron.radius * pulseSize;

      // Влияние мыши
      let neuronAlpha = 0.6;
      let neuronColor = HEX_BLUE;
      if (isOver) {
        const dx = mouseX - neuron.x;
        const dy = mouseY - neuron.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) {
          neuronAlpha = Math.min(1, 0.6 + (1 - dist / 80) * 0.8);
          neuronColor = HEX_SOFT;
        }
      }

      // Активный нейрон
      if (i === activeNeuron) {
        neuronAlpha = 1;
        neuronColor = 0xffffff;
      }

      gfx.circle(neuron.x, neuron.y, radius);
      gfx.fill({
        color: neuronColor,
        alpha: neuronAlpha,
      });

      // Glow эффект
      if (neuronAlpha > 0.8) {
        gfx.circle(neuron.x, neuron.y, radius * 2);
        gfx.fill({
          color: neuronColor,
          alpha: neuronAlpha * 0.3,
        });
      }
    });
  };

  app.ticker.add(tick);

  return {
    destroy: () => {
      app?.ticker.remove(tick);
      container.destroy({ children: true });
    },
    setActiveTech: (name) => {
      if (name) {
        // Активируем случайный нейрон
        activeNeuron = Math.floor(Math.random() * neurons.length);
        setTimeout(() => {
          activeNeuron = null;
        }, 1000);
      } else {
        activeNeuron = null;
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
