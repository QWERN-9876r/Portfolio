import { createTheme, alpha } from "@mui/material/styles";

export const COLORS = {
  bgDeep: "#050816",
  bgBase: "#080d24",
  bgElevated: "#0d1435",
  neonBlue: "#2979ff",
  neonBlueSoft: "#448aff",
  neonBlueGlow: "#1565c0",
  glassBackground: "rgba(13, 20, 53, 0.55)",
  glassBorder: "rgba(41, 121, 255, 0.25)",
  glassGlow: "rgba(41, 121, 255, 0.12)",
  textPrimary: "#e8eaf6",
  textSecondary: "#7986cb",
  textMuted: "#3949ab",
} as const;

export const GLASS = {
  panel: {
    background: COLORS.glassBackground,
    backdropFilter: "blur(16px) saturate(180%)",
    WebkitBackdropFilter: "blur(16px) saturate(180%)",
    border: `1px solid ${COLORS.glassBorder}`,
    borderRadius: "16px",
  },
  panelGlow: {
    boxShadow: `0 0 24px ${COLORS.glassGlow}, 0 0 1px ${COLORS.glassBorder}`,
  },
  neonBorder: {
    border: `1px solid ${alpha(COLORS.neonBlue, 0.6)}`,
    boxShadow: `0 0 16px ${alpha(COLORS.neonBlue, 0.2)}`,
  },
} as const;

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: COLORS.neonBlue,
      light: COLORS.neonBlueSoft,
      dark: COLORS.neonBlueGlow,
    },
    background: {
      default: COLORS.bgDeep,
      paper: COLORS.bgElevated,
    },
    text: {
      primary: COLORS.textPrimary,
      secondary: COLORS.textSecondary,
    },
  },

  typography: {
    fontFamily: "'Montserrat', sans-serif",
    h1: {
      fontFamily: "'Rubik Mono One', monospace",
      fontSize: "clamp(2rem, 5vw, 4rem)",
      fontWeight: 400,
      lineHeight: 1.1,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontFamily: "'Rubik Mono One', monospace",
      fontSize: "clamp(1.5rem, 3.5vw, 2.75rem)",
      fontWeight: 400,
      lineHeight: 1.15,
      letterSpacing: "-0.01em",
    },
    h3: {
      fontFamily: "'Rubik Mono One', monospace",
      fontSize: "clamp(1.1rem, 2vw, 1.75rem)",
      fontWeight: 400,
      lineHeight: 1.3,
    },
    h4: {
      fontFamily: "'Montserrat', sans-serif",
      fontSize: "clamp(1rem, 1.5vw, 1.35rem)",
      fontWeight: 700,
      lineHeight: 1.4,
    },
    h5: {
      fontFamily: "'Montserrat', sans-serif",
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontFamily: "'Montserrat', sans-serif",
      fontSize: "0.875rem",
      fontWeight: 600,
    },
    body1: {
      fontFamily: "'Montserrat', sans-serif",
      fontSize: "clamp(0.9rem, 1.1vw, 1.05rem)",
      fontWeight: 400,
      lineHeight: 1.75,
    },
    body2: {
      fontFamily: "'Montserrat', sans-serif",
      fontSize: "0.875rem",
      fontWeight: 400,
      lineHeight: 1.65,
    },
    caption: {
      fontFamily: "'Montserrat', sans-serif",
      fontSize: "0.75rem",
      fontWeight: 500,
      letterSpacing: "0.08em",
      textTransform: "uppercase" as const,
    },
    button: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 600,
      letterSpacing: "0.04em",
      textTransform: "none" as const,
    },
  },

  shape: { borderRadius: 12 },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "*, *::before, *::after": { boxSizing: "border-box" },
        html: {
          scrollBehavior: "auto",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          WebkitTextSizeAdjust: "100%",
        },

        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",

        backgroundImage: "none",
        body: {
          background: COLORS.bgDeep,
          overflowX: "hidden",
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            background: alpha(COLORS.neonBlue, 0.4),
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: alpha(COLORS.neonBlue, 0.7),
          },
        },
        canvas: { display: "block", outline: "none" },
        "a, button": { WebkitTapHighlightColor: "transparent" },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "10px",
          padding: "10px 28px",
          fontSize: "0.95rem",
          transition: "all 0.25s ease",
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${COLORS.neonBlue}, ${COLORS.neonBlueSoft})`,
          boxShadow: `0 0 20px ${alpha(COLORS.neonBlue, 0.35)}`,
          "&:hover": {
            boxShadow: `0 0 32px ${alpha(COLORS.neonBlue, 0.55)}`,
            transform: "translateY(-1px)",
          },
          "&:active": { transform: "translateY(0)" },
        },
        outlinedPrimary: {
          borderColor: alpha(COLORS.neonBlue, 0.5),
          "&:hover": {
            borderColor: COLORS.neonBlue,
            background: alpha(COLORS.neonBlue, 0.08),
            boxShadow: `0 0 16px ${alpha(COLORS.neonBlue, 0.2)}`,
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          background: COLORS.glassBackground,
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          border: `1px solid ${COLORS.glassBorder}`,
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 600,
          fontSize: "0.75rem",
          letterSpacing: "0.04em",
          background: alpha(COLORS.neonBlue, 0.1),
          border: `1px solid ${alpha(COLORS.neonBlue, 0.3)}`,
          color: COLORS.neonBlueSoft,
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          background: COLORS.bgElevated,
          border: `1px solid ${COLORS.glassBorder}`,
          color: COLORS.textPrimary,
          fontFamily: "'Montserrat', sans-serif",
          fontSize: "0.8rem",
          fontWeight: 500,
          backdropFilter: "blur(8px)",
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: { borderColor: alpha(COLORS.neonBlue, 0.15) },
      },
    },
  },
});
