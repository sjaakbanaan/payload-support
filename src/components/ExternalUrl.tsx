import type { DefaultServerCellComponentProps, TextFieldServerComponent } from 'payload'

import { NAMESPACE } from '../translations/constants.js'
import './externalUrl.css'
import './fieldLayout.css'

const ExternalUrlLink = ({ label, value }: { label: string; value: unknown }) => {
  if (typeof value !== 'string' || !value) {
    return null
  }

  return (
    <a
      className="payload-support-external-url"
      href={value}
      rel="noopener noreferrer"
      target="_blank"
      title={value}
    >
      {label}
    </a>
  )
}

const shortcutLinkLabel = (t: DefaultServerCellComponentProps['i18n']['t']) =>
  t(`${NAMESPACE}:externalUrlLink` as Parameters<typeof t>[0])

export const ExternalUrlCell = ({ cellData, i18n }: DefaultServerCellComponentProps) => (
  <ExternalUrlLink label={shortcutLinkLabel(i18n.t)} value={cellData} />
)

export const ExternalUrlField: TextFieldServerComponent = ({ clientField, i18n, path, value }) => {
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
        <ExternalUrlLink label={shortcutLinkLabel(i18n.t)} value={value} />
        {description ? (
          <div className={`field-description field-description-${path}`}>{description}</div>
        ) : null}
      </div>
    </div>
  )
}
