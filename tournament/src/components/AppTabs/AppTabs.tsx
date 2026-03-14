type Tab = 'create' | 'participants' | 'rounds'

type AppTabsProps = {
  tab: Tab
  hasTournament: boolean
  onTabChange: (tab: Tab) => void
}

export const AppTabs = ({ tab, hasTournament, onTabChange }: AppTabsProps) => {
  return (
    <nav className="tabs" aria-label="Разделы">
      <button className={tab === 'create' ? 'active' : ''} onClick={() => onTabChange('create')}>
        Создание турнира
      </button>
      <button
        className={tab === 'participants' ? 'active' : ''}
        onClick={() => onTabChange('participants')}
        disabled={!hasTournament}
      >
        Участники
      </button>
      <button
        className={tab === 'rounds' ? 'active' : ''}
        onClick={() => onTabChange('rounds')}
        disabled={!hasTournament}
      >
        Туры и результаты
      </button>
    </nav>
  )
}
