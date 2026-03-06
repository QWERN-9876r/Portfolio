import { Box, Typography, Chip } from "@mui/material";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { alpha } from "@mui/material/styles";
import { COLORS } from "../../../theme/theme";
import { useExperience } from "../../../data/experienceData";
import type { ExperienceItem } from "../../../data/experienceData";

const SECTION_INDEX = 11;

const titleVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2, delayChildren: 0.25 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -24, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// Анимация линии таймлайна
const lineVariants = {
  hidden: { scaleY: 0, originY: 0 },
  visible: {
    scaleY: 1,
    transition: { duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const ExperienceSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const experience = useExperience();

  return (
    <Box
      id="experience"
      component="section"
      className="snap-section"
      ref={ref}
      sx={{
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 2, sm: 4, md: 6, lg: 8 },
        py: { xs: 6, md: 0 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: { xs: 4, md: 5 },
          width: "100%",
          maxWidth: 1100,
        }}
      >
        {/* ── Заголовок ── */}
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
                {String(SECTION_INDEX).padStart(2, "0")}
              </Typography>
              <Box className="neon-line" sx={{ width: 40 }} />
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "baseline",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Typography variant="h2" sx={{ color: COLORS.textPrimary }}>
                Опыт
              </Typography>

              {/* Компания как акцент */}
              <Typography
                variant="h2"
                sx={{
                  color: COLORS.neonBlueSoft,
                  textShadow: `0 0 30px ${alpha(COLORS.neonBlue, 0.4)}`,
                }}
              >
                {experience.company}
              </Typography>

              {/* Локация */}
              <Typography
                variant="body2"
                sx={{
                  color: COLORS.textSecondary,
                  fontStyle: "italic",
                  alignSelf: "center",
                }}
              >
                {experience.location}
              </Typography>
            </Box>
          </Box>
        </motion.div>

        {/* ── Таймлайн ── */}
        <Box sx={{ display: "flex", gap: { xs: 3, md: 4 } }}>
          {/* Вертикальная линия */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flexShrink: 0,
              pt: "6px",
            }}
          >
            {/* Верхняя точка */}
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: COLORS.neonBlue,
                boxShadow: `0 0 12px ${alpha(COLORS.neonBlue, 0.8)}`,
                flexShrink: 0,
                zIndex: 1,
              }}
            />

            {/* Линия (анимированная) */}
            <motion.div
              variants={lineVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              style={{
                width: 1,
                flex: 1,
                background: `linear-gradient(180deg,
                  ${COLORS.neonBlue},
                  ${alpha(COLORS.neonBlue, 0.15)}
                )`,
                minHeight: 40,
                marginTop: 4,
                marginBottom: 4,
              }}
            />

            {/* Нижняя точка (открытая — "до сих пор") */}
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                border: `2px solid ${alpha(COLORS.neonBlue, 0.5)}`,
                background: "transparent",
                flexShrink: 0,
              }}
            />
          </Box>

          {/* Записи таймлайна */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            style={{ flex: 1, minWidth: 0 }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: { xs: 2.5, md: 3 },
              }}
            >
              {experience.items.map((item) => (
                <TimelineItem key={item.period} item={item} />
              ))}
            </Box>
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
};

// ── Одна запись таймлайна ─────────────────────────────────────────────────────
interface TimelineItemProps {
  item: ExperienceItem;
}

const TimelineItem = ({ item }: TimelineItemProps) => (
  <motion.div variants={itemVariants}>
    <Box
      className="glass-panel"
      sx={{
        p: { xs: 2.5, md: 3 },
        display: "flex",
        flexDirection: "column",
        gap: 2,
        transition: "all 0.25s ease",
        "&:hover": {
          borderColor: alpha(COLORS.neonBlue, 0.45),
          boxShadow: `0 0 32px ${alpha(COLORS.neonBlue, 0.1)}`,
          transform: "translateX(4px)",
        },
      }}
    >
      {/* Период + должность */}
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: COLORS.textPrimary,
            fontWeight: 700,
          }}
        >
          {item.title}
        </Typography>

        <Typography
          variant="caption"
          sx={{
            color: COLORS.neonBlueSoft,
            letterSpacing: "0.08em",
            fontStyle: "italic",
            whiteSpace: "nowrap",
            textTransform: "none",
            fontSize: "0.8rem",
          }}
        >
          {item.period}
        </Typography>
      </Box>

      {/* Разделитель */}
      <Box
        sx={{
          height: "1px",
          background: `linear-gradient(90deg,
            ${alpha(COLORS.neonBlue, 0.3)},
            transparent
          )`,
        }}
      />

      {/* Описание */}
      <Typography
        variant="body2"
        sx={{
          color: COLORS.textSecondary,
          lineHeight: 1.7,
        }}
      >
        {item.description}
      </Typography>

      {/* Теги */}
      {item.tags && item.tags.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {item.tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{ fontSize: "0.7rem" }}
            />
          ))}
        </Box>
      )}
    </Box>
  </motion.div>
);
