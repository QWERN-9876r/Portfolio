import { Box, Typography, Tooltip } from '@mui/material'
import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { alpha } from '@mui/material/styles'
import { COLORS } from '../../../theme/theme'
import { useAllTechnologies } from '../../../data/allTechnologies'
import type { Tech } from '../../../data/allTechnologies'
import { useLocale } from '../../../i18n/locale'

// Индекс секции в общем списке
const SECTION_INDEX = 10

// Варианты анимации заголовка
const titleVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
    visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] },
    },
}

// Варианты контейнера сетки (stagger)
const gridContainerVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.045, delayChildren: 0.2 },
    },
}

// Варианты одной иконки (волна появления)
const iconVariants = {
    hidden: {
        opacity: 0,
        scale: 0.5,
        filter: 'blur(6px)',
        y: 20,
    },
    visible: {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        y: 0,
        transition: {
            duration: 0.45,
            ease: [0.34, 1.56, 0.64, 1], // spring-like
        },
    },
}

export const AllTechSection = () => {
    const ref = useRef<HTMLDivElement>(null)
    const inView = useInView(ref, { once: true, margin: '-10%' })
    const technologies = useAllTechnologies()
    const { t } = useLocale()

    return (
        <Box
            id="all-tech"
            component="section"
            className="snap-section"
            ref={ref}
            sx={{
                alignItems: 'center',
                justifyContent: 'center',
                px: { xs: 2, sm: 4, md: 6, lg: 8 },
                py: { xs: 6, md: 0 },
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: { xs: 4, md: 5 },
                    width: '100%',
                    maxWidth: 1100,
                }}
            >
                {/* ── Заголовок ── */}
                <motion.div
                    variants={titleVariants}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{
                                    color: COLORS.neonBlueSoft,
                                    letterSpacing: '0.25em',
                                }}
                            >
                                {String(SECTION_INDEX).padStart(2, '0')}
                            </Typography>
                            <Box className="neon-line" sx={{ width: 40 }} />
                        </Box>

                        <Typography
                            variant="h2"
                            sx={{ color: COLORS.textPrimary }}
                        >
                            {t.sections.technologies}
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                color: COLORS.textSecondary,
                                mt: 0.5,
                                maxWidth: 480,
                            }}
                        >
                            {t.sections.technologiesHint}
                        </Typography>
                    </Box>
                </motion.div>

                {/* ── Сетка иконок ── */}
                <motion.div
                    variants={gridContainerVariants}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                >
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: 'repeat(4, 1fr)',
                                sm: 'repeat(6, 1fr)',
                                md: 'repeat(8, 1fr)',
                                lg: 'repeat(10, 1fr)',
                            },

                            gap: { xs: 2, md: 2.5 },
                        }}
                    >
                        {technologies.map((tech, index) => (
                            <TechIcon
                                key={tech.name}
                                tech={tech}
                                index={index}
                            />
                        ))}
                    </Box>
                </motion.div>
            </Box>
        </Box>
    )
}

// ── Одна иконка ───────────────────────────────────────────────────────────────
interface TechIconProps {
    tech: Tech
    index: number
}

const TechIcon = ({ tech }: TechIconProps) => {
    const [hovered, setHovered] = useState(false)
    const [imgError, setImgError] = useState(false)

    const handleClick = () => {
        window.open(tech.url, '_blank', 'noopener,noreferrer')
    }

    return (
        <motion.div variants={iconVariants}>
            <Tooltip title={tech.name} placement="top" arrow enterDelay={200}>
                <Box
                    onClick={handleClick}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Открыть сайт ${tech.name}`}
                    onKeyDown={(e) => e.key === 'Enter' && handleClick()}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        p: { xs: 1.5, md: 2 },
                        color: 'white',
                        borderRadius: '16px',
                        border: `1px solid ${
                            hovered
                                ? alpha(COLORS.neonBlue, 0.5)
                                : alpha(COLORS.neonBlue, 0.08)
                        }`,
                        background: hovered
                            ? alpha(COLORS.neonBlue, 0.08)
                            : alpha(COLORS.bgElevated, 0.3),
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: hovered
                            ? `0 0 20px ${alpha(COLORS.neonBlue, 0.15)},
                 0 4px 16px ${alpha(COLORS.bgDeep, 0.3)}`
                            : 'none',
                        outline: 'none',
                        '&:focus-visible': {
                            border: `1px solid ${alpha(COLORS.neonBlue, 0.7)}`,
                        },
                        aspectRatio: '1 / 1',
                    }}
                >
                    {/* Иконка */}
                    <motion.div
                        animate={
                            hovered
                                ? { scale: 1.15, y: -3 }
                                : { scale: 1, y: 0 }
                        }
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 18,
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                        }}
                    >
                        {imgError ? (
                            // Fallback — первая буква
                            <Box
                                sx={{
                                    width: { xs: 32, md: 40 },
                                    height: { xs: 32, md: 40 },
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontFamily: "'Rubik Mono One', monospace",
                                    fontSize: { xs: '1rem', md: '1.2rem' },
                                    color: COLORS.neonBlueSoft,
                                    filter: hovered
                                        ? `drop-shadow(0 0 8px ${alpha(COLORS.neonBlue, 0.7)})`
                                        : 'none',
                                    transition: 'filter 0.2s ease',
                                }}
                            >
                                {tech.name[0]}
                            </Box>
                        ) : (
                            <Box
                                component="img"
                                src={tech.icon}
                                alt={tech.name}
                                onError={() => setImgError(true)}
                                sx={{
                                    width: { xs: 32, md: 40 },
                                    height: { xs: 32, md: 40 },
                                    objectFit: 'contain',
                                    display: 'block',
                                    color: 'white',
                                    filter: hovered
                                        ? `drop-shadow(0 0 6px ${alpha(COLORS.neonBlue, 0.6)})`
                                        : 'none',
                                    transition: 'filter 0.2s ease',
                                }}
                            />
                        )}
                    </motion.div>
                </Box>
            </Tooltip>
        </motion.div>
    )
}
