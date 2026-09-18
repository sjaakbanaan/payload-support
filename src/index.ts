export { DEFAULT_COLLECTION_SLUG, sanitizePluginConfig, STATE_SYNC_QUEUE } from './defaults.js'
export { descriptionEditor } from './fields/descriptionEditor.js'
export { createSyncExternalStateTask } from './jobs/syncExternalState.js'
export { payloadSupportPlugin } from './plugin.js'
export { payloadSupportPlugin as payloadSupport } from './plugin.js'
export {
  createShortcutAdapter,
  createShortcutStory,
  getShortcutStory,
  listWorkflowStates,
  resolveWorkflowStateName,
  ShortcutApiError,
} from './providers/shortcut.js'
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
