import { useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box } from "@mui/material";
import { theme } from "../theme/theme";
import { GlobalStyles } from "../theme/GlobalStyles";
import { ScrollContainer } from "../components/layout/ScrollContainer";
import { Preloader } from "../components/preloader/Preloader";
import { HeroSection } from "../components/sections/hero/HeroSection";
import { AboutSection } from "../components/sections/about/AboutSection";
import { SellingPointsSection } from "../components/sections/selling/SellingPointsSection";
import {
  StackGroupSection,
  TechGroups,
} from "../components/sections/stack/StackGroupSection";
import { AllTechSection } from "../components/sections/alltech/AllTechSection";
import { ExperienceSection } from "../components/sections/experience/ExperienceSection";
import { CaseSection } from "../components/sections/cases/CaseSection";
import { FooterSection } from "../components/sections/footer/FooterSection";
import { useTechGroups } from "../data/techGroups";
import { useCases } from "../data/cases";

export const App = () => {
  const [preloaderDone, setPreloaderDone] = useState(false);
  const cases = useCases();
  const techGroups = useTechGroups();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles />

      <Box id="bg-layer" aria-hidden="true" />

      <Preloader onFinish={() => setPreloaderDone(true)} />

      <Box
        sx={{
          opacity: preloaderDone ? 1 : 0,
          transition: "opacity 0.4s ease",
          height: "100%",
        }}
      >
        <ScrollContainer>
          <HeroSection />
          <AboutSection />
          <SellingPointsSection />

          <TechGroups groups={techGroups} />

          <AllTechSection />
          <ExperienceSection />

          {cases.map((caseItem) => (
            <CaseSection key={caseItem.id} caseData={caseItem} />
          ))}

          <FooterSection />
        </ScrollContainer>
      </Box>
    </ThemeProvider>
  );
};
