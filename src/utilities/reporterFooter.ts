export const appendReporterFooter = (
  markdown: string,
  reporter?: { email?: null | string; name?: null | string },
): string => {
  const name = reporter?.name?.trim()
  const email = reporter?.email?.trim()
  const who = [name, email ? `(${email})` : null].filter(Boolean).join(' ')
  const trimmed = markdown.trim()

  if (!who) {
    return trimmed
  }

  return [trimmed, '', '---', '', `Reported by ${who}`].join('\n')
}
