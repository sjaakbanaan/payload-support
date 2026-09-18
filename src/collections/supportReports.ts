import type { CollectionConfig, FieldAccess } from 'payload'

import type { SanitizedPayloadSupportConfig } from '../types.js'

import { descriptionEditor } from '../fields/descriptionEditor.js'
import { createExternalTicketHook } from '../hooks/createExternalTicket.js'

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
      defaultColumns: ['title', 'status', 'externalUrl', 'createdAt'],
      description:
        'Creating a report sends a bug to Shortcut. Title and description cannot be changed after it is sent.',
      group: 'Support',
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
        required: true,
      },
      {
        name: 'description',
        type: 'richText',
        access: {
          update: sentIsReadOnly,
        },
        editor: descriptionEditor,
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
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Sent', value: 'sent' },
          { label: 'Failed', value: 'failed' },
        ],
      },
      {
        name: 'externalId',
        type: 'text',
        admin: {
          description: 'Shortcut story ID',
          position: 'sidebar',
          readOnly: true,
        },
      },
      {
        name: 'externalUrl',
        type: 'text',
        admin: {
          description: 'Open this URL in Shortcut',
          position: 'sidebar',
          readOnly: true,
        },
      },
      {
        name: 'errorMessage',
        type: 'textarea',
        admin: {
          condition: (_, siblingData) => siblingData?.status === 'failed',
          position: 'sidebar',
          readOnly: true,
        },
      },
      {
        name: 'reporterName',
        type: 'text',
        admin: {
          position: 'sidebar',
          readOnly: true,
        },
      },
      {
        name: 'reporterEmail',
        type: 'email',
        admin: {
          position: 'sidebar',
          readOnly: true,
        },
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
      plural: 'Support Reports',
      singular: 'Support Report',
    },
    timestamps: true,
  }

  return options.collectionOverrides
    ? options.collectionOverrides({ defaultCollection: collection })
    : collection
}
