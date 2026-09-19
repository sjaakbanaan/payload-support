import type { DefaultServerCellComponentProps } from 'payload'

import { WORKFLOW_STATE_TYPES } from '../providers/shortcut.js'
import './externalState.css'

export const ExternalStateCell = ({ cellData, rowData }: DefaultServerCellComponentProps) => {
  if (typeof cellData !== 'string' || !cellData) {
    return null
  }

  const stateType = (rowData as { externalStateType?: unknown })?.externalStateType
  const modifier = WORKFLOW_STATE_TYPES.find((known) => known === stateType) ?? 'unknown'

  return (
    <span
      className={`payload-support-external-state payload-support-external-state--${modifier}`}
    >
      {cellData}
    </span>
  )
}
