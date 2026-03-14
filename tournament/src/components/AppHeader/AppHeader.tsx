type AppHeaderProps = {
  hasTournament: boolean
  onResetTournament: () => void
}

export const AppHeader = ({ hasTournament, onResetTournament }: AppHeaderProps) => {
  return (
    <header className="topbar">
      <div>
        <h1>Швейцарский турнир</h1>
        <p className="subtitle">
          Формирование групп, управление турами и итоговая таблица победителей.
        </p>
      </div>
      {hasTournament ? (
        <button className="danger" onClick={onResetTournament}>
          Новый турнир
        </button>
      ) : null}
    </header>
  )
}
