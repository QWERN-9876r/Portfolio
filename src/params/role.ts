import type { ParamMatcher } from '@sveltejs/kit'
import { DEFAULT_ROLE, isRole } from '$lib/role'

// Роль по умолчанию — без сегмента, чтобы не было дубля /en и /en/frontend
export const match = ((param) => isRole(param) && param !== DEFAULT_ROLE) satisfies ParamMatcher
