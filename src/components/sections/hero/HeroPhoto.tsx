import { Box } from "@mui/material";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { alpha } from "@mui/material/styles";
import { useRef } from "react";
import { COLORS } from "../../../theme/theme";

// Размер фото + отступ под кольца чтобы ничего не обрезалось
// Кольца выходят за границы фото на ~15%
// Поэтому внешний контейнер = размер фото * 1.32
const PHOTO_SIZE = { xs: 200, sm: 250, md: 300 } as const;
const OUTER_SCALE = 1.32;

// Должно совпадать с imagesizes у preload в index.html, иначе фото скачается дважды
const PHOTO_SIZES = `(min-width: 900px) ${PHOTO_SIZE.md}px, (min-width: 600px) ${PHOTO_SIZE.sm}px, ${PHOTO_SIZE.xs}px`;
const photoSrcSet = (ext: string) =>
  [300, 400, 600].map((w) => `/img/photo-${w}.${ext} ${w}w`).join(", ");

export const HeroPhoto = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 80, damping: 20, mass: 0.8 };
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [6, -6]),
    springConfig,
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-6, 6]),
    springConfig,
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    /*
      Внешний контейнер — достаточно большой чтобы кольца не обрезались.
      overflow: visible — ничего не срезаем.
    */
    <Box
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      sx={{
        // Размер = фото * OUTER_SCALE, чтобы вместить кольца
        width: {
          xs: PHOTO_SIZE.xs * OUTER_SCALE,
          sm: PHOTO_SIZE.sm * OUTER_SCALE,
          md: PHOTO_SIZE.md * OUTER_SCALE,
        },
        height: {
          xs: PHOTO_SIZE.xs * OUTER_SCALE,
          sm: PHOTO_SIZE.sm * OUTER_SCALE,
          md: PHOTO_SIZE.md * OUTER_SCALE,
        },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: "800px",
        // Не обрезаем кольца
        overflow: "visible",
        flexShrink: 0,
      }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // Не обрезаем
          overflow: "visible",
        }}
      >
        {/* Кольцо 1 — медленное вращение */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            // 108% от внешнего контейнера
            width: "75%",
            height: "75%",
            borderRadius: "50%",
            border: `1px dashed ${alpha(COLORS.neonBlue, 0.35)}`,
            pointerEvents: "none",
          }}
        />

        {/* Кольцо 2 — обратное вращение */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            width: "82%",
            height: "82%",
            borderRadius: "50%",
            border: `1px solid ${alpha(COLORS.neonBlue, 0.15)}`,
            pointerEvents: "none",
          }}
        />

        {/* Кольцо 3 — внешнее, очень медленное */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            width: "92%",
            height: "92%",
            borderRadius: "50%",
            border: `1px solid ${alpha(COLORS.neonBlue, 0.07)}`,
            pointerEvents: "none",
          }}
        />

        {/* Glow */}
        <Box
          sx={{
            position: "absolute",
            // Размер glow = размер фото
            width: `${(1 / OUTER_SCALE) * 90}%`,
            height: `${(1 / OUTER_SCALE) * 90}%`,
            borderRadius: "50%",
            background: `radial-gradient(circle,
              ${alpha(COLORS.neonBlue, 0.18)} 0%,
              transparent 70%
            )`,
            filter: "blur(20px)",
            pointerEvents: "none",
          }}
        />

        {/* Фото — занимает (1 / OUTER_SCALE) * 100% от контейнера */}
        <Box
          sx={{
            width: `${(1 / OUTER_SCALE) * 100}%`,
            height: `${(1 / OUTER_SCALE) * 100}%`,
            borderRadius: "50%",
            overflow: "hidden",
            border: `2px solid ${alpha(COLORS.neonBlue, 0.5)}`,
            boxShadow: `
              0 0 0 4px ${alpha(COLORS.bgDeep, 0.8)},
              0 0 40px ${alpha(COLORS.neonBlue, 0.25)},
              inset 0 0 40px ${alpha(COLORS.bgDeep, 0.3)}
            `,
            position: "relative",
            flexShrink: 0,
            // Фото не обрезается внутри круга
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <picture style={{ display: "contents" }}>
            <source type="image/avif" srcSet={photoSrcSet("avif")} sizes={PHOTO_SIZES} />
            <source type="image/webp" srcSet={photoSrcSet("webp")} sizes={PHOTO_SIZES} />
            <Box
              component="img"
              src="/img/photo-600.jpg"
              alt="Сотников Дмитрий"
              width={600}
              height={600}
              decoding="async"
              fetchPriority="high"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                background: `linear-gradient(135deg,
                  ${COLORS.bgElevated},
                  ${alpha(COLORS.neonBlue, 0.2)}
                )`,
              }}
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent && !parent.querySelector(".photo-fallback")) {
                  const fallback = document.createElement("div");
                  fallback.className = "photo-fallback";
                  fallback.style.cssText = `
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Rubik Mono One', monospace;
                    font-size: 2.5rem;
                    color: ${COLORS.neonBlueSoft};
                    background: linear-gradient(135deg,
                      ${COLORS.bgElevated},
                      ${alpha(COLORS.neonBlue, 0.15)}
                    );
                  `;
                  fallback.textContent = "СД";
                  parent.appendChild(fallback);
                }
              }}
            />
          </picture>
        </Box>
      </motion.div>
    </Box>
  );
};
