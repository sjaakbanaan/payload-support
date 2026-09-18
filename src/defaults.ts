import type { PayloadSupportPluginConfig, SanitizedPayloadSupportConfig } from './types.js'

export const DEFAULT_COLLECTION_SLUG = 'support-reports'
export const SKIP_SYNC_CONTEXT = 'payload-support-skip-sync'

export const sanitizePluginConfig = (
  options: PayloadSupportPluginConfig = {},
): SanitizedPayloadSupportConfig => {
  const enabled = options.enabled !== false && options.disabled !== true

  return {
    access: options.access,
    collectionOverrides: options.collectionOverrides,
    collectionSlug: options.collectionSlug ?? DEFAULT_COLLECTION_SLUG,
    enabled,
    provider: options.provider ?? 'shortcut',
    shortcut: options.shortcut,
  }
}
