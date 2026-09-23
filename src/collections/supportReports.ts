import type { CollectionConfig, FieldAccess } from 'payload'

import type { SanitizedPayloadSupportConfig } from '../types.js'

import { descriptionEditor } from '../fields/descriptionEditor.js'
import { createExternalTicketHook } from '../hooks/createExternalTicket.js'
import { NAMESPACE } from '../translations/constants.js'
import { tLabel } from '../translations/index.js'
import { en } from '../translations/languages/en.js'
import { nl } from '../translations/languages/nl.js'

const authenticated = ({ req: { user } }: { req: { user: unknown } }) => Boolean(user)

const sentIsReadOnly: FieldAccess = ({ doc }) => doc?.status !== 'sent'

export const createSupportReportsCollection = (
  options: SanitizedPayloadSupportConfig,
): CollectionConfig => {
  const collection: CollectionConfig = {
    slug: options.collectionSlug,
    access: {
      create: authenticated,
      delete: authenticated,
      read: authenticated,
      update: authenticated,
      ...options.access,
    },
    admin: {
      defaultColumns: [
        'title',
        'reporterName',
        'reporterEmail',
        'externalState',
        'externalUrl',
        'createdAt',
      ],
      description: tLabel('description') as NonNullable<CollectionConfig['admin']>['description'],
      // Keep the edit view, but don't send list users there — tickets live in Shortcut.
      formatDocURL: () => null,
      group: {
        en: en[NAMESPACE].group,
        nl: nl[NAMESPACE].group,
      },
      hidden: !options.enabled,
      useAsTitle: 'title',
    },
    fields: [
      {
        name: 'title',
        type: 'text',
        access: {
          update: sentIsReadOnly,
        },
        label: tLabel('title'),
        required: true,
      },
      {
        name: 'description',
        type: 'richText',
        access: {
          update: sentIsReadOnly,
        },
        editor: descriptionEditor,
        label: tLabel('descriptionField'),
        required: true,
      },
      {
        name: 'status',
        type: 'select',
        admin: {
          position: 'sidebar',
          readOnly: true,
        },
        defaultValue: 'pending',
        label: tLabel('status'),
        options: [
          { label: tLabel('statusPending'), value: 'pending' },
          { label: tLabel('statusSent'), value: 'sent' },
          { label: tLabel('statusFailed'), value: 'failed' },
        ],
      },
      {
        name: 'externalId',
        type: 'text',
        admin: {
          description: tLabel('externalIdDescription'),
          position: 'sidebar',
          readOnly: true,
        },
        label: tLabel('externalId'),
      },
      {
        name: 'externalState',
        type: 'text',
        admin: {
          components: {
            Cell: 'payload-support/rsc#ExternalStateCell',
            Field: 'payload-support/rsc#ExternalStateField',
          },
          position: 'sidebar',
          readOnly: true,
        },
        label: tLabel('externalState'),
      },
      {
        // Drives the colour of the externalState cell; not shown on its own.
        name: 'externalStateType',
        type: 'select',
        admin: {
          hidden: true,
        },
        label: tLabel('externalStateType'),
        options: [
          { label: 'Backlog', value: 'backlog' },
          { label: 'Unstarted', value: 'unstarted' },
          { label: 'Started', value: 'started' },
          { label: 'Done', value: 'done' },
        ],
      },
      {
        name: 'externalUrl',
        type: 'text',
        admin: {
          components: {
            Cell: 'payload-support/rsc#ExternalUrlCell',
            Field: 'payload-support/rsc#ExternalUrlField',
          },
          description: tLabel('externalUrlDescription'),
          position: 'sidebar',
          readOnly: true,
        },
        label: tLabel('externalUrl'),
      },
      {
        name: 'errorMessage',
        type: 'textarea',
        admin: {
          condition: (_, siblingData) => siblingData?.status === 'failed',
          position: 'sidebar',
          readOnly: true,
        },
        label: tLabel('errorMessage'),
      },
      {
        name: 'reporterName',
        type: 'text',
        admin: {
          position: 'sidebar',
          readOnly: true,
        },
        label: tLabel('reporterName'),
      },
      {
        name: 'reporterEmail',
        type: 'email',
        admin: {
          position: 'sidebar',
          readOnly: true,
        },
        label: tLabel('reporterEmail'),
      },
    ],
    hooks: {
      afterChange: options.enabled ? [createExternalTicketHook(options)] : [],
      beforeChange: [
        ({ data, operation, req }) => {
          if (operation !== 'create' || !data) {
            return data
          }

          const user = req.user as { email?: string; name?: string } | null
          if (!user) {
            return data
          }

          return {
            ...data,
            reporterEmail: data.reporterEmail || user.email,
            reporterName: data.reporterName || user.name || user.email,
            status: data.status || 'pending',
          }
        },
      ],
    },
    labels: {
      plural: tLabel('plural'),
      singular: tLabel('singular'),
    },
    timestamps: true,
    // Payload 4 enables versions by default. Reports are a write-once log, so keep the previous schema.
    versions: false,
  }

  return options.collectionOverrides
    ? options.collectionOverrides({ defaultCollection: collection })
    : collection
}
