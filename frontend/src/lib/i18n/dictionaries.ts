import en from '@/locales/en/common.json';
import hi from '@/locales/hi/common.json';
import mr from '@/locales/mr/common.json';
import bn from '@/locales/bn/common.json';
import gu from '@/locales/gu/common.json';
import ta from '@/locales/ta/common.json';
import te from '@/locales/te/common.json';
import kn from '@/locales/kn/common.json';
import ml from '@/locales/ml/common.json';
import pa from '@/locales/pa/common.json';
import as from '@/locales/as/common.json';
import or from '@/locales/or/common.json';
import { LANGUAGES } from '@/lib/validators';

export type LangCode = (typeof LANGUAGES)[number]['code'];
export type Dictionary = typeof en;

/**
 * All 12 dictionaries are bundled statically (they're small JSON files) so switching languages
 * is instant with no extra network request and works the same in every part of the app.
 */
export const DICTIONARIES: Record<LangCode, Dictionary> = { en, hi, mr, bn, gu, ta, te, kn, ml, pa, as, or };

export const DEFAULT_LANG: LangCode = 'en';
