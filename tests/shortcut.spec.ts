import { describe, expect, test, vi } from 'vitest'

import { createShortcutStory, ShortcutApiError } from '../src/providers/shortcut.js'

const token = 'test-token'
const templateId = '66703692-42a0-457d-b9c0-34e04b9a5a07'

describe('createShortcutStory', () => {
  test('creates a story from a template and returns id + url', async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toBe('https://api.app.shortcut.com/api/v3/stories/from-template')
      expect(init?.method).toBe('POST')
      expect((init?.headers as Record<string, string>)['Shortcut-Token']).toBe(token)

      const body = JSON.parse(String(init?.body))
      expect(body).toMatchObject({
        name: 'Login is broken',
        description: '**Bold** bug',
        story_type: 'bug',
        story_template_id: templateId,
        external_id: 'payload-support:support-reports:1',
      })

      return new Response(
        JSON.stringify({
          id: 12345,
          app_url: 'https://app.shortcut.com/eagerly/story/12345',
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      )
    }) as unknown as typeof fetch

    const result = await createShortcutStory(
      {
        token,
        storyTemplateId: templateId,
        storyType: 'bug',
      },
      {
        title: 'Login is broken',
        descriptionMarkdown: '**Bold** bug',
        externalId: 'payload-support:support-reports:1',
      },
      fetchImpl,
    )

    expect(result).toEqual({
      id: '12345',
      url: 'https://app.shortcut.com/eagerly/story/12345',
    })
    expect(fetchImpl).toHaveBeenCalledOnce()
  })

  test('posts to /stories when no template is configured', async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      expect(String(url)).toBe('https://api.app.shortcut.com/api/v3/stories')
      return new Response(JSON.stringify({ id: 99 }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    }) as unknown as typeof fetch

    const result = await createShortcutStory(
      { token, storyType: 'bug', epicId: 42, ownerIds: ['owner-uuid'] },
      { title: 'No template', descriptionMarkdown: 'plain' },
      fetchImpl,
    )

    expect(result.id).toBe('99')
    expect(result.url).toBe('https://app.shortcut.com/story/99')
  })

  test('throws ShortcutApiError on non-OK responses', async () => {
    const fetchImpl = vi.fn(
      async () => new Response('nope', { status: 401 }),
    ) as unknown as typeof fetch

    await expect(
      createShortcutStory(
        { token, storyTemplateId: templateId },
        { title: 'Fail', descriptionMarkdown: 'fail' },
        fetchImpl,
      ),
    ).rejects.toBeInstanceOf(ShortcutApiError)
  })
})
