import type { TaskConfig } from 'payload'

import type { SanitizedPayloadSupportConfig } from '../types.js'

import {
  SKIP_SYNC_CONTEXT,
  STATE_SYNC_CRON,
  STATE_SYNC_QUEUE,
  STATE_SYNC_TASK_SLUG,
} from '../defaults.js'
import { createShortcutAdapter, resolveWorkflowStateName } from '../providers/shortcut.js'

type SyncOutput = {
  checked: number
  failed: number
  updated: number
}

export const createSyncExternalStateTask = (
  options: SanitizedPayloadSupportConfig,
): TaskConfig<{
  input: Record<string, never>
  output: SyncOutput
}> => ({
  slug: STATE_SYNC_TASK_SLUG,
  handler: async ({ req }) => {
    const empty: SyncOutput = { checked: 0, failed: 0, updated: 0 }

    if (!options.enabled || !options.shortcut?.token) {
      return { output: empty }
    }

    const adapter = createShortcutAdapter(options.shortcut)
    const states = await adapter.listWorkflowStates()

    let checked = 0
    let updated = 0
    let failed = 0
    let page = 1
    let hasNextPage = true

    while (hasNextPage) {
      const result = await req.payload.find({
        collection: options.collectionSlug,
        limit: 50,
        page,
        pagination: true,
        where: {
          and: [{ status: { equals: 'sent' } }, { externalId: { exists: true } }],
        },
      })

      for (const doc of result.docs) {
        const externalId =
          typeof doc.externalId === 'string' && doc.externalId ? doc.externalId : null
        if (!externalId) {
          continue
        }

        checked += 1

        try {
          const story = await adapter.getStory(externalId)
          const nextState = resolveWorkflowStateName(story.workflowStateId, states)
          const currentState =
            typeof doc.externalState === 'string' || doc.externalState === null
              ? doc.externalState
              : null

          if (nextState === currentState) {
            continue
          }

          await req.payload.update({
            id: doc.id,
            collection: options.collectionSlug,
            context: { [SKIP_SYNC_CONTEXT]: true },
            data: {
              externalState: nextState,
            },
            req,
          })
          updated += 1
        } catch (error) {
          failed += 1
          req.payload.logger.error(
            { err: error, externalId, reportId: doc.id },
            'payload-support: failed to sync Shortcut state',
          )
        }
      }

      hasNextPage = result.hasNextPage
      page += 1
    }

    return {
      output: { checked, failed, updated },
    }
  },
  label: 'Sync support report Shortcut states',
  outputSchema: [
    { name: 'checked', type: 'number' },
    { name: 'updated', type: 'number' },
    { name: 'failed', type: 'number' },
  ],
  schedule: [
    {
      cron: STATE_SYNC_CRON,
      queue: STATE_SYNC_QUEUE,
    },
  ],
})
