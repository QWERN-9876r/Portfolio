import { Box } from "@mui/material";
import { forwardRef } from "react";

interface VirtualSectionProps {
  index: number;
  children: React.ReactNode;
  isVisible: boolean;
  className?: string;
  sx?: any;
}

export const VirtualSection = forwardRef<HTMLDivElement, VirtualSectionProps>(
  ({ index, children, isVisible, className, sx, ...props }, ref) => {
    return (
      <Box
        ref={ref}
        data-section-index={index}
        className={className}
        sx={{
          ...sx,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: isVisible ? 1 : 0,
          pointerEvents: isVisible ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
        {...props}
      >
        {isVisible ? children : null}
      </Box>
    );
  },
);

VirtualSection.displayName = "VirtualSection";
