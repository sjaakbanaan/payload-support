import { NAMESPACE } from '../translations/constants.js'
import { en } from '../translations/languages/en.js'

export type TranslateFn = (key: string, vars?: Record<string, unknown>) => string

const reportedByFallback = (who: string): string =>
  en[NAMESPACE].reportedBy.replace('{{who}}', who)

export const appendReporterFooter = (
  markdown: string,
  reporter?: { email?: null | string; name?: null | string },
  t?: TranslateFn,
): string => {
  const name = reporter?.name?.trim()
  const email = reporter?.email?.trim()
  const who = [name, email ? `(${email})` : null].filter(Boolean).join(' ')
  const trimmed = markdown.trim()

  if (!who) {
    return trimmed
  }

  const line = t ? t(`${NAMESPACE}:reportedBy`, { who }) : reportedByFallback(who)

  return [trimmed, '', '---', '', line].join('\n')
}
