import type { CollectionAfterChangeHook, RichTextField } from 'payload'

import type { SanitizedPayloadSupportConfig } from '../types.js'

import { SKIP_SYNC_CONTEXT } from '../defaults.js'
import { createShortcutAdapter } from '../providers/shortcut.js'
import { convertDescriptionToMarkdown } from '../utilities/convertDescription.js'
import { appendReporterFooter } from '../utilities/reporterFooter.js'

const findDescriptionField = (fields: unknown[]): RichTextField | undefined => {
  for (const field of fields) {
    if (
      field &&
      typeof field === 'object' &&
      'name' in field &&
      (field as { name?: string }).name === 'description' &&
      'type' in field &&
      (field as { type?: string }).type === 'richText'
    ) {
      return field as RichTextField
    }
  }
  return undefined
}

export const createExternalTicketHook =
  (options: SanitizedPayloadSupportConfig): CollectionAfterChangeHook =>
  async ({ collection, context, doc, operation, req }) => {
    if (context?.[SKIP_SYNC_CONTEXT]) {
      return doc
    }

    if (operation !== 'create') {
      return doc
    }

    if (!options.enabled || !options.shortcut?.token) {
      return doc
    }

    const descriptionField = findDescriptionField(collection.fields)
    let markdown = await convertDescriptionToMarkdown({
      data: doc.description,
      descriptionField,
      payload: req.payload,
    })

    markdown = appendReporterFooter(markdown, {
      name: doc.reporterName,
      email: doc.reporterEmail,
    })

    const adapter = createShortcutAdapter(options.shortcut)

    try {
      const ticket = await adapter.createBug({
        descriptionMarkdown: markdown,
        externalId: `payload-support:${collection.slug}:${doc.id}`,
        reporter: {
          name: doc.reporterName,
          email: doc.reporterEmail,
        },
        title: doc.title,
      })

      return req.payload.update({
        id: doc.id,
        collection: collection.slug,
        context: { [SKIP_SYNC_CONTEXT]: true },
        data: {
          errorMessage: null,
          externalId: ticket.id,
          externalUrl: ticket.url,
          status: 'sent',
        },
        req,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Shortcut error'
      req.payload.logger.error({ err: error }, 'payload-support: failed to create Shortcut story')

      return req.payload.update({
        id: doc.id,
        collection: collection.slug,
        context: { [SKIP_SYNC_CONTEXT]: true },
        data: {
          errorMessage: message,
          status: 'failed',
        },
        req,
      })
    }
  }
