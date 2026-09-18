import type { LabelFunction } from 'payload'

import { NAMESPACE } from './constants.js'
import { en } from './languages/en.js'
import { nl } from './languages/nl.js'

export { NAMESPACE } from './constants.js'

export const translations = {
  en,
  nl,
}

export type PayloadSupportTranslations = typeof en
export type PayloadSupportTranslationKeys =
  `${typeof NAMESPACE}:${keyof (typeof en)[typeof NAMESPACE]}`

export const tLabel =
  (key: keyof (typeof en)[typeof NAMESPACE]): LabelFunction =>
  ({ t }) =>
    t(`${NAMESPACE}:${key}` as Parameters<typeof t>[0])
