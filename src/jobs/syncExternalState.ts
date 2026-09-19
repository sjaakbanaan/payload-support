import type { CollectionSlug, TaskConfig } from 'payload'

import type { ShortcutWorkflowStateType } from '../providers/shortcut.js'
import type { SanitizedPayloadSupportConfig } from '../types.js'

import {
  SKIP_SYNC_CONTEXT,
  STATE_SYNC_CRON,
  STATE_SYNC_QUEUE,
  STATE_SYNC_TASK_SLUG,
} from '../defaults.js'
import { createShortcutAdapter, resolveWorkflowState } from '../providers/shortcut.js'

type SyncOutput = {
  checked: number
  failed: number
  updated: number
}

/** The collection slug is configurable, so generated types cannot describe these docs. */
type SupportReportDoc = {
  externalId?: null | string
  externalState?: null | string
  externalStateType?: null | ShortcutWorkflowStateType
  id: number | string
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
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- CollectionSlug is `string` here, but a literal union in apps with generated types
    const collection = options.collectionSlug as CollectionSlug

    let checked = 0
    let updated = 0
    let failed = 0
    let page = 1
    let hasNextPage = true

    while (hasNextPage) {
      const result = await req.payload.find({
        collection,
        limit: 50,
        page,
        pagination: true,
        where: {
          and: [{ status: { equals: 'sent' } }, { externalId: { exists: true } }],
        },
      })

      for (const doc of result.docs as unknown as SupportReportDoc[]) {
        const externalId =
          typeof doc.externalId === 'string' && doc.externalId ? doc.externalId : null
        if (!externalId) {
          continue
        }

        checked += 1

        try {
          const story = await adapter.getStory(externalId)
          const state = resolveWorkflowState(story.workflowStateId, states)
          const nextState = state?.name ?? null
          const nextStateType = state?.type ?? null

          if (
            nextState === (doc.externalState ?? null) &&
            nextStateType === (doc.externalStateType ?? null)
          ) {
            continue
          }

          await req.payload.update({
            id: doc.id,
            collection,
            context: { [SKIP_SYNC_CONTEXT]: true },
            data: {
              externalState: nextState,
              externalStateType: nextStateType,
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
