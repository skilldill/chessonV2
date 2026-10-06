import { useI18n } from '../../i18n/i18n'

export const AppHeader = () => {
  const { t } = useI18n()

  return (
    <header className="topbar">
      <hgroup>
        <h1>{t('header.title')}</h1>
        <p className="subtitle">{t('header.subtitle')}</p>
      </hgroup>
    </header>
  )
}
