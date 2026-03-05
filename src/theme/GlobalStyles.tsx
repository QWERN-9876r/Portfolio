import { GlobalStyles as MuiGlobalStyles } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { COLORS } from "./theme";

export const GlobalStyles = () => (
  <MuiGlobalStyles
    styles={{
      "#bg-layer": {
        position: "fixed",
        inset: 0,
        zIndex: -1,
        background: `
          radial-gradient(ellipse 80% 60% at 10% 20%, ${alpha(COLORS.neonBlue, 0.07)} 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 90% 80%, ${alpha(COLORS.neonBlueGlow, 0.08)} 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 50% 50%, ${alpha(COLORS.bgElevated, 0.4)} 0%, transparent 70%),
          ${COLORS.bgDeep}
        `,
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
          pointerEvents: "none",
          opacity: 0.6,
        },
      },

      "#scroll-root": {
        height: "100svh",
        overflowY: "auto",
        overflowX: "hidden",
        scrollSnapType: "y mandatory",
        scrollBehavior: "smooth",
        "&::-webkit-scrollbar": { width: "4px" },
        "&::-webkit-scrollbar-track": { background: "transparent" },
        "&::-webkit-scrollbar-thumb": {
          background: alpha(COLORS.neonBlue, 0.35),
          borderRadius: "4px",
        },
        "&::-webkit-scrollbar-thumb:hover": {
          background: alpha(COLORS.neonBlue, 0.6),
        },
      },

      ".snap-section": {
        minHeight: "100svh",
        scrollSnapAlign: "start",
        scrollSnapStop: "always",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        "@media (max-width: 600px)": {
          padding: "24px 16px",
        },
      },

      ".text-accent": {
        color: COLORS.neonBlueSoft,
      },

      ".glass-panel": {
        background: COLORS.glassBackground,
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        border: `1px solid ${COLORS.glassBorder}`,
        borderRadius: "16px",
        transition: "border-color 0.25s ease, box-shadow 0.25s ease",
        "&:hover": {
          borderColor: alpha(COLORS.neonBlue, 0.45),
          boxShadow: `0 0 32px ${alpha(COLORS.neonBlue, 0.1)}`,
        },
      },

      ".neon-line": {
        height: "1px",
        background: `linear-gradient(90deg, transparent, ${COLORS.neonBlue}, transparent)`,
        opacity: 0.5,
      },
    }}
  />
);
