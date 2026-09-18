import type { Payload } from 'payload'

import config from '@payload-config'
import { getPayload } from 'payload'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'

let payload: Payload

afterAll(async () => {
  await payload.destroy()
})

beforeAll(async () => {
  payload = await getPayload({ config })
})

const boldDescription = {
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'The button is broken',
            format: 1,
            detail: 0,
            mode: 'normal',
            style: '',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
}

describe('payload-support', () => {
  test('adds the support-reports collection', () => {
    expect(payload.collections['support-reports']).toBeDefined()
  })

  test('creates a Shortcut bug from a support report', async () => {
    const shortcutFetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          id: 555,
          app_url: 'https://app.shortcut.com/eagerly/story/555',
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      )
    })

    vi.stubGlobal('fetch', shortcutFetch)

    try {
      const report = await payload.create({
        collection: 'support-reports',
        data: {
          title: 'Checkout fails',
          description: boldDescription,
          reporterName: 'Test User',
          reporterEmail: 'dev@payloadcms.com',
        },
      })

      expect(shortcutFetch).toHaveBeenCalled()
      expect(report.status).toBe('sent')
      expect(report.externalId).toBe('555')
      expect(report.externalUrl).toBe('https://app.shortcut.com/eagerly/story/555')

      const body = JSON.parse(String(shortcutFetch.mock.calls[0]?.[1]?.body))
      expect(body.story_type).toBe('bug')
      expect(body.story_template_id).toBe('66703692-42a0-457d-b9c0-34e04b9a5a07')
      expect(body.name).toBe('Checkout fails')
      expect(body.description).toContain('The button is broken')
      expect(body.description).toContain('Reported by Test User (dev@payloadcms.com)')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
