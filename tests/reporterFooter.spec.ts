import { describe, expect, test } from 'vitest'

import { lexicalToPlaintext } from '../src/utilities/lexicalToPlaintext.js'
import { appendReporterFooter } from '../src/utilities/reporterFooter.js'

describe('appendReporterFooter', () => {
  test('appends name and email', () => {
    expect(
      appendReporterFooter('Something **broke**', { name: 'Ada', email: 'ada@example.com' }),
    ).toBe('Something **broke**\n\n---\n\nReported by Ada (ada@example.com)')
  })

  test('returns markdown unchanged without a reporter', () => {
    expect(appendReporterFooter('  just text  ')).toBe('just text')
  })
})

describe('lexicalToPlaintext', () => {
  test('walks text nodes', () => {
    const state = {
      root: {
        children: [
          {
            children: [
              { text: 'Hello ', type: 'text' },
              { text: 'world', type: 'text' },
            ],
            type: 'paragraph',
          },
        ],
        type: 'root',
      },
    }

    expect(lexicalToPlaintext(state)).toBe('Hello world')
  })
})
