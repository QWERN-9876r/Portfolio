import { Box, Typography, IconButton, Tooltip } from '@mui/material'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { alpha } from '@mui/material/styles'
import { COLORS } from '../../../theme/theme'
import TelegramIcon from '@mui/icons-material/Telegram'
import GitHubIcon from '@mui/icons-material/GitHub'
import EmailIcon from '@mui/icons-material/Email'
import WorkIcon from '@mui/icons-material/Work'
import { useLocale } from '../../../i18n/locale'

const TG_URL = 'https://t.me/Qwern_9876r'
const GITHUB_URL = 'https://github.com/QWERN-9876r'
const EMAIL = 'sotnikovdmitrij176@gmail.com'
const HH_URL = 'https://hh.ru/resume/a94d9208ff101e27e70039ed1f3755764d3255'

interface SocialLink {
    icon: React.ReactNode
    label: string
    href: string
    primary: boolean
}

const SOCIAL_LINKS: SocialLink[] = [
    {
        icon: <TelegramIcon sx={{ fontSize: 22 }} />,
        label: 'Telegram',
        href: TG_URL,
        primary: true,
    },
    {
        icon: <GitHubIcon sx={{ fontSize: 22 }} />,
        label: 'GitHub',
        href: GITHUB_URL,
        primary: false,
    },
    {
        icon: <EmailIcon sx={{ fontSize: 22 }} />,
        label: 'Email',
        href: `mailto:${EMAIL}`,
        primary: false,
    },
    {
        icon: <WorkIcon sx={{ fontSize: 22 }} />,
        label: 'HeadHunter',
        href: HH_URL,
        primary: false,
    },
]

// ── Анимации ──────────────────────────────────────────────────────────────────
const containerVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
    visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
    },
}

