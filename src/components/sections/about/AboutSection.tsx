import { Box, Typography } from "@mui/material";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { alpha } from "@mui/material/styles";
import { COLORS } from "../../../theme/theme";

const ABOUT_TEXT =
  "Я fullstack-разработчик с опытом в Яндексе, где закрывал " +
  "сложные технические задачи — от оптимизации производительности интерфейсов " +
  "до проектирования огромных проектов. Пишу высокопроизводительный, " +
  "поддерживаемый код и всегда смотрю шире задачи: думаю о том, " +
  "как решение влияет на продукт и бизнес в целом. " +
  "Инициативен, довожу начатое до результата и не жду, " +
  "когда скажут что делать.";

const FACTS = [
  { value: "2", label: "года опыта" },
  { value: "1", label: "компания — Яндекс" },
] as const;

const sectionVariants = {
  hidden: { opacity: 0, y: 60, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// Варианты появления дочерних элементов
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.13, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const AboutSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  // Запускаем анимацию только когда секция входит во viewport
  const inView = useInView(ref, { once: true, margin: "-15%" });

  return (
    <Box
      id="about"
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
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        style={{ width: "100%", maxWidth: 1100 }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: { xs: 4, md: 5 },
            }}
          >
            {/* ── Заголовок секции ── */}
            <motion.div variants={itemVariants}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: COLORS.neonBlueSoft,
                    letterSpacing: "0.25em",
                  }}
                >
                  01
                </Typography>
                <Box className="neon-line" sx={{ width: 40 }} />
                <Typography variant="h2" sx={{ color: COLORS.textPrimary }}>
                  О себе
                </Typography>
              </Box>
            </motion.div>

            {/* ── Основной блок: текст + факты ── */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: { xs: 4, md: 6 },
                alignItems: { xs: "flex-start", md: "flex-start" },
              }}
            >
              {/* Абзац */}
              <motion.div variants={itemVariants} style={{ flex: 1 }}>
                <Box className="glass-panel" sx={{ p: { xs: 3, md: 4 } }}>
                  {/* Декоративная метка */}
                  <Typography
                    variant="caption"
                    sx={{
                      color: COLORS.neonBlueSoft,
                      letterSpacing: "0.2em",
                      display: "block",
                      mb: 2,
                    }}
                  >
                    BIO
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      color: COLORS.textSecondary,
                      lineHeight: 1.85,
                      // Акцентируем ключевые слова
                      "& strong": {
                        color: COLORS.textPrimary,
                        fontWeight: 600,
                      },
                    }}
                    dangerouslySetInnerHTML={{
                      __html: ABOUT_TEXT.replace(
                        "Яндексе",
                        "<strong>Яндексе</strong>",
                      )
                        .replace(
                          "производительности",
                          "<strong>производительности</strong>",
                        )
                        .replace(
                          "высокопроизводительный",
                          "<strong>высокопроизводительный</strong>",
                        )
                        .replace("бизнес", "<strong>бизнес</strong>")
                        .replace("Инициативен", "<strong>Инициативен</strong>"),
                    }}
                  />
                </Box>
              </motion.div>

              {/* Факты */}
              <motion.div variants={itemVariants}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "row", md: "column" },
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  {FACTS.map((fact) => (
                    <FactCard
                      key={fact.label}
                      value={fact.value}
                      label={fact.label}
                    />
                  ))}
                </Box>
              </motion.div>
            </Box>
          </Box>
        </motion.div>
      </motion.div>
    </Box>
  );
};

// ── Карточка факта ────────────────────────────────────────────────────────────
interface FactCardProps {
  value: string;
  label: string;
}

const FactCard = ({ value, label }: FactCardProps) => (
  <Box
    className="glass-panel"
    sx={{
      p: { xs: 2, md: 3 },
      minWidth: 120,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 0.5,
      textAlign: "center",
      transition: "all 0.25s ease",
      "&:hover": {
        borderColor: alpha(COLORS.neonBlue, 0.5),
        boxShadow: `0 0 24px ${alpha(COLORS.neonBlue, 0.12)}`,
        transform: "translateY(-2px)",
      },
    }}
  >
    <Typography
      sx={{
        fontFamily: "'Rubik Mono One', monospace",
        fontSize: { xs: "1.6rem", md: "2rem" },
        color: COLORS.neonBlueSoft,
        lineHeight: 1,
        textShadow: `0 0 20px ${alpha(COLORS.neonBlue, 0.5)}`,
      }}
    >
      {value}
    </Typography>
    <Typography
      variant="caption"
      sx={{
        color: COLORS.textSecondary,
        letterSpacing: "0.05em",
        textTransform: "none",
        fontSize: "0.7rem",
        lineHeight: 1.3,
      }}
    >
      {label}
    </Typography>
  </Box>
);
