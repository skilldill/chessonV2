import type { FormEvent } from 'react'
import type { Tournament } from '../../tournament-engine'

type CreateTournamentSectionProps = {
  tournament: Tournament | null
  tournamentName: string
  setTournamentName: (value: string) => void
  createTournament: (event: FormEvent) => void
  groupName: string
  setGroupName: (value: string) => void
  addGroup: (event: FormEvent) => void
  onStartTournament: () => void
}

export const CreateTournamentSection = ({
  tournament,
  tournamentName,
  setTournamentName,
  createTournament,
  groupName,
  setGroupName,
  addGroup,
  onStartTournament,
}: CreateTournamentSectionProps) => {
  return (
    <section className="card stack">
      {!tournament ? (
        <form className="stack" onSubmit={createTournament}>
          <h2>Создать турнир</h2>
          <label className="field">
            Название турнира
            <input
              placeholder="Например, Кубок организаций"
              value={tournamentName}
              onChange={(event) => setTournamentName(event.target.value)}
            />
          </label>
          <button type="submit">Создать</button>
        </form>
      ) : (
        <>
          <h2>{tournament.name}</h2>
          <p className="muted">
            Статус: <strong>{tournament.status}</strong>
          </p>
          <form className="row" onSubmit={addGroup}>
            <label className="field grow">
              Добавить группу
              <input
                placeholder="Например, Организация А"
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                disabled={tournament.status !== 'setup'}
              />
            </label>
            <button type="submit" disabled={tournament.status !== 'setup'}>
              Добавить
            </button>
          </form>

          <div>
            <h3>Группы участников</h3>
            {tournament.groups.length === 0 ? (
              <p className="muted">Пока нет групп. Добавьте минимум одну.</p>
            ) : (
              <ul className="plain-list">
                {tournament.groups.map((group) => (
                  <li key={group.id}>{group.name}</li>
                ))}
              </ul>
            )}
          </div>

          {tournament.status === 'setup' ? (
            <button
              onClick={onStartTournament}
              disabled={tournament.participants.length < 2 || tournament.groups.length === 0}
            >
              Запустить турнир и сформировать 1-й тур
            </button>
          ) : null}
        </>
      )}
    </section>
  )
}
