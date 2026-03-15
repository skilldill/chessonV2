import { useI18n } from '../../i18n/i18n'

type AppHeaderProps = {
  hasTournament: boolean
  onResetTournament: () => void
}

export const AppHeader = ({
  hasTournament,
  onResetTournament,
}: AppHeaderProps) => {
  const { t } = useI18n()

  return (
    <header className="topbar">
      <div>
        <h1>{t('header.title')}</h1>
        <p className="subtitle">{t('header.subtitle')}</p>
      </div>
      <div className="header-actions">
        {hasTournament ? (
          <button className="danger" onClick={onResetTournament}>
            {t('header.newTournament')}
          </button>
        ) : null}
      </div>
    </header>
  )
}
