import { describe, expect, test } from 'vitest'

import { lexicalToPlaintext } from '../src/utilities/lexicalToPlaintext.js'
import { appendReporterFooter, type TranslateFn } from '../src/utilities/reporterFooter.js'

describe('appendReporterFooter', () => {
  test('appends name and email', () => {
    expect(
      appendReporterFooter('Something **broke**', { name: 'Ada', email: 'ada@example.com' }),
    ).toBe('Something **broke**\n\n---\n\nReported by Ada (ada@example.com)')
  })

  test('uses t() interpolation when provided', () => {
    const t: TranslateFn = (key, vars) => {
      const who = typeof vars?.who === 'string' ? vars.who : ''
      return key === 'plugin-payload-support:reportedBy' ? `Gemeld door ${who}` : key
    }

    expect(
      appendReporterFooter('Something **broke**', { name: 'Ada', email: 'ada@example.com' }, t),
    ).toBe('Something **broke**\n\n---\n\nGemeld door Ada (ada@example.com)')
  })

  test('returns markdown unchanged without a reporter', () => {
    expect(appendReporterFooter('  just text  ')).toBe('just text')
  })
})

describe('lexicalToPlaintext', () => {
  test('walks text nodes', () => {
    const state = {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', text: 'Hello ' },
              { type: 'text', text: 'world' },
            ],
          },
        ],
      },
    }

    expect(lexicalToPlaintext(state)).toBe('Hello world')
  })
})
