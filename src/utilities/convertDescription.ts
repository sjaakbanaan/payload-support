import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { Payload, RichTextField } from 'payload'

import { convertLexicalToMarkdown, editorConfigFactory } from '@payloadcms/richtext-lexical'

import { lexicalToPlaintext } from './lexicalToPlaintext.js'

export const convertDescriptionToMarkdown = async ({
  data,
  descriptionField,
  payload,
}: {
  data: unknown
  descriptionField?: RichTextField
  payload: Payload
}): Promise<string> => {
  if (!data || typeof data !== 'object') {
    return ''
  }

  try {
    const editorConfig = descriptionField
      ? editorConfigFactory.fromField({ field: descriptionField })
      : await editorConfigFactory.default({ config: payload.config })

    return convertLexicalToMarkdown({
      data: data as SerializedEditorState,
      editorConfig,
    })
  } catch {
    return lexicalToPlaintext(data)
  }
}
