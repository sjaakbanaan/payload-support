import { describe, expect, test, vi } from 'vitest'

import {
  createShortcutAdapter,
  createShortcutStory,
  getShortcutStory,
  listWorkflowStates,
  resolveWorkflowState,
  ShortcutApiError,
} from '../src/providers/shortcut.js'

const token = 'test-token'
const templateId = '66703692-42a0-457d-b9c0-34e04b9a5a07'

describe('resolveWorkflowState', () => {
  test('returns the mapped state or null', () => {
    const states = new Map([
      [500000001, { name: 'Ready for Development', type: 'unstarted' as const }],
    ])
    expect(resolveWorkflowState(500000001, states)).toEqual({
      name: 'Ready for Development',
      type: 'unstarted',
    })
    expect(resolveWorkflowState(999, states)).toBeNull()
    expect(resolveWorkflowState(undefined, states)).toBeNull()
  })
})

describe('listWorkflowStates', () => {
  test('flattens workflow states into an id → name + type map', async () => {
    const fetchImpl = vi.fn<typeof fetch>((url) => {
      expect(url).toBe('https://api.app.shortcut.com/api/v3/workflows')
      return Promise.resolve(
        new Response(
          JSON.stringify([
            {
              states: [
                { id: 1, name: 'Backlog', type: 'backlog' },
                { id: 2, name: 'In Progress', type: 'started' },
              ],
            },
            {
              states: [
                { id: 3, name: 'Done', type: 'done' },
                { id: 4, name: 'Odd', type: 'something-new' },
              ],
            },
          ]),
          { headers: { 'Content-Type': 'application/json' }, status: 200 },
        ),
      )
    })

    const states = await listWorkflowStates({ token }, fetchImpl)
    expect(Object.fromEntries(states)).toEqual({
      1: { name: 'Backlog', type: 'backlog' },
      2: { name: 'In Progress', type: 'started' },
      3: { name: 'Done', type: 'done' },
      4: { name: 'Odd', type: null },
    })
  })
})

describe('getShortcutStory', () => {
  test('returns id, url, and workflowStateId', async () => {
    const fetchImpl = vi.fn<typeof fetch>((url) => {
      expect(url).toBe('https://api.app.shortcut.com/api/v3/stories/555')
      return Promise.resolve(
        new Response(
          JSON.stringify({
            id: 555,
            app_url: 'https://app.shortcut.com/eagerly/story/555',
            workflow_state_id: 2,
          }),
          { headers: { 'Content-Type': 'application/json' }, status: 200 },
        ),
      )
    })

    await expect(getShortcutStory({ token }, '555', fetchImpl)).resolves.toEqual({
      id: '555',
      url: 'https://app.shortcut.com/eagerly/story/555',
      workflowStateId: 2,
    })
  })
})

describe('createShortcutStory', () => {
  test('creates a story from a template and returns id + url + workflowStateId', async () => {
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
            workflow_state_id: 500000001,
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
      workflowStateId: 500000001,
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

describe('createShortcutAdapter', () => {
  test('createBug resolves workflow state name via /workflows', async () => {
    const fetchImpl = vi.fn<typeof fetch>((url) => {
      const href = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url
      if (href.endsWith('/workflows')) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              { states: [{ id: 7, name: 'Ready for Development', type: 'unstarted' }] },
            ]),
            { headers: { 'Content-Type': 'application/json' }, status: 200 },
          ),
        )
      }

      return Promise.resolve(
        new Response(
          JSON.stringify({
            id: 42,
            app_url: 'https://app.shortcut.com/story/42',
            workflow_state_id: 7,
          }),
          { headers: { 'Content-Type': 'application/json' }, status: 201 },
        ),
      )
    })

    const adapter = createShortcutAdapter({ storyType: 'bug', token }, fetchImpl)
    await expect(
      adapter.createBug({ descriptionMarkdown: 'x', title: 'y' }),
    ).resolves.toEqual({
      id: '42',
      url: 'https://app.shortcut.com/story/42',
      workflowState: 'Ready for Development',
      workflowStateType: 'unstarted',
    })
  })
})
