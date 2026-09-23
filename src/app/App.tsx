import { useEffect } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline, Box } from '@mui/material'
import { theme } from '../theme/theme'
import { GlobalStyles } from '../theme/GlobalStyles'
import { ScrollContainer } from '../components/layout/ScrollContainer'
import { hidePreloader } from '../components/preloader/hidePreloader'
import { HeroSection } from '../components/sections/hero'
import { AboutSection } from '../components/sections/about'
import { SellingPointsSection } from '../components/sections/selling'
import { TechGroups } from '../components/sections/stack'
import { AllTechSection } from '../components/sections/alltech'
import { ExperienceSection } from '../components/sections/experience'
import { Cases } from '../components/sections/cases'
import { FooterSection } from '../components/sections/footer'
import { LocaleProvider } from '../i18n/locale'
import { LanguageToggle } from '../components/layout/LanguageToggle'

export const App = () => {
    useEffect(hidePreloader, [])

    return (
        <LocaleProvider>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <GlobalStyles />

                <Box id="bg-layer" aria-hidden="true" />
                <LanguageToggle />

                <ScrollContainer>
                    <HeroSection />
                    <AboutSection />
                    <SellingPointsSection />

                    <TechGroups />

                    <AllTechSection />
                    <ExperienceSection />

                    <Cases />

                    <FooterSection />
                </ScrollContainer>
            </ThemeProvider>
        </LocaleProvider>
    )
}
