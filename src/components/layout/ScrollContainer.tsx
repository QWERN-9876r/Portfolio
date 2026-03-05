import { useRef, type ReactNode } from "react";
import { Box } from "@mui/material";

interface ScrollContainerProps {
  children: ReactNode;
}

export const ScrollContainer = ({ children }: ScrollContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <Box id="scroll-root" ref={containerRef} component="main" role="main">
      {children}
    </Box>
  );
};
