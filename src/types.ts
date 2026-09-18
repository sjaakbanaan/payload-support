import type { CollectionConfig } from 'payload'

export type ShortcutStoryType = 'bug' | 'chore' | 'feature'

export type ShortcutProviderConfig = {
  /** Epic to assign. Overrides the template when set. */
  epicId?: number
  /** Team/group UUID. */
  groupId?: string
  /** Owner UUIDs. Overrides the template when set. */
  ownerIds?: string[]
  /**
   * Story template UUID. When set, stories are created via
   * POST /api/v3/stories/from-template and inherit Owner, Epic, Type, etc.
   */
  storyTemplateId?: string
  /**
   * Overrides the template / default story type.
   * @default 'bug'
   */
  storyType?: ShortcutStoryType
  /**
   * Shortcut API token. Workspace is implied by the token.
   * Generate at https://app.shortcut.com/settings/account/api-tokens
   */
  token: string
  /** Workflow state when not using a template (or to override it). */
  workflowStateId?: number
}

export type CreateBugInput = {
  descriptionMarkdown: string
  /**
   * Stored on the Shortcut story as `external_id` for traceability.
   */
  externalId?: string
  reporter?: {
    email?: null | string
    name?: null | string
  }
  title: string
}

export type CreatedTicket = {
  id: string
  url: string
}

export type SupportProviderAdapter = {
  createBug: (input: CreateBugInput) => Promise<CreatedTicket>
}

export type CollectionOverride = (args: {
  defaultCollection: CollectionConfig
}) => CollectionConfig

export type PayloadSupportPluginConfig = {
  /**
   * Override collection-level access. Default: authenticated users.
   */
  access?: CollectionConfig['access']
  /**
   * Replace or extend the default collection config.
   */
  collectionOverrides?: CollectionOverride
  /**
   * Collection slug for bug reports.
   * @default 'support-reports'
   */
  collectionSlug?: string
  /**
   * Alias of `enabled: false` (Payload plugin template convention).
   */
  disabled?: boolean
  /**
   * When false, the collection is still registered (schema stays stable)
   * but hidden in admin and Shortcut sync is skipped.
   * @default true
   */
  enabled?: boolean
  /**
   * Support provider. Only Shortcut is implemented in this beta.
   * @default 'shortcut'
   */
  provider?: 'shortcut'
  shortcut?: ShortcutProviderConfig
}

export type SanitizedPayloadSupportConfig = {
  access?: CollectionConfig['access']
  collectionOverrides?: CollectionOverride
  collectionSlug: string
  enabled: boolean
  provider: 'shortcut'
  shortcut?: ShortcutProviderConfig
}
