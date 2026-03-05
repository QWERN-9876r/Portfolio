import { Box, Typography, Button } from "@mui/material";
import { motion } from "framer-motion";
import { alpha } from "@mui/material/styles";
import { COLORS } from "../../../theme/theme";
import { HeroRole } from "./HeroRole";
import { HeroPhoto } from "./HeroPhoto";
import TelegramIcon from "@mui/icons-material/Telegram";

const TG_URL = "https://t.me/Qwern_9876r";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 32,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.65,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const sectionVariants = {
  hidden: {
    clipPath: "inset(0 0 100% 0)",
    opacity: 0,
  },
  visible: {
    clipPath: "inset(0 0 0% 0)",
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: [0.76, 0, 0.24, 1],
    },
  },
};

export const HeroSection = () => (
  <Box
    id="hero"
    component="section"
    className="snap-section"
    sx={{
      alignItems: "center",
      justifyContent: "center",
      px: { xs: 2, sm: 4, md: 6, lg: 8 },
      py: { xs: 6, md: 0 },
      overflow: "hidden",
    }}
  >
    <motion.div
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      style={{ width: "100%", maxWidth: 1100 }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          justifyContent: { xs: "center", md: "space-between" },
          gap: { xs: 5, md: 4, lg: 6 },
          width: "100%",
        }}
      >
        {/* ── Левая часть: текст ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ flex: 1, minWidth: 0 }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: { xs: 2, md: 2.5 },
              alignItems: { xs: "center", md: "flex-start" },
              textAlign: { xs: "center", md: "left" },
            }}
          >
            {/* Ник — italic, крупный, без @ и без ссылки */}
            <motion.div variants={itemVariants}>
              <Typography
                sx={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontStyle: "italic",
                  fontWeight: 600,
                  fontSize: { xs: "1.4rem", sm: "1.65rem", md: "1.9rem" },
                  color: alpha(COLORS.neonBlueSoft, 0.7),
                  letterSpacing: "0.02em",
                  lineHeight: 1,
                  userSelect: "none",
                }}
              >
                Qwern_9876r
              </Typography>
            </motion.div>

            {/* Имя */}
            <motion.div variants={itemVariants}>
              <Typography
                variant="h1"
                sx={{
                  color: COLORS.textPrimary,
                  lineHeight: 1.05,
                }}
              >
                Сотников
                <br />
                <Box
                  component="span"
                  sx={{
                    color: COLORS.neonBlueSoft,
                    textShadow: `0 0 40px ${alpha(COLORS.neonBlue, 0.5)}`,
                  }}
                >
                  Дмитрий
                </Box>
              </Typography>
            </motion.div>

            {/* Переключатель роли */}
            <motion.div variants={itemVariants}>
              <HeroRole />
            </motion.div>

            {/* Разделитель */}
            <motion.div variants={itemVariants} style={{ width: "100%" }}>
              <Box
                className="neon-line"
                sx={{ width: { xs: "80%", md: "60%" }, maxWidth: 280 }}
              />
            </motion.div>

            {/* Ключевая фраза */}
            <motion.div variants={itemVariants}>
              <Typography
                variant="body1"
                sx={{
                  color: COLORS.textSecondary,
                  fontWeight: 500,
                  lineHeight: 1.6,
                  maxWidth: 480,
                }}
              >
                Делаю сложное —{" "}
                <Box
                  component="span"
                  sx={{ color: COLORS.textPrimary, fontWeight: 600 }}
                >
                  стабильным, быстрым
                </Box>{" "}
                и{" "}
                <Box
                  component="span"
                  sx={{ color: COLORS.textPrimary, fontWeight: 600 }}
                >
                  масштабируемым
                </Box>
              </Typography>
            </motion.div>

            {/* CTA */}
            <motion.div variants={itemVariants}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<TelegramIcon />}
                href={TG_URL}
                target="_blank"
                rel="noopener noreferrer"
                component="a"
                sx={{
                  mt: 0.5,
                  width: "fit-content",
                  fontSize: "1rem",
                  px: 3.5,
                  py: 1.5,
                }}
              >
                Написать в Telegram
              </Button>
            </motion.div>
          </Box>
        </motion.div>

        {/* ── Правая часть: фото ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, filter: "blur(12px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{
            duration: 0.9,
            delay: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <HeroPhoto />
        </motion.div>
      </Box>
    </motion.div>
  </Box>
);
