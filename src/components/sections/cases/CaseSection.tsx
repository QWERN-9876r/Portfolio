import { Box, Typography, Chip } from '@mui/material'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { alpha } from '@mui/material/styles'
import { COLORS } from '../../../theme/theme'
import type { CaseItem, CaseResult } from '../../../data/cases'

interface CaseSectionProps {
    caseData: CaseItem
}

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

// Варианты контейнера (stagger дочерних)
const containerVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
}

// Варианты блока (проблема/решение/результаты)
const blockVariants = {
    hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
    visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
    },
}

// Варианты карточек результатов (stagger)
const resultsContainerVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.1, delayChildren: 0.05 },
    },
}

const resultCardVariants = {
    hidden: { opacity: 0, scale: 0.8, filter: 'blur(4px)' },
    visible: {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        transition: {
            duration: 0.45,
            ease: [0.34, 1.56, 0.64, 1],
        },
    },
}

// Варианты правой части
const rightVariants = {
    hidden: { opacity: 0, x: 40, filter: 'blur(10px)' },
    visible: {
        opacity: 1,
        x: 0,
        filter: 'blur(0px)',
        transition: {
            duration: 0.75,
            delay: 0.2,
            ease: [0.25, 0.46, 0.45, 0.94],
        },
    },
}

export const CaseSection = ({ caseData }: CaseSectionProps) => {
    const ref = useRef<HTMLDivElement>(null)
    const inView = useInView(ref, { once: true, margin: '-10%' })

    return (
        <Box
            id={caseData.id}
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
                    flexDirection: {
                        xs: 'column',
                        lg: caseData.hideRightSlot ? 'column' : 'row',
                    },
                    alignItems: { xs: 'flex-start', lg: 'center' },
                    gap: { xs: 4, lg: caseData.hideRightSlot ? 4 : 6 },
                    width: '100%',
                    maxWidth: 1100,
                }}
            >
                {/* ── Левая часть: контент ── */}
                <Box
                    sx={{
                        flex: caseData.hideRightSlot ? 'none' : 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: { xs: 3, md: 3.5 },
                        minWidth: 0,
                        width: '100%',
                    }}
                >
                    {/* Заголовок */}
                    <motion.div
                        variants={titleVariants}
                        initial="hidden"
                        animate={inView ? 'visible' : 'hidden'}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1.5,
                            }}
                        >
                            {/* Номер + линия */}
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
                                    {String(caseData.index).padStart(2, '0')}
                                </Typography>
                                <Box className="neon-line" sx={{ width: 40 }} />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: alpha(COLORS.neonBlueSoft, 0.5),
                                        letterSpacing: '0.15em',
                                    }}
                                >
                                    КЕЙС
                                </Typography>
                            </Box>

                            {/* Название */}
                            <Typography
                                variant="h2"
                                sx={{
                                    color: COLORS.textPrimary,
                                    lineHeight: 1,
                                    whiteSpace: 0.8,
                                }}
                            >
                                {caseData.title}
                            </Typography>

                            {/* Компания + период */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    flexWrap: 'wrap',
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: COLORS.neonBlueSoft,
                                        fontWeight: 600,
                                        fontSize: '0.9rem',
                                    }}
                                >
                                    {caseData.company}
                                </Typography>

                                {caseData.period && (
                                    <>
                                        <Box
                                            sx={{
                                                width: 4,
                                                height: 4,
                                                borderRadius: '50%',
                                                background: alpha(
                                                    COLORS.neonBlue,
                                                    0.4,
                                                ),
                                            }}
                                        />
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: COLORS.textSecondary,
                                                fontStyle: 'italic',
                                                fontSize: '0.85rem',
                                            }}
                                        >
                                            {caseData.period}
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        </Box>
                    </motion.div>

                    {/* Блоки: проблема → решение → результаты */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate={inView ? 'visible' : 'hidden'}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                            }}
                        >
                            {/* Проблема */}
                            <ContentBlock
                                label="ПРОБЛЕМА"
                                accentColor={alpha(COLORS.neonBlue, 0.6)}
                                text={caseData.problem}
                            />

                            {/* Решение */}
                            <ContentBlock
                                label="РЕШЕНИЕ"
                                accentColor={COLORS.neonBlueSoft}
                                text={caseData.solution}
                            />

                            {/* Результаты */}
                            <motion.div variants={blockVariants}>
                                <Box
                                    className="glass-panel"
                                    sx={{ p: { xs: 2.5, md: 3 } }}
                                >
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: COLORS.neonBlueSoft,
                                            letterSpacing: '0.2em',
                                            display: 'block',
                                            mb: 2,
                                        }}
                                    >
                                        РЕЗУЛЬТАТ
                                    </Typography>

                                    <motion.div
                                        variants={resultsContainerVariants}
                                        initial="hidden"
                                        animate={inView ? 'visible' : 'hidden'}
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                gap: 2,
                                                flexWrap: 'wrap',
                                            }}
                                        >
                                            {caseData.results.map((result) => (
                                                <ResultCard
                                                    key={result.label}
                                                    result={result}
                                                />
                                            ))}
                                        </Box>
                                    </motion.div>
                                </Box>
                            </motion.div>

                            {/* Теги */}
                            {caseData.tags && caseData.tags.length > 0 && (
                                <motion.div variants={blockVariants}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: 1,
                                        }}
                                    >
                                        {caseData.tags.map((tag) => (
                                            <Chip
                                                key={tag}
                                                label={tag}
                                                size="small"
                                                sx={{ fontSize: '0.7rem' }}
                                            />
                                        ))}
                                    </Box>
                                </motion.div>
                            )}
                        </Box>
                    </motion.div>
                </Box>

                {/* ── Правая часть: слот под твой интерактив ── */}
                {!caseData.hideRightSlot && (
                    <motion.div
                        variants={rightVariants}
                        initial="hidden"
                        animate={inView ? 'visible' : 'hidden'}
                        style={{ flexShrink: 0, width: '100%' }}
                    >
                        <CaseRightSlot caseId={caseData.id} />
                    </motion.div>
                )}
            </Box>
        </Box>
    )
}

