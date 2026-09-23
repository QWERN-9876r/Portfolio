import { Box, Typography } from '@mui/material'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { alpha } from '@mui/material/styles'
import { COLORS } from '../../../theme/theme'
import SpeedIcon from '@mui/icons-material/Speed'
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import type { SvgIconComponent } from '@mui/icons-material'
import { useLocale } from '../../../i18n/locale'

interface SellingPoint {
    icon: SvgIconComponent
    title: string
    description: string
    tag: string
}

const SELLING_POINTS: SellingPoint[] = [
    {
        icon: SpeedIcon,
        title: 'Высокая производительность',
        tag: 'PERFORMANCE',
        description:
            'Пишу код, который не просто работает — он работает быстро. ' +
            'Оптимизирую рендер, bundle size, сетевые запросы и время отклика. ' +
            'Метрики Lighthouse, Core Web Vitals и профилирование — ' +
            'обязательная часть работы, а не опция.',
    },
    {
        icon: EmojiObjectsIcon,
        title: 'Инициативность',
        tag: 'INITIATIVE',
        description:
            'Не жду постановки задачи — нахожу проблемы и предлагаю решения сам. ' +
            'Беру на себя сложные и неопределённые задачи, ' +
            'довожу их до конца без постоянного контроля. ' +
            'Работаю автономно и несу ответственность за результат.',
    },
    {
        icon: TrendingUpIcon,
        title: 'Бизнес-мышление',
        tag: 'PRODUCT FOCUS',
        description:
            'Смотрю на задачи через призму бизнеса: ' +
            'оцениваю долгосрочные последствия технических решений, ' +
            'избегаю оверинжиниринга и фокусируюсь на том, ' +
            'что реально приносит ценность продукту и пользователям.',
    },
]

const containerVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.18, delayChildren: 0.1 },
    },
}

const titleVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
    visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] },
    },
}

const cardVariants = {
    hidden: { opacity: 0, y: 50, filter: 'blur(8px)' },
    visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
    },
}

export const SellingPointsSection = () => {
    const ref = useRef<HTMLDivElement>(null)
    const inView = useInView(ref, { once: true, margin: '-15%' })
    const { t } = useLocale()

    return (
        <Box
            id="selling-points"
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
                        gap: { xs: 4, md: 5 },
                    }}
                >
                    {/* ── Заголовок секции ── */}
                    <motion.div variants={titleVariants}>
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
                                02
                            </Typography>
                            <Box className="neon-line" sx={{ width: 40 }} />
                            <Typography
                                variant="h2"
                                sx={{ color: COLORS.textPrimary }}
                            >
                                {t.sections.whyMe}
                            </Typography>
                        </Box>
                    </motion.div>

                    {/* ── Карточки ── */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: '1fr 1fr',
                                md: '1fr 1fr 1fr',
                            },
                            gap: { xs: 2.5, md: 3 },
                        }}
                    >
                        {SELLING_POINTS.map((point, index) => (
                            <SellingCard
                                key={point.tag}
                                point={{
                                    ...point,
                                    ...t.sellingPoints[index],
                                }}
                            />
                        ))}
                    </Box>
                </Box>
            </motion.div>
        </Box>
    )
}

// ── Карточка selling point ────────────────────────────────────────────────────
interface SellingCardProps {
    point: SellingPoint
}

const SellingCard = ({ point }: SellingCardProps) => {
    const Icon = point.icon

    return (
        <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { duration: 0.25 } }}
            style={{ height: '100%' }}
        >
            <Box
                className="glass-panel"
                sx={{
                    p: { xs: 3, md: 3.5 },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2.5,
                    cursor: 'default',
                    // Hover-glow через CSS (не перебиваем Framer)
                    '&:hover': {
                        borderColor: alpha(COLORS.neonBlue, 0.5),
                        boxShadow: `
              0 0 40px ${alpha(COLORS.neonBlue, 0.1)},
              0 8px 32px ${alpha(COLORS.bgDeep, 0.4)}
            `,
                    },
                    transition:
                        'border-color 0.25s ease, box-shadow 0.25s ease',
                }}
            >
                {/* Иконка + тег */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    {/* Иконка в glassmorphism-кружке */}
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: alpha(COLORS.neonBlue, 0.12),
                            border: `1px solid ${alpha(COLORS.neonBlue, 0.25)}`,
                            boxShadow: `0 0 16px ${alpha(COLORS.neonBlue, 0.1)}`,
                        }}
                    >
                        <Icon
                            sx={{
                                fontSize: 24,
                                color: COLORS.neonBlueSoft,
                                filter: `drop-shadow(0 0 6px ${alpha(COLORS.neonBlue, 0.6)})`,
                            }}
                        />
                    </Box>

                    {/* Тег */}
                    <Typography
                        variant="caption"
                        sx={{
                            color: alpha(COLORS.neonBlueSoft, 0.5),
                            letterSpacing: '0.15em',
                            fontSize: '0.65rem',
                        }}
                    >
                        {point.tag}
                    </Typography>
                </Box>

                {/* Заголовок */}
                <Typography
                    variant="h4"
                    sx={{
                        color: COLORS.textPrimary,
                        fontWeight: 700,
                        lineHeight: 1.3,
                    }}
                >
                    {point.title}
                </Typography>

                {/* Разделитель */}
                <Box
                    sx={{
                        height: '1px',
                        background: `linear-gradient(90deg,
              ${alpha(COLORS.neonBlue, 0.4)},
              transparent
            )`,
                    }}
                />

                {/* Описание */}
                <Typography
                    variant="body2"
                    sx={{
                        color: COLORS.textSecondary,
                        lineHeight: 1.75,
                        flexGrow: 1,
                    }}
                >
                    {point.description}
                </Typography>

                {/* Нижний декор — "сканирующий" блик при hover */}
                <Box
                    sx={{
                        height: '2px',
                        borderRadius: '2px',
                        background: `linear-gradient(90deg,
              transparent,
              ${alpha(COLORS.neonBlue, 0.6)},
              transparent
            )`,
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        '.glass-panel:hover &': {
                            opacity: 1,
                        },
                    }}
                />
            </Box>
        </motion.div>
    )
}
