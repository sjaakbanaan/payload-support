import {
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  ItalicFeature,
  lexicalEditor,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnderlineFeature,
  UnorderedListFeature,
} from '@payloadcms/richtext-lexical'

/**
 * Markdown-safe Lexical subset so bold/italic/lists/links survive conversion
 * into Shortcut's markdown editor.
 */
export const descriptionEditor = lexicalEditor({
  features: [
    ParagraphFeature(),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
    UnorderedListFeature(),
    OrderedListFeature(),
    LinkFeature(),
    FixedToolbarFeature(),
  ],
})