// ── Блок текста (проблема / решение) ─────────────────────────────────────────
interface ContentBlockProps {
    label: string
    accentColor: string
    text: string
}

const ContentBlock = ({ label, accentColor, text }: ContentBlockProps) => (
    <motion.div variants={blockVariants}>
        <Box
            className="glass-panel"
            sx={{
                p: { xs: 2.5, md: 3 },
                borderLeft: `3px solid ${accentColor}`,
                borderRadius: '0 16px 16px 0',
                // Левый border поверх glass-panel border
                borderTopLeftRadius: '4px',
                borderBottomLeftRadius: '4px',
            }}
        >
            <Typography
                variant="caption"
                sx={{
                    color: accentColor,
                    letterSpacing: '0.2em',
                    display: 'block',
                    mb: 1.5,
                }}
            >
                {label}
            </Typography>

            <Typography
                variant="body2"
                sx={{
                    color: COLORS.textSecondary,
                    lineHeight: 1.8,
                }}
            >
                {text}
            </Typography>
        </Box>
    </motion.div>
)

// ── Карточка результата ───────────────────────────────────────────────────────
interface ResultCardProps {
    result: CaseResult
}

const ResultCard = ({ result }: ResultCardProps) => (
    <motion.div variants={resultCardVariants}>
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                p: { xs: 1.5, md: 2 },
                borderRadius: '12px',
                background: alpha(COLORS.neonBlue, 0.06),
                border: `1px solid ${alpha(COLORS.neonBlue, 0.15)}`,
                textAlign: 'center',
                transition: 'all 0.25s ease',
                '&:hover': {
                    background: alpha(COLORS.neonBlue, 0.1),
                    borderColor: alpha(COLORS.neonBlue, 0.4),
                    boxShadow: `0 0 20px ${alpha(COLORS.neonBlue, 0.12)}`,
                    transform: 'translateY(-2px)',
                },
            }}
        >
            {/* Значение — крупное, акцентное */}
            <Typography
                sx={{
                    fontFamily: "'Rubik Mono One', monospace",
                    fontSize: { xs: '1.4rem', md: '1.75rem' },
                    color: COLORS.neonBlueSoft,
                    lineHeight: 1,
                    textShadow: `0 0 20px ${alpha(COLORS.neonBlue, 0.5)}`,
                }}
            >
                {result.value}
            </Typography>

            {/* Метка */}
            <Typography
                variant="caption"
                sx={{
                    color: COLORS.textSecondary,
                    textTransform: 'none',
                    fontSize: '0.7rem',
                    letterSpacing: '0.04em',
                    lineHeight: 1.3,
                }}
            >
                {result.label}
            </Typography>
        </Box>
    </motion.div>
)

// ── Правый слот (заглушка — ты заменишь на свой интерактив) ──────────────────
interface CaseRightSlotProps {
    caseId: string
}

const CaseRightSlot = ({ caseId }: CaseRightSlotProps) => (
    <Box
        data-case-id={caseId}
        sx={{
            width: { xs: '100%', lg: 400 },
            height: { xs: 220, lg: 400 },
            borderRadius: '20px',
            border: `1px dashed ${alpha(COLORS.neonBlue, 0.2)}`,
            background: `
        radial-gradient(ellipse 60% 50% at 50% 50%,
          ${alpha(COLORS.neonBlue, 0.04)} 0%,
          transparent 70%
        ),
        ${alpha(COLORS.bgElevated, 0.2)}
      `,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            flexShrink: 0,
        }}
    >
        <Typography
            variant="caption"
            sx={{
                color: alpha(COLORS.neonBlueSoft, 0.25),
                letterSpacing: '0.2em',
                fontSize: '0.65rem',
                textAlign: 'center',
            }}
        >
            ПРАВЫЙ СЛОТ
            <br />
            {caseId.toUpperCase()}
            <br />
            ТВОй ИНТЕРАКТИВ
        </Typography>
    </Box>
)
