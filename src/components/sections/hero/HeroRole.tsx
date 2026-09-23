import { Box, Typography } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { alpha } from '@mui/material/styles'
import { type Role, useQueryRole } from '../../../hooks/useQueryRole'
import { COLORS } from '../../../theme/theme'
import { useLocale } from '../../../i18n/locale'

// Описание под каждой ролью
const ROLE_DESCRIPTIONS: Record<Role, string> = {
    frontend: 'React · Next.js · TypeScript · Web Components',
    fullstack: 'React · Go · TypeScript · PostgreSQL · MongoDB',
    backend: 'Go · Echo · PostgreSQL · MongoDB · REST API',
}

export const HeroRole = () => {
    const { role, setRole, roles, roleLabels } = useQueryRole()
    const { t } = useLocale()

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Переключатель ролей */}
            <Box
                sx={{
                    display: 'flex',
                    gap: 0.5,
                    background: alpha(COLORS.bgElevated, 0.8),
                    borderRadius: '12px',
                    padding: '4px',
                    border: `1px solid ${COLORS.glassBorder}`,
                    width: 'fit-content',
                }}
            >
                {roles.map((r) => (
                    <Box
                        key={r}
                        onClick={() => setRole(r)}
                        sx={{
                            position: 'relative',
                            cursor: 'pointer',
                            padding: '8px 20px',
                            borderRadius: '9px',
                            userSelect: 'none',
                            transition: 'color 0.2s ease',
                            color:
                                role === r
                                    ? COLORS.textPrimary
                                    : COLORS.textSecondary,
                            '&:hover': {
                                color:
                                    role === r
                                        ? COLORS.textPrimary
                                        : alpha(COLORS.textPrimary, 0.7),
                            },
                        }}
                    >
                        {/* Активный фон (sliding pill) */}
                        {role === r && (
                            <motion.div
                                layoutId="role-pill"
                                transition={{
                                    type: 'spring',
                                    stiffness: 380,
                                    damping: 30,
                                }}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    borderRadius: '9px',
                                    background: `linear-gradient(135deg,
                    ${alpha(COLORS.neonBlue, 0.3)},
                    ${alpha(COLORS.neonBlueSoft, 0.2)}
                  )`,
                                    border: `1px solid ${alpha(COLORS.neonBlue, 0.5)}`,
                                    boxShadow: `0 0 12px ${alpha(COLORS.neonBlue, 0.2)}`,
                                }}
                            />
                        )}

                        <Typography
                            variant="body2"
                            sx={{
                                position: 'relative',
                                zIndex: 1,
                                fontWeight: role === r ? 700 : 500,
                                fontSize: '0.85rem',
                            }}
                        >
                            {t.hero.roles[r] ?? roleLabels[r]}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* Описание активной роли */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={role}
                    initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            color: COLORS.textSecondary,
                            fontWeight: 500,
                            fontSize: '0.85rem',
                        }}
                    >
                        {ROLE_DESCRIPTIONS[role]}
                    </Typography>
                </motion.div>
            </AnimatePresence>
        </Box>
    )
}
