import type { DefaultServerCellComponentProps, TextFieldServerComponent } from 'payload'

import './externalUrl.css'
import './fieldLayout.css'

const ExternalUrlLink = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string' || !value) {
    return null
  }

  return (
    <a
      className="payload-support-external-url"
      href={value}
      rel="noopener noreferrer"
      target="_blank"
    >
      {value}
    </a>
  )
}

export const ExternalUrlCell = ({ cellData }: DefaultServerCellComponentProps) => (
  <ExternalUrlLink value={cellData} />
)

export const ExternalUrlField: TextFieldServerComponent = ({ clientField, path, value }) => {
  const label = typeof clientField.label === 'string' ? clientField.label : undefined
  const description =
    typeof clientField.admin?.description === 'string' ? clientField.admin.description : undefined

  return (
    <div className="field-type payload-support-field">
      {label ? (
        <label className="field-label" htmlFor={`field-${path}`}>
          {label}
        </label>
      ) : null}
      <div className="field-type__wrap">
        <ExternalUrlLink value={value} />
        {description ? (
          <div className={`field-description field-description-${path}`}>{description}</div>
        ) : null}
      </div>
    </div>
  )
}
