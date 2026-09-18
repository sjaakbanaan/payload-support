import type { Config, Plugin } from 'payload'

import { deepMergeSimple } from 'payload/shared'

import type { PayloadSupportPluginConfig } from './types.js'

import { createSupportReportsCollection } from './collections/supportReports.js'
import { sanitizePluginConfig } from './defaults.js'
import { translations } from './translations/index.js'

export const payloadSupportPlugin =
  (pluginOptions: PayloadSupportPluginConfig = {}): Plugin =>
  (incomingConfig: Config): Config => {
    incomingConfig.i18n ??= {}
    incomingConfig.i18n.translations = deepMergeSimple(
      translations,
      incomingConfig.i18n.translations ?? {},
    )

    const options = sanitizePluginConfig(pluginOptions)
    const supportReports = createSupportReportsCollection(options)

    return {
      ...incomingConfig,
      collections: [...(incomingConfig.collections || []), supportReports],
    }
  }
