import type { DefaultServerCellComponentProps, TextFieldServerComponent } from 'payload'

import { WORKFLOW_STATE_TYPES } from '../providers/shortcut.js'
import './externalState.css'
import './fieldLayout.css'

const ExternalStateBadge = ({ stateType, value }: { stateType: unknown; value: unknown }) => {
  if (typeof value !== 'string' || !value) {
    return null
  }

  const modifier = WORKFLOW_STATE_TYPES.find((known) => known === stateType) ?? 'unknown'

  return (
    <span className={`payload-support-external-state payload-support-external-state--${modifier}`}>
      {value}
    </span>
  )
}

export const ExternalStateCell = ({ cellData, rowData }: DefaultServerCellComponentProps) => (
  <ExternalStateBadge
    stateType={(rowData as { externalStateType?: unknown })?.externalStateType}
    value={cellData}
  />
)

export const ExternalStateField: TextFieldServerComponent = ({
  clientField,
  path,
  siblingData,
  value,
}) => {
  const label = typeof clientField.label === 'string' ? clientField.label : undefined

  return (
    <div className="field-type payload-support-field">
      {label ? (
        <label className="field-label" htmlFor={`field-${path}`}>
          {label}
        </label>
      ) : null}
      <div className="field-type__wrap">
        <ExternalStateBadge stateType={siblingData?.externalStateType} value={value} />
      </div>
    </div>
  )
}
