import type { PayloadRequest } from 'payload'

import { describe, expect, test, vi } from 'vitest'

import { createSyncExternalStateTask } from '../src/jobs/syncExternalState.js'

describe('createSyncExternalStateTask', () => {
  test('updates externalState only when Shortcut state changed', async () => {
    const update = vi.fn()
    const find = vi
      .fn()
      .mockResolvedValueOnce({
        docs: [
          { id: '1', externalId: '101', externalState: 'Backlog', externalStateType: 'backlog' },
          {
            id: '2',
            externalId: '102',
            externalState: 'In Progress',
            externalStateType: 'started',
          },
          { id: '3', externalId: '103', externalState: 'Done', externalStateType: 'done' },
        ],
        hasNextPage: false,
      })
      .mockResolvedValue({ docs: [], hasNextPage: false })

    const fetchImpl = vi.fn<typeof fetch>((url) => {
      const href = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url
      if (href.endsWith('/workflows')) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              {
                states: [
                  { id: 1, name: 'Backlog', type: 'backlog' },
                  { id: 2, name: 'In Progress', type: 'started' },
                  { id: 3, name: 'Done', type: 'done' },
                ],
              },
            ]),
            { headers: { 'Content-Type': 'application/json' }, status: 200 },
          ),
        )
      }

      if (href.endsWith('/stories/101')) {
        return Promise.resolve(
          new Response(JSON.stringify({ id: 101, workflow_state_id: 2 }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
          }),
        )
      }

      if (href.endsWith('/stories/102')) {
        return Promise.resolve(
          new Response(JSON.stringify({ id: 102, workflow_state_id: 2 }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
          }),
        )
      }

      if (href.endsWith('/stories/103')) {
        return Promise.resolve(new Response('missing', { status: 404 }))
      }

      throw new Error(`unexpected url: ${href}`)
    })

    vi.stubGlobal('fetch', fetchImpl)

    try {
      const task = createSyncExternalStateTask({
        collectionSlug: 'support-reports',
        enabled: true,
        provider: 'shortcut',
        shortcut: { token: 'test-token' },
      })

      if (typeof task.handler !== 'function') {
        throw new Error('expected inline task handler')
      }

      const result = await task.handler({
        inlineTask: vi.fn(),
        input: {},
        job: {} as never,
        req: {
          payload: {
            find,
            logger: { error: vi.fn() },
            update,
          },
        } as unknown as PayloadRequest,
        tasks: {} as never,
      })

      expect(result).toEqual({
        output: { checked: 3, failed: 1, updated: 1 },
      })
      expect(update).toHaveBeenCalledOnce()
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          data: { externalState: 'In Progress', externalStateType: 'started' },
        }),
      )
    } finally {
      vi.unstubAllGlobals()
    }
  })

  test('no-ops when plugin is disabled', async () => {
    const task = createSyncExternalStateTask({
      collectionSlug: 'support-reports',
      enabled: false,
      provider: 'shortcut',
      shortcut: { token: 'test-token' },
    })

    if (typeof task.handler !== 'function') {
      throw new Error('expected inline task handler')
    }

    await expect(
      task.handler({
        inlineTask: vi.fn(),
        input: {},
        job: {} as never,
        req: { payload: { find: vi.fn() } } as unknown as PayloadRequest,
        tasks: {} as never,
      }),
    ).resolves.toEqual({
      output: { checked: 0, failed: 0, updated: 0 },
    })
  })
})
