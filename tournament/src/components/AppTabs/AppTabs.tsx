import { useI18n } from '../../i18n/i18n'

type Tab = 'create' | 'participants' | 'rounds'

type AppTabsProps = {
  tab: Tab
  hasTournament: boolean
  onTabChange: (tab: Tab) => void
}

export const AppTabs = ({ tab, hasTournament, onTabChange }: AppTabsProps) => {
  const { t } = useI18n()

  return (
    <nav className="tabs" aria-label={t('tabs.navLabel')}>
      <button className={tab === 'create' ? 'active' : ''} onClick={() => onTabChange('create')}>
        {t('tabs.create')}
      </button>
      <button
        className={tab === 'participants' ? 'active' : ''}
        onClick={() => onTabChange('participants')}
        disabled={!hasTournament}
      >
        {t('tabs.participants')}
      </button>
      <button
        className={tab === 'rounds' ? 'active' : ''}
        onClick={() => onTabChange('rounds')}
        disabled={!hasTournament}
      >
        {t('tabs.rounds')}
      </button>
    </nav>
  )
}
