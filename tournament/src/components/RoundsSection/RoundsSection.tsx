import { useMemo } from 'react'
import type { MatchResult, Round, Standing, Tournament } from '../../tournament-engine'

type RoundsSectionProps = {
  tournament: Tournament
  standings: Standing[]
  activeRound: Round | null
  completedRoundsCount: number
  isCurrentRoundReady: boolean
  participantsById: Map<string, { id: string; name: string; groupId: string }>
  setMatchResult: (matchId: string, value: MatchResult) => void
  finishCurrentRound: () => void
  createNextRound: () => void
  onFinishTournament: () => void
}

const TEAM_LABEL_PALETTE = [
  { background: '#3d1f86', color: '#ece7ff', borderColor: '#6b46d9' },
  { background: '#0f3d56', color: '#d9f2ff', borderColor: '#22a6f2' },
  { background: '#3d3a12', color: '#fff9d9', borderColor: '#d4c14d' },
  { background: '#3d1e28', color: '#ffe2eb', borderColor: '#d45882' },
  { background: '#183c2a', color: '#ddf7e9', borderColor: '#4dbb7c' },
  { background: '#4a2a0f', color: '#ffe9d8', borderColor: '#e09559' },
]

export const RoundsSection = ({
  tournament,
  standings,
  activeRound,
  completedRoundsCount,
  isCurrentRoundReady,
  participantsById,
  setMatchResult,
  finishCurrentRound,
  createNextRound,
  onFinishTournament,
}: RoundsSectionProps) => {
  const groupsById = useMemo(
    () => new Map(tournament.groups.map((group) => [group.id, group.name])),
    [tournament.groups],
  )

  const teamColorByGroupId = useMemo(() => {
    const palette = [...TEAM_LABEL_PALETTE]

    for (let index = palette.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1))
      const current = palette[index]
      palette[index] = palette[randomIndex]
      palette[randomIndex] = current
    }

    return new Map(
      tournament.groups.map((group, index) => [
        group.id,
        palette[index % palette.length],
      ]),
    )
  }, [tournament.groups])

  const renderPlayerWithTeam = (playerId: string, fallbackText: string) => {
    const participant = participantsById.get(playerId)
    if (!participant) {
      return <span>{fallbackText}</span>
    }

    const teamName = groupsById.get(participant.groupId) ?? 'Без команды'
    const teamColor = teamColorByGroupId.get(participant.groupId) ?? TEAM_LABEL_PALETTE[0]

    return (
      <span className="player-row">
        <span>{participant.name}</span>
        <span className="team-label" style={teamColor}>
          {teamName}
        </span>
      </span>
    )
  }

  return (
    <section className="card stack">
      <h2>Туры и результаты</h2>

      <div className="status-grid">
        <p>
          <span>Турнир:</span> {tournament.name}
        </p>
        <p>
          <span>Статус:</span> {tournament.status}
        </p>
        <p>
          <span>Завершено туров:</span> {completedRoundsCount}
        </p>
      </div>

      {tournament.status === 'running' && activeRound ? (
        <>
          <h3>Текущий тур: {activeRound.number}</h3>

          <div className="round-list">
            {activeRound.matches.map((match, index) => {
              const playerAName = participantsById.get(match.playerAId)?.name ?? 'Неизвестный'
              const playerBName = match.playerBId
                ? participantsById.get(match.playerBId)?.name ?? 'Неизвестный'
                : null

              return (
                <article key={match.id} className="match-card">
                  <p className="match-title">Пара {index + 1}</p>
                  <div className="match-players">
                    {renderPlayerWithTeam(match.playerAId, 'Неизвестный')}
                    <span className="match-vs">vs</span>
                    {match.playerBId ? (
                      renderPlayerWithTeam(match.playerBId, 'Неизвестный')
                    ) : (
                      <span className="player-row">
                        <span>BYE</span>
                      </span>
                    )}
                  </div>

                  {match.playerBId ? (
                    <label className="field">
                      Результат
                      <select
                        value={match.result ?? ''}
                        onChange={(event) =>
                          setMatchResult(match.id, event.target.value as MatchResult)
                        }
                      >
                        <option value="">Выберите</option>
                        <option value="playerA">Победил {playerAName}</option>
                        <option value="playerB">Победил {playerBName}</option>
                        <option value="draw">Ничья</option>
                      </select>
                    </label>
                  ) : (
                    <p className="muted">Автоматическая победа (bye): 1 очко</p>
                  )}
                </article>
              )
            })}
          </div>

          <button onClick={finishCurrentRound} disabled={!isCurrentRoundReady}>
            Завершить текущий тур
          </button>
        </>
      ) : null}

      {tournament.status === 'running' && !activeRound ? (
        <div className="row">
          <button onClick={createNextRound} disabled={tournament.participants.length < 2}>
            Сформировать следующий тур
          </button>
          <button
            className="secondary"
            onClick={onFinishTournament}
            disabled={completedRoundsCount === 0}
          >
            Завершить турнир
          </button>
        </div>
      ) : null}

      {tournament.status === 'finished' ? (
        <p className="winner-banner">
          Турнир завершен. Таблица победителей сформирована ниже.
        </p>
      ) : null}

      <h3>Таблица</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Место</th>
              <th>Участник</th>
              <th>Группа</th>
              <th>Очки</th>
              <th>Бухгольц</th>
              <th>Победы</th>
            </tr>
          </thead>
          <tbody>
            {standings.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted center">
                  Нет данных для таблицы.
                </td>
              </tr>
            ) : (
              standings.map((item, index) => (
                <tr key={item.participantId}>
                  <td>{index + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.groupName}</td>
                  <td>{item.points}</td>
                  <td>{item.buchholz}</td>
                  <td>{item.wins}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {tournament.rounds.length > 0 ? (
        <div className="history stack">
          <h3>История туров</h3>
          {tournament.rounds.map((round) => (
            <article key={round.id} className="history-card">
              <p>
                Тур {round.number} ({round.status})
              </p>
              <ul className="plain-list">
                {round.matches.map((match) => {
                  const playerAName = participantsById.get(match.playerAId)?.name ?? 'Неизвестный'
                  const playerBName = match.playerBId
                    ? participantsById.get(match.playerBId)?.name ?? 'Неизвестный'
                    : 'BYE'

                  let resultText = 'Ожидается'
                  if (match.result === 'playerA') {
                    resultText = `Победил ${playerAName}`
                  } else if (match.result === 'playerB') {
                    resultText = `Победил ${playerBName}`
                  } else if (match.result === 'draw') {
                    resultText = 'Ничья'
                  } else if (match.result === 'bye') {
                    resultText = 'BYE: 1 очко'
                  }

                  return (
                    <li key={match.id}>
                      <span className="history-match-line">
                        {renderPlayerWithTeam(match.playerAId, 'Неизвестный')}
                        <span className="history-separator">-</span>
                        {match.playerBId ? (
                          renderPlayerWithTeam(match.playerBId, 'Неизвестный')
                        ) : (
                          <span className="player-row">
                            <span>BYE</span>
                          </span>
                        )}
                        <span className="history-separator">:</span>
                        <span className="history-result">{resultText}</span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            </article>
          ))}
        </div>
      ) : null}

      {tournament.status === 'setup' ? (
        <p className="muted">Запустите турнир на вкладке «Создание турнира».</p>
      ) : null}
    </section>
  )
}
