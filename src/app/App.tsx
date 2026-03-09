import { useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box } from "@mui/material";
import { theme } from "../theme/theme";
import { GlobalStyles } from "../theme/GlobalStyles";
import { ScrollContainer } from "../components/layout/ScrollContainer";
import { Preloader } from "../components/preloader/Preloader";
import { HeroSection } from "../components/sections/hero";
import { AboutSection } from "../components/sections/about";
import { SellingPointsSection } from "../components/sections/selling";
import { TechGroups } from "../components/sections/stack";
import { AllTechSection } from "../components/sections/alltech";
import { ExperienceSection } from "../components/sections/experience";
import { CaseSection } from "../components/sections/cases";
import { FooterSection } from "../components/sections/footer";
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
