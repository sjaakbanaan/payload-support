type LexicalNode = {
  children?: LexicalNode[]
  root?: LexicalNode
  text?: string
}

export const lexicalToPlaintext = (node: unknown): string => {
  if (!node || typeof node !== 'object') {
    return ''
  }

  const current = node as LexicalNode
  if (current.root) {
    return lexicalToPlaintext(current.root)
  }

  if (typeof current.text === 'string') {
    return current.text
  }

  if (!Array.isArray(current.children)) {
    return ''
  }

  return current.children.map(lexicalToPlaintext).join('')
}
