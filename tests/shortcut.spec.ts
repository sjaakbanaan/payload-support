import { describe, expect, test, vi } from 'vitest'

import { createShortcutStory, ShortcutApiError } from '../src/providers/shortcut.js'

const token = 'test-token'
const templateId = '66703692-42a0-457d-b9c0-34e04b9a5a07'

describe('createShortcutStory', () => {
  test('creates a story from a template and returns id + url', async () => {
    const fetchImpl = vi.fn<typeof fetch>((url, init) => {
      expect(url).toBe('https://api.app.shortcut.com/api/v3/stories/from-template')
      expect(init?.method).toBe('POST')
      expect((init?.headers as Record<string, string>)['Shortcut-Token']).toBe(token)

      const rawBody = init?.body
      if (typeof rawBody !== 'string') {
        throw new Error('expected fetch body to be a string')
      }

      const body = JSON.parse(rawBody)
      expect(body).toMatchObject({
        name: 'Login is broken',
        description: '**Bold** bug',
        external_id: 'payload-support:support-reports:1',
        story_template_id: templateId,
        story_type: 'bug',
      })

      return Promise.resolve(
        new Response(
          JSON.stringify({
            id: 12345,
            app_url: 'https://app.shortcut.com/eagerly/story/12345',
          }),
          { headers: { 'Content-Type': 'application/json' }, status: 201 },
        ),
      )
    })

    const result = await createShortcutStory(
      {
        storyTemplateId: templateId,
        storyType: 'bug',
        token,
      },
      {
        descriptionMarkdown: '**Bold** bug',
        externalId: 'payload-support:support-reports:1',
        title: 'Login is broken',
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
    const fetchImpl = vi.fn<typeof fetch>((url) => {
      expect(url).toBe('https://api.app.shortcut.com/api/v3/stories')
      return Promise.resolve(
        new Response(JSON.stringify({ id: 99 }), {
          headers: { 'Content-Type': 'application/json' },
          status: 201,
        }),
      )
    })

    const result = await createShortcutStory(
      { epicId: 42, ownerIds: ['owner-uuid'], storyType: 'bug', token },
      { descriptionMarkdown: 'plain', title: 'No template' },
      fetchImpl,
    )

    expect(result.id).toBe('99')
    expect(result.url).toBe('https://app.shortcut.com/story/99')
  })

  test('throws ShortcutApiError on non-OK responses', async () => {
    const fetchImpl = vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response('nope', { status: 401 })),
    )

    await expect(
      createShortcutStory(
        { storyTemplateId: templateId, token },
        { descriptionMarkdown: 'fail', title: 'Fail' },
        fetchImpl,
      ),
    ).rejects.toBeInstanceOf(ShortcutApiError)
  })
})
