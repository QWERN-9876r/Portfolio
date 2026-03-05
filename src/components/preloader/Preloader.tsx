import { useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { COLORS } from "../../theme/theme";
import { alpha } from "@mui/material/styles";

// Одна частица
interface Particle {
  id: number;
  x: number; // % от ширины
  y: number; // % от высоты
  size: number; // px
  delay: number; // s
  duration: number; // s
  opacity: number;
}

const generateParticles = (count: number): Particle[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 0.8,
    duration: Math.random() * 2 + 1.5,
    opacity: Math.random() * 0.6 + 0.2,
  }));

const PARTICLES = generateParticles(40);

// Длительность показа (ms)
const DISPLAY_DURATION = 1800;

interface PreloaderProps {
  onFinish: () => void;
}

export const Preloader = ({ onFinish }: PreloaderProps) => {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, DISPLAY_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <AnimatePresence onExitComplete={onFinish}>
      {visible && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.04,
            filter: "blur(12px)",
          }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: COLORS.bgDeep,
            overflow: "hidden",
          }}
        >
          {/* Градиентный фон прелоадера */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: `
                radial-gradient(ellipse 60% 50% at 50% 50%,
                  ${alpha(COLORS.neonBlue, 0.12)} 0%,
                  transparent 70%
                )
              `,
            }}
          />

          {/* CSS-частицы */}
          {PARTICLES.map((p) => (
            <Box
              key={p.id}
              component={motion.div}
              sx={{
                position: "absolute",
                width: p.size,
                height: p.size,
                borderRadius: "50%",
                background: COLORS.neonBlue,
                left: `${p.x}%`,
                top: `${p.y}%`,
                boxShadow: `0 0 ${p.size * 3}px ${alpha(COLORS.neonBlue, 0.8)}`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, p.opacity, p.opacity * 0.5, p.opacity],
                scale: [0, 1, 0.8, 1],
                y: [0, -12, 4, -8],
              }}
              transition={{
                delay: p.delay,
                duration: p.duration,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Центральный блок: ник */}
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            {/* Свечение за ником */}
            <Box
              sx={{
                position: "absolute",
                width: 300,
                height: 80,
                borderRadius: "50%",
                background: alpha(COLORS.neonBlue, 0.15),
                filter: "blur(32px)",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />

            {/* Ник */}
            <motion.div
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            >
              <Typography
                variant="h2"
                sx={{
                  fontFamily: "'Rubik Mono One', monospace",
                  color: COLORS.textPrimary,
                  letterSpacing: "0.04em",
                  textAlign: "center",
                  "& span": {
                    color: COLORS.neonBlueSoft,
                    textShadow: `0 0 20px ${alpha(COLORS.neonBlue, 0.8)}`,
                  },
                }}
              >
                <span>Qwern</span>_9876r
              </Typography>
            </motion.div>

            {/* Анимированная линия-прогресс */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.4, ease: "easeInOut" }}
              style={{ originX: 0, width: "100%" }}
            >
              <Box
                sx={{
                  height: "1px",
                  background: `linear-gradient(90deg,
                    transparent,
                    ${COLORS.neonBlue},
                    ${COLORS.neonBlueSoft},
                    transparent
                  )`,
                  boxShadow: `0 0 8px ${alpha(COLORS.neonBlue, 0.6)}`,
                }}
              />
            </motion.div>

            {/* Подпись */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: COLORS.textSecondary,
                  letterSpacing: "0.25em",
                }}
              >
                ПОРТФОЛИО
              </Typography>
            </motion.div>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
