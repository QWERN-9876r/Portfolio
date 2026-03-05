import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { COLORS } from "../../theme/theme";

interface SectionStubProps {
  id: string;
  label: string;
  index: number;
}

export const SectionStub = ({ id, label, index }: SectionStubProps) => (
  <Box
    id={id}
    component="section"
    className="snap-section"
    sx={{ flexDirection: "column", gap: 2 }}
  >
    <Box
      className="glass-panel"
      sx={{
        p: { xs: 3, md: 5 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        minWidth: { xs: "90vw", sm: 420 },
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: COLORS.neonBlueSoft, letterSpacing: "0.2em" }}
      >
        СЕКЦИЯ {String(index + 1).padStart(2, "0")}
      </Typography>

      <Typography
        variant="h2"
        sx={{ color: COLORS.textPrimary, textAlign: "center" }}
      >
        {label}
      </Typography>

      <Box className="neon-line" sx={{ width: "100%", my: 1 }} />

      <Typography
        variant="body2"
        sx={{ color: COLORS.textSecondary, textAlign: "center" }}
      >
        Этот экран будет реализован в следующих этапах
      </Typography>

      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: COLORS.neonBlue,
          boxShadow: `0 0 12px ${alpha(COLORS.neonBlue, 0.8)}`,
          mt: 1,
        }}
      />
    </Box>
  </Box>
);
