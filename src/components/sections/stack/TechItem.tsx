import { Box, Typography } from "@mui/material";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { alpha } from "@mui/material/styles";
import { useRef, useState } from "react";
import { COLORS } from "../../../theme/theme";
import type { TechGroupItem } from "../../../data/techGroups";

interface TechItemProps {
  item: TechGroupItem;
  index: number;
  onHover: (name: string | null) => void;
}

export const TechItem = ({ item, index, onHover }: TechItemProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  // Магнитный эффект: иконка тянется к курсору
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spring = { stiffness: 200, damping: 18, mass: 0.6 };
  const x = useSpring(mouseX, spring);
  const y = useSpring(mouseY, spring);

  // 3D-наклон иконки
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [12, -12]),
    spring,
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-12, 12]),
    spring,
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(nx * 18); // амплитуда смещения px
    mouseY.set(ny * 18);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setHovered(false);
    onHover(null);
  };

  const handleMouseEnter = () => {
    setHovered(true);
    onHover(item.name);
  };

  // Варианты появления (каскад через stagger родителя)
  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.55,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <motion.div
      variants={itemVariants}
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 600 }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 2.5,
          p: { xs: 2, md: 2.5 },
          borderRadius: "14px",
          border: `1px solid ${
            hovered ? alpha(COLORS.neonBlue, 0.45) : alpha(COLORS.neonBlue, 0.1)
          }`,
          background: hovered ? alpha(COLORS.neonBlue, 0.06) : "transparent",
          transition: "all 0.25s ease",
          boxShadow: hovered
            ? `0 0 24px ${alpha(COLORS.neonBlue, 0.1)}`
            : "none",
          cursor: "default",
        }}
      >
        {/* Иконка с магнитным + 3D эффектом */}
        <motion.div
          style={{
            x,
            y,
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "14px",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: alpha(COLORS.bgElevated, 0.8),
              border: `1px solid ${alpha(COLORS.neonBlue, 0.2)}`,
              boxShadow: hovered
                ? `0 0 20px ${alpha(COLORS.neonBlue, 0.25)},
                   0 0 40px ${alpha(COLORS.neonBlue, 0.1)}`
                : "none",
              transition: "box-shadow 0.25s ease",
            }}
          >
            <Box
              component="img"
              src={item.icon}
              alt={item.name}
              sx={{
                width: 36,
                height: 36,
                objectFit: "contain",
                // Fallback: если иконка не загрузилась
                filter: hovered
                  ? `drop-shadow(0 0 6px ${alpha(COLORS.neonBlue, 0.6)})`
                  : "none",
                transition: "filter 0.25s ease",
              }}
              onError={(e) => {
                // Показываем первую букву названия если иконка не найдена
                const target = e.currentTarget;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent && !parent.querySelector(".icon-fallback")) {
                  const fb = document.createElement("span");
                  fb.className = "icon-fallback";
                  fb.style.cssText = `
                    font-family: 'Rubik Mono One', monospace;
                    font-size: 1.4rem;
                    color: ${COLORS.neonBlueSoft};
                  `;
                  fb.textContent = item.name[0];
                  parent.appendChild(fb);
                }
              }}
            />
          </Box>
        </motion.div>

        {/* Название + описание */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            pt: 0.5,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              color: hovered
                ? COLORS.textPrimary
                : alpha(COLORS.textPrimary, 0.85),
              fontWeight: 700,
              transition: "color 0.2s ease",
            }}
          >
            {item.name}
          </Typography>

          {item.note && (
            <Typography
              variant="body2"
              sx={{
                color: COLORS.textSecondary,
                fontSize: "0.8rem",
                lineHeight: 1.5,
              }}
            >
              {item.note}
            </Typography>
          )}
        </Box>
      </Box>
    </motion.div>
  );
};
