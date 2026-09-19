import type { Payload } from 'payload'
import type { PayloadSupportTranslations } from 'payload-support'

import config from '@payload-config'
import { getPayload } from 'payload'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'

import type { SupportReport } from './payload-types.js'

let payload: Payload

afterAll(async () => {
  await payload?.destroy()
})

beforeAll(async () => {
  payload = await getPayload({ config })
})

const boldDescription: SupportReport['description'] = {
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            detail: 0,
            format: 1,
            mode: 'normal',
            style: '',
            text: 'The button is broken',
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

const pluginI18n = (lang: 'en' | 'nl') =>
  (payload.config.i18n.translations?.[lang] as PayloadSupportTranslations | undefined)?.[
    'plugin-payload-support'
  ]

describe('payload-support', () => {
  test('adds the support-reports collection', () => {
    const collection = payload.collections['support-reports']
    expect(collection).toBeDefined()
    expect(collection.config.admin.defaultColumns).toEqual([
      'title',
      'reporterName',
      'reporterEmail',
      'externalState',
      'externalUrl',
      'createdAt',
    ])

    expect(payload.config.jobs?.tasks?.some((task) => task.slug === 'syncSupportReportStates')).toBe(
      true,
    )

    const externalUrl = collection.config.fields.find(
      (field) => 'name' in field && field.name === 'externalUrl',
    )
    expect(
      externalUrl && 'admin' in externalUrl ? externalUrl.admin?.components : undefined,
    ).toMatchObject({
      Cell: 'payload-support/rsc#ExternalUrlCell',
      Field: 'payload-support/rsc#ExternalUrlField',
    })
  })

  test('merges English and Dutch plugin translations', () => {
    expect(pluginI18n('en')).toMatchObject({
      plural: 'Support Reports',
      singular: 'Support Report',
    })
    expect(pluginI18n('nl')).toMatchObject({
      singular: 'Supportmelding',
    })
  })

  test('creates a Shortcut bug from a support report', async () => {
    const shortcutFetch = vi.fn<typeof fetch>((url) => {
      const href = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url
      if (href.endsWith('/workflows')) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              { states: [{ id: 9, name: 'Ready for Development', type: 'unstarted' }] },
            ]),
            { headers: { 'Content-Type': 'application/json' }, status: 200 },
          ),
        )
      }

      return Promise.resolve(
        new Response(
          JSON.stringify({
            id: 555,
            app_url: 'https://app.shortcut.com/eagerly/story/555',
            workflow_state_id: 9,
          }),
          { headers: { 'Content-Type': 'application/json' }, status: 201 },
        ),
      )
    })

    vi.stubGlobal('fetch', shortcutFetch)

    try {
      const report = await payload.create({
        collection: 'support-reports',
        data: {
          description: boldDescription,
          reporterEmail: 'dev@payloadcms.com',
          reporterName: 'Test User',
          title: 'Checkout fails',
        },
      })

      expect(shortcutFetch).toHaveBeenCalled()
      expect(report.status).toBe('sent')
      expect(report.externalId).toBe('555')
      expect(report.externalUrl).toBe('https://app.shortcut.com/eagerly/story/555')
      expect(report.externalState).toBe('Ready for Development')
      expect(report.externalStateType).toBe('unstarted')

      const createCall = shortcutFetch.mock.calls.find(([requestUrl]) => {
        const href =
          typeof requestUrl === 'string'
            ? requestUrl
            : requestUrl instanceof URL
              ? requestUrl.href
              : requestUrl.url
        return href.includes('/stories')
      })
      const rawBody = createCall?.[1]?.body
      if (typeof rawBody !== 'string') {
        throw new Error('expected fetch body to be a string')
      }

      const body = JSON.parse(rawBody)
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
