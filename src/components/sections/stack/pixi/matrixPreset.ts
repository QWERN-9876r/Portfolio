import { Graphics, Container, Text, TextStyle } from "pixi.js";
import type { Application } from "pixi.js";
import { COLORS } from "../../../../theme/theme";

interface MatrixDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  chars: string[];
  headChar: string;
}

interface MatrixScene {
  destroy: () => void;
  setActiveTech: (name: string | null) => void;
  onMouseMove: (x: number, y: number) => void;
  onMouseLeave: () => void;
}

const HEX_GREEN = 0x00ff41;
const HEX_BLUE = 0x2979ff;

export const createMatrixPreset = (app: Application): MatrixScene => {
  const { width, height } = app.screen;
  const container = new Container();
  app.stage.addChild(container);

  let mouseX = width / 2;
  let mouseY = height / 2;
  let isOver = false;
  let time = 0;
  let active = false;

  // Расширенный набор символов
  const chars =
    "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ" +
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
    "0123456789" +
    "!@#$%^&*()_+-=[]{}|;:,.<>?/~`" +
    "□■◆◇○●▲▼◊※¶§‰†‡•‰‹›≈≠≤≥∞√∫∏∑" +
    "♠♣♥♦♪♫♬♭♮♯✓✗★☆✦✧✦✧❝❞❛❜❝❞" +
    "αβγδεζηθικλμνξοπρστυφχψω" +
    "☀☁☂☃★☆☇☈☉☊☋☌☍☎☏☐☑☒☓☔☕☖☗☘☙☚☛" +
    "░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀" +
    "♂♀♠♣♥♦♪♫✓✗★†‡¶§†‡‰‹›℅№™Ω℮∂∏∑√∞∠∧∨∩∪∫∴∼≅≈≠≡≤≥⊂⊃⊆⊇⊕⊗⊥⋅⌈⌉⌊⌋⟨⟩⟦⟧⟪⟫" +
    "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳" +
    "㉠㉡㉢㉣㉤㉥㉦㉧㉨㉩㉪㉫㉬㉭㉮㉯㉰㉱㉲㉳㉴㉵㉶㉷㉸㉹㉺" +
    "㊀㊁㊂㊃㊄㊅㊆㊇㊈㊉" +
    "㏠㏡㏢㏣㏤㏥㏦㏧㏨㏩㏪㏫㏬㏭㏮㏯㏰㏱㏲㏳㏴㏵㏶㏷㏸㏹㏺㏻㏼㏽㏾";

  // Создаем "капли" - еще больше (в 1.5 раза от предыдущего)
  const drops: MatrixDrop[] = [];
  const dropCount = Math.floor(width / 5); // Было 8, стало 5 = еще больше

  for (let i = 0; i < dropCount; i++) {
    drops.push({
      x: i * 5, // Еще меньше расстояние между колонками
      y: -Math.random() * height * 3, // Начинаем еще выше
      speed: 0.8 + Math.random() * 3.5, // Разная скорость
      length: 10 + Math.floor(Math.random() * 18), // Еще длиннее хвосты
      chars: Array(25)
        .fill(0)
        .map(() => chars[Math.floor(Math.random() * chars.length)]),
      headChar: chars[Math.floor(Math.random() * chars.length)],
    });
  }

  // Создаем текстовые элементы для символов
  const textElements: Text[] = [];
  drops.forEach((drop) => {
    for (let j = 0; j < drop.length; j++) {
      const style = new TextStyle({
        fontFamily: "monospace",
        fontSize: 10, // Еще меньше размер шрифта для плотности
        fill: j === 0 ? HEX_GREEN : HEX_BLUE,
        align: "center",
      });
      const text = new Text({
        text: drop.chars[j % drop.chars.length],
        style,
      });
      text.anchor.set(0.5);
      text.alpha = j === 0 ? 1 : (1 - j / drop.length) * 0.95;
      container.addChild(text);
      textElements.push(text);
    }
  });

  const tick = () => {
    time += 0.016;

    drops.forEach((drop, dropIndex) => {
      // Движение капли
      drop.y += drop.speed;

      // Если капля ушла далеко за экран - возвращаем наверх
      if (drop.y > height + drop.length * 12 + 150) {
        drop.y = -Math.random() * 300 - 150; // Начинаем еще выше
        drop.speed = 0.8 + Math.random() * 3.5;
        // Обновляем все символы при перезапуске
        drop.chars = Array(25)
          .fill(0)
          .map(() => chars[Math.floor(Math.random() * chars.length)]);
        drop.headChar = chars[Math.floor(Math.random() * chars.length)];
      }

      // Обновляем головной символ чаще
      if (Math.random() < 0.25) {
        drop.headChar = chars[Math.floor(Math.random() * chars.length)];
      }

      // Обновляем текстовые элементы
      for (let j = 0; j < drop.length; j++) {
        const charY = drop.y - j * 12; // Еще меньше расстояние между символами
        const textIndex = dropIndex * drop.length + j;
        const textElement = textElements[textIndex];

        if (textElement) {
          textElement.x = drop.x;
          textElement.y = charY;

          // Обновляем символ
          if (j === 0) {
            textElement.text = drop.headChar;
          } else {
            // Обновляем остальные символы чаще
            if (Math.random() < 0.1) {
              textElement.text =
                chars[Math.floor(Math.random() * chars.length)];
            }
          }

          // Цвет и прозрачность
          const isHead = j === 0;
          const alpha = isHead
            ? 1
            : Math.max(0.2, (1 - j / drop.length) * 0.98);
          textElement.style.fill = isHead ? HEX_GREEN : HEX_BLUE;
          textElement.alpha = alpha;

          // Влияние мыши
          if (isOver) {
            const dx = Math.abs(mouseX - drop.x);
            const dy = Math.abs(mouseY - charY);
            if (dx < 60 && dy < 30) {
              textElement.alpha = Math.min(1, alpha + 0.8);
              textElement.style.fill = 0xffffff;
            }
          }

          // Активация
          if (active && isHead) {
            textElement.style.fill = 0xffffff;
            textElement.alpha = 1;
          }

          // Скрываем символы за экраном
          textElement.visible = charY > -80 && charY < height + 80;
        }
      }
    });
  };

  app.ticker.add(tick);

  return {
    destroy: () => {
      app.ticker.remove(tick);
      container.destroy({ children: true });
    },
    setActiveTech: (name) => {
      active = !!name;
      if (name) {
        setTimeout(() => {
          active = false;
        }, 1300);
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
