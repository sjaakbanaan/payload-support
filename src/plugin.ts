import type { Config, Plugin } from 'payload'

import type { PayloadSupportPluginConfig } from './types.js'

import { createSupportReportsCollection } from './collections/supportReports.js'
import { sanitizePluginConfig } from './defaults.js'

export const payloadSupportPlugin =
  (pluginOptions: PayloadSupportPluginConfig = {}): Plugin =>
  (config: Config): Config => {
    const options = sanitizePluginConfig(pluginOptions)
    const supportReports = createSupportReportsCollection(options)

    return {
      ...config,
      collections: [...(config.collections || []), supportReports],
    }
  }
