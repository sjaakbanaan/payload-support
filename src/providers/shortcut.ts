import type { CreateBugInput, CreatedTicket, ShortcutProviderConfig } from '../types.js'

const SHORTCUT_API = 'https://api.app.shortcut.com/api/v3'

export type FetchLike = typeof fetch

type ShortcutStoryResponse = {
  app_url?: string
  id?: number | string
}

export class ShortcutApiError extends Error {
  readonly body: string
  readonly status: number

  constructor(status: number, body: string) {
    super(`Shortcut API ${status}: ${body}`)
    this.name = 'ShortcutApiError'
    this.status = status
    this.body = body
  }
}

export const createShortcutStory = async (
  config: ShortcutProviderConfig,
  input: CreateBugInput,
  fetchImpl: FetchLike = fetch,
): Promise<CreatedTicket> => {
  const body: Record<string, unknown> = {
    name: input.title,
    description: input.descriptionMarkdown,
    story_type: config.storyType ?? 'bug',
  }

  if (config.storyTemplateId) {
    body.story_template_id = config.storyTemplateId
  }
  if (typeof config.epicId === 'number') {
    body.epic_id = config.epicId
  }
  if (config.ownerIds?.length) {
    body.owner_ids = config.ownerIds
  }
  if (typeof config.workflowStateId === 'number') {
    body.workflow_state_id = config.workflowStateId
  }
  if (config.groupId) {
    body.group_id = config.groupId
  }
  if (input.externalId) {
    body.external_id = input.externalId
  }

  const url = config.storyTemplateId
    ? `${SHORTCUT_API}/stories/from-template`
    : `${SHORTCUT_API}/stories`

  const response = await fetchImpl(url, {
    body: JSON.stringify(body),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Shortcut-Token': config.token,
    },
    method: 'POST',
  })

  const responseText = await response.text()

  if (!response.ok) {
    throw new ShortcutApiError(response.status, responseText)
  }

  let story: ShortcutStoryResponse = {}
  try {
    story = JSON.parse(responseText) as ShortcutStoryResponse
  } catch {
    throw new ShortcutApiError(response.status, 'Invalid JSON response')
  }

  const id = story.id != null ? String(story.id) : ''
  if (!id) {
    throw new ShortcutApiError(response.status, 'Shortcut response was missing a story id')
  }

  return {
    id,
    url: story.app_url || `https://app.shortcut.com/story/${id}`,
  }
}

export const createShortcutAdapter = (config: ShortcutProviderConfig, fetchImpl?: FetchLike) => ({
  createBug: (input: CreateBugInput) => createShortcutStory(config, input, fetchImpl ?? fetch),
})
