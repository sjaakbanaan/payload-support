import type { CreateBugInput, CreatedTicket, ShortcutProviderConfig } from '../types.js'

const SHORTCUT_API = 'https://api.app.shortcut.com/api/v3'

export type FetchLike = typeof fetch

type ShortcutStoryResponse = {
  app_url?: string
  id?: number | string
  workflow_state_id?: number
}

type ShortcutWorkflowResponse = {
  states?: Array<{
    id?: number
    name?: string
  }>
}

export type ShortcutStory = {
  id: string
  url: string
  workflowStateId?: number
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

const authHeaders = (token: string, withJson = false): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Shortcut-Token': token,
  }
  if (withJson) {
    headers['Content-Type'] = 'application/json'
  }
  return headers
}

const parseJson = async <T>(response: Response): Promise<T> => {
  const responseText = await response.text()

  if (!response.ok) {
    throw new ShortcutApiError(response.status, responseText)
  }

  try {
    return JSON.parse(responseText) as T
  } catch {
    throw new ShortcutApiError(response.status, 'Invalid JSON response')
  }
}

const toStory = (story: ShortcutStoryResponse, fallbackStatus: number): ShortcutStory => {
  const id = story.id != null ? String(story.id) : ''
  if (!id) {
    throw new ShortcutApiError(fallbackStatus, 'Shortcut response was missing a story id')
  }

  return {
    id,
    url: story.app_url || `https://app.shortcut.com/story/${id}`,
    workflowStateId:
      typeof story.workflow_state_id === 'number' ? story.workflow_state_id : undefined,
  }
}

export const resolveWorkflowStateName = (
  stateId: number | undefined,
  states: Map<number, string>,
): null | string => {
  if (typeof stateId !== 'number') {
    return null
  }
  return states.get(stateId) ?? null
}

export const listWorkflowStates = async (
  config: ShortcutProviderConfig,
  fetchImpl: FetchLike = fetch,
): Promise<Map<number, string>> => {
  const response = await fetchImpl(`${SHORTCUT_API}/workflows`, {
    headers: authHeaders(config.token),
    method: 'GET',
  })

  const workflows = await parseJson<ShortcutWorkflowResponse[]>(response)
  const states = new Map<number, string>()

  for (const workflow of workflows) {
    for (const state of workflow.states ?? []) {
      if (typeof state.id === 'number' && typeof state.name === 'string' && state.name) {
        states.set(state.id, state.name)
      }
    }
  }

  return states
}

export const getShortcutStory = async (
  config: ShortcutProviderConfig,
  storyId: string,
  fetchImpl: FetchLike = fetch,
): Promise<ShortcutStory> => {
  const response = await fetchImpl(`${SHORTCUT_API}/stories/${encodeURIComponent(storyId)}`, {
    headers: authHeaders(config.token),
    method: 'GET',
  })

  const story = await parseJson<ShortcutStoryResponse>(response)
  return toStory(story, response.status)
}

export const createShortcutStory = async (
  config: ShortcutProviderConfig,
  input: CreateBugInput,
  fetchImpl: FetchLike = fetch,
): Promise<ShortcutStory> => {
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
    headers: authHeaders(config.token, true),
    method: 'POST',
  })

  const story = await parseJson<ShortcutStoryResponse>(response)
  return toStory(story, response.status)
}

export const createShortcutAdapter = (config: ShortcutProviderConfig, fetchImpl?: FetchLike) => {
  const fetchFn = fetchImpl ?? fetch

  return {
    createBug: async (input: CreateBugInput): Promise<CreatedTicket> => {
      const story = await createShortcutStory(config, input, fetchFn)
      let workflowState: null | string = null

      if (typeof story.workflowStateId === 'number') {
        const states = await listWorkflowStates(config, fetchFn)
        workflowState = resolveWorkflowStateName(story.workflowStateId, states)
      }

      return {
        id: story.id,
        url: story.url,
        workflowState,
      }
    },
    getStory: (storyId: string) => getShortcutStory(config, storyId, fetchFn),
    listWorkflowStates: () => listWorkflowStates(config, fetchFn),
  }
}
