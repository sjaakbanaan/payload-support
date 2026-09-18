export { DEFAULT_COLLECTION_SLUG, sanitizePluginConfig } from './defaults.js'
export { descriptionEditor } from './fields/descriptionEditor.js'
export { payloadSupportPlugin } from './plugin.js'
export { payloadSupportPlugin as payloadSupport } from './plugin.js'
export { createShortcutAdapter, createShortcutStory, ShortcutApiError } from './providers/shortcut.js'
export {
  type PayloadSupportTranslationKeys,
  type PayloadSupportTranslations,
  translations as payloadSupportTranslations,
} from './translations/index.js'
export type {
  CollectionOverride,
  CreateBugInput,
  CreatedTicket,
  PayloadSupportPluginConfig,
  SanitizedPayloadSupportConfig,
  ShortcutProviderConfig,
  ShortcutStoryType,
  SupportProviderAdapter,
} from './types.js'
export { convertDescriptionToMarkdown } from './utilities/convertDescription.js'

export { appendReporterFooter } from './utilities/reporterFooter.js'
