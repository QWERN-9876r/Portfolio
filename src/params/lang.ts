import type { ParamMatcher } from '@sveltejs/kit'
import { isLocale } from '$lib/i18n/translations'

export const match = ((param) => isLocale(param)) satisfies ParamMatcher