export const FooterSection = () => {
    const ref = useRef<HTMLDivElement>(null)
    const inView = useInView(ref, { once: true, margin: '-10%' })
    const { t } = useLocale()
    const year = new Date().getFullYear()

    return (
        <Box
            id="footer"
            component="footer"
            className="snap-section"
            ref={ref}
            sx={{
                alignItems: 'center',
                justifyContent: 'center',
                px: { xs: 2, sm: 4, md: 6, lg: 8 },
                py: { xs: 6, md: 0 },
            }}
        >
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                style={{ width: '100%', maxWidth: 1100 }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: { xs: 4, md: 5 },
                        textAlign: 'center',
                    }}
                >
                    {/* ── Верхняя декоративная линия ── */}
                    <motion.div
                        variants={itemVariants}
                        style={{ width: '100%' }}
                    >
                        <Box
                            sx={{
                                height: '1px',
                                background: `linear-gradient(90deg,
                  transparent,
                  ${alpha(COLORS.neonBlue, 0.5)},
                  ${COLORS.neonBlue},
                  ${alpha(COLORS.neonBlue, 0.5)},
                  transparent
                )`,
                                boxShadow: `0 0 12px ${alpha(COLORS.neonBlue, 0.3)}`,
                            }}
                        />
                    </motion.div>

                    {/* ── Ник + имя ── */}
                    <motion.div variants={itemVariants}>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <Typography
                                sx={{
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontStyle: 'italic',
                                    fontWeight: 600,
                                    fontSize: { xs: '1.1rem', md: '1.3rem' },
                                    color: alpha(COLORS.neonBlueSoft, 0.6),
                                    letterSpacing: '0.02em',
                                    userSelect: 'none',
                                }}
                            >
                                Qwern_9876r
                            </Typography>

                            <Typography
                                variant="h3"
                                sx={{
                                    color: COLORS.textPrimary,
                                    lineHeight: 1.1,
                                }}
                            >
                                Сотников Дмитрий
                            </Typography>

                            <Typography
                                variant="body2"
                                sx={{
                                    color: COLORS.textSecondary,
                                    fontStyle: 'italic',
                                    mt: 0.5,
                                }}
                            >
                                {t.footer.tagline}
                            </Typography>
                        </Box>
                    </motion.div>

                    {/* ── Иконки соцсетей ── */}
                    <motion.div variants={itemVariants}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                            }}
                        >
                            {SOCIAL_LINKS.map((link) => (
                                <SocialButton key={link.label} link={link} />
                            ))}
                        </Box>
                    </motion.div>

                    {/* ── CTA повтор ── */}
                    <motion.div variants={itemVariants}>
                        <Box
                            component="a"
                            href={TG_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 1.5,
                                px: 4,
                                py: 1.75,
                                borderRadius: '12px',
                                textDecoration: 'none',
                                background: `linear-gradient(135deg,
                  ${alpha(COLORS.neonBlue, 0.15)},
                  ${alpha(COLORS.neonBlueSoft, 0.1)}
                )`,
                                border: `1px solid ${alpha(COLORS.neonBlue, 0.35)}`,
                                boxShadow: `0 0 24px ${alpha(COLORS.neonBlue, 0.12)}`,
                                transition: 'all 0.25s ease',
                                '&:hover': {
                                    background: `linear-gradient(135deg,
                    ${alpha(COLORS.neonBlue, 0.25)},
                    ${alpha(COLORS.neonBlueSoft, 0.15)}
                  )`,
                                    borderColor: alpha(COLORS.neonBlue, 0.6),
                                    boxShadow: `0 0 40px ${alpha(COLORS.neonBlue, 0.25)}`,
                                    transform: 'translateY(-2px)',
                                },
                            }}
                        >
                            <TelegramIcon
                                sx={{
                                    fontSize: 20,
                                    color: COLORS.neonBlueSoft,
                                    filter: `drop-shadow(0 0 6px ${alpha(COLORS.neonBlue, 0.6)})`,
                                }}
                            />
                            <Typography
                                sx={{
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    color: COLORS.textPrimary,
                                    letterSpacing: '0.03em',
                                }}
                            >
                                {t.footer.telegram}
                            </Typography>
                        </Box>
                    </motion.div>

                    {/* ── Нижняя строка ── */}
                    <motion.div
                        variants={itemVariants}
                        style={{ width: '100%' }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 2,
                                pt: 2,
                                borderTop: `1px solid ${alpha(COLORS.neonBlue, 0.08)}`,
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{
                                    color: alpha(COLORS.textSecondary, 0.5),
                                    letterSpacing: '0.1em',
                                    textTransform: 'none',
                                    fontSize: '0.72rem',
                                }}
                            >
                                © {year} Qwern_9876r · Сотников Дмитрий
                            </Typography>
                        </Box>
                    </motion.div>
                </Box>
            </motion.div>
        </Box>
    )
}

// ── Кнопка соцсети ────────────────────────────────────────────────────────────
interface SocialButtonProps {
    link: SocialLink
}

const SocialButton = ({ link }: SocialButtonProps) => (
    <Tooltip title={link.label} placement="top" arrow enterDelay={200}>
        <IconButton
            component="a"
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            sx={{
                width: 48,
                height: 48,
                border: `1px solid ${
                    link.primary
                        ? alpha(COLORS.neonBlue, 0.45)
                        : alpha(COLORS.neonBlue, 0.15)
                }`,
                background: link.primary
                    ? alpha(COLORS.neonBlue, 0.12)
                    : alpha(COLORS.bgElevated, 0.4),
                color: link.primary
                    ? COLORS.neonBlueSoft
                    : COLORS.textSecondary,
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s ease',
                '&:hover': {
                    border: `1px solid ${alpha(COLORS.neonBlue, 0.7)}`,
                    background: alpha(COLORS.neonBlue, 0.18),
                    color: COLORS.neonBlueSoft,
                    boxShadow: `0 0 20px ${alpha(COLORS.neonBlue, 0.25)}`,
                    transform: 'translateY(-3px)',
                },
            }}
        >
            {link.icon}
        </IconButton>
    </Tooltip>
)
