import { Box, Typography } from "@mui/material";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect, FC } from "react";
import { alpha } from "@mui/material/styles";
import { COLORS } from "../../../theme/theme";
import { TechItem } from "./TechItem";
import { PixiScene } from "./pixi/PixiScene";
import type { TechGroup } from "../../../data/techGroups";
import { useQueryRole } from "../../../hooks/useQueryRole";

interface StackGroupSectionProps {
  group: TechGroup;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const titleVariants = {
  hidden: { opacity: 0, x: -30, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const rightVariants = {
  hidden: { opacity: 0, x: 40, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.75, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const TechGroups: FC<{ groups: TechGroup[] }> = ({ groups }) => {
  const { role } = useQueryRole();

  return groups.map(
    (group) =>
      (!group.roles || group.roles.includes(role)) && (
        <StackGroupSection key={group.id} group={group} />
      ),
  );
};

export const StackGroupSection = ({ group }: StackGroupSectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  // Для паузы Pixi — отдельный observer (не once)
  const [isVisible, setIsVisible] = useState(false);
  const [activeTech, setActiveTech] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      id={group.id}
      component="section"
      className="snap-section"
      ref={ref}
      sx={{
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 2, sm: 4, md: 6, lg: 8 },
        py: { xs: 6, md: 0 },
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          gap: { xs: 4, md: 6 },
          width: "100%",
          maxWidth: 1100,
        }}
      >
        {/* ── Левая часть ── */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: { xs: 3, md: 4 },
            minWidth: 0,
          }}
        >
          <motion.div
            variants={titleVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography
                  variant="caption"
                  sx={{ color: COLORS.neonBlueSoft, letterSpacing: "0.25em" }}
                >
                  {String(group.index).padStart(2, "0")}
                </Typography>
                <Box className="neon-line" sx={{ width: 40 }} />
              </Box>

              <Typography
                variant="h2"
                sx={{ color: COLORS.textPrimary, lineHeight: 1.1 }}
              >
                {group.title}
              </Typography>

              {group.subtitle && (
                <Typography
                  variant="body2"
                  sx={{
                    color: alpha(COLORS.neonBlueSoft, 0.6),
                    fontStyle: "italic",
                    letterSpacing: "0.03em",
                    mt: 0.5,
                  }}
                >
                  {group.subtitle}
                </Typography>
              )}
            </Box>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {group.items.map((item, idx) => (
                <TechItem
                  key={item.name}
                  item={item}
                  index={idx}
                  onHover={setActiveTech}
                />
              ))}
            </Box>
          </motion.div>
        </Box>

        {/* ── Правая часть: Pixi ── */}
        <motion.div
          variants={rightVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          style={{ flexShrink: 0 }}
        >
          <PixiScene
            preset={group.pixiPreset}
            activeTech={activeTech}
            isVisible={isVisible}
          />
        </motion.div>
      </Box>
    </Box>
  );
};
