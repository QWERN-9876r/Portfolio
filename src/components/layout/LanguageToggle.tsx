import { Box, ButtonBase, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useLocale, type Locale } from '../../i18n/locale'
import { COLORS } from '../../theme/theme'

const languages: Locale[] = ['en', 'ru']

export const LanguageToggle = () => {
    const { locale, setLocale } = useLocale()

    return (
        <Box
            component="nav"
            aria-label="Language"
            sx={{
                position: 'fixed',
                top: { xs: 16, md: 24 },
                right: { xs: 16, md: 32 },
                zIndex: 20,
                display: 'flex',
                gap: 0.25,
                p: 0.5,
                border: `1px solid ${COLORS.glassBorder}`,
                borderRadius: '10px',
                background: alpha(COLORS.bgElevated, 0.78),
                backdropFilter: 'blur(14px)',
            }}
        >
            {languages.map((language) => {
                const active = locale === language

                return (
                    <ButtonBase
                        key={language}
                        onClick={() => setLocale(language)}
                        aria-current={active ? 'page' : undefined}
                        aria-label={`Switch language to ${language.toUpperCase()}`}
                        sx={{
                            minWidth: 34,
                            minHeight: 30,
                            px: 1,
                            borderRadius: '7px',
                            color: active
                                ? COLORS.textPrimary
                                : COLORS.textSecondary,
                            background: active
                                ? alpha(COLORS.neonBlue, 0.22)
                                : 'transparent',
                            border: active
                                ? `1px solid ${alpha(COLORS.neonBlue, 0.45)}`
                                : '1px solid transparent',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                color: COLORS.textPrimary,
                                background: alpha(COLORS.neonBlue, 0.14),
                            },
                        }}
                    >
                        <Typography
                            variant="caption"
                            sx={{ fontWeight: 700, letterSpacing: '0.08em' }}
                        >
                            {language.toUpperCase()}
                        </Typography>
                    </ButtonBase>
                )
            })}
        </Box>
    )
}
