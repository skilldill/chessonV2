import { useMemo } from 'react'
import { useI18n } from '../../i18n/i18n'
import type { MatchResult, Round, Standing, Tournament } from '../../tournament-engine'

type RoundsSectionProps = {
  tournament: Tournament
  standings: Standing[]
  activeRound: Round | null
  activeParticipantsCount: number
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
  activeParticipantsCount,
  completedRoundsCount,
  isCurrentRoundReady,
  participantsById,
  setMatchResult,
  finishCurrentRound,
  createNextRound,
  onFinishTournament,
}: RoundsSectionProps) => {
  const { t } = useI18n()

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

    const teamName = groupsById.get(participant.groupId) ?? t('common.noTeam')
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
      <h2>{t('rounds.title')}</h2>

      <div className="status-grid">
        <p>
          <span>{t('rounds.tournament')}</span> {tournament.name}
        </p>
        <p>
          <span>{t('rounds.status')}</span> {t(`status.${tournament.status}`)}
        </p>
        <p>
          <span>{t('rounds.completedRounds')}</span> {completedRoundsCount}
        </p>
      </div>

      {tournament.status === 'running' && activeRound ? (
        <>
          <h3>
            {activeRound.kind === 'tiebreak'
              ? t('rounds.currentTieBreak', { number: activeRound.number })
              : t('rounds.currentRound', { number: activeRound.number })}
          </h3>

          <div className="round-list">
            {activeRound.matches.map((match, index) => {
              const playerAName =
                participantsById.get(match.playerAId)?.name ?? t('common.unknown')
              const playerBName = match.playerBId
                ? participantsById.get(match.playerBId)?.name ?? t('common.unknown')
                : null

              return (
                <article key={match.id} className="match-card">
                  <p className="match-title">{t('rounds.pair', { number: index + 1 })}</p>
                  <div className="match-players">
                    {renderPlayerWithTeam(match.playerAId, t('common.unknown'))}
                    <span className="match-vs">vs</span>
                    {match.playerBId ? (
                      renderPlayerWithTeam(match.playerBId, t('common.unknown'))
                    ) : (
                      <span className="player-row">
                        <span>BYE</span>
                      </span>
                    )}
                  </div>

                  {match.playerBId ? (
                    <label className="field">
                      {t('rounds.result')}
                      <select
                        value={match.result ?? ''}
                        onChange={(event) =>
                          setMatchResult(match.id, event.target.value as MatchResult)
                        }
                      >
                        <option value="">{t('rounds.select')}</option>
                        <option value="playerA">{t('rounds.winA', { name: playerAName })}</option>
                        <option value="playerB">{t('rounds.winB', { name: playerBName ?? '' })}</option>
                        <option value="draw">{t('rounds.draw')}</option>
                      </select>
                    </label>
                  ) : (
                    <p className="muted">{t('rounds.byeAuto')}</p>
                  )}
                </article>
              )
            })}
          </div>

          <button onClick={finishCurrentRound} disabled={!isCurrentRoundReady}>
            {t('rounds.finishCurrentRound')}
          </button>
        </>
      ) : null}

      {tournament.status === 'running' && !activeRound ? (
        <div className="row">
          <button onClick={createNextRound} disabled={activeParticipantsCount < 2}>
            {t('rounds.createNextRound')}
          </button>
          <button
            className="secondary"
            onClick={onFinishTournament}
            disabled={completedRoundsCount === 0}
          >
            {t('rounds.finishTournament')}
          </button>
        </div>
      ) : null}

      {tournament.status === 'finished' ? (
        <p className="winner-banner">{t('rounds.finishedBanner')}</p>
      ) : null}

      <h3>{t('rounds.table')}</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('table.rank')}</th>
              <th>{t('table.participant')}</th>
              <th>{t('table.group')}</th>
              <th>{t('table.points')}</th>
              <th>{t('table.buchholz')}</th>
              <th>{t('table.wins')}</th>
            </tr>
          </thead>
          <tbody>
            {standings.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted center">
                  {t('rounds.noTableData')}
                </td>
              </tr>
            ) : (
              standings.map((item, index) => (
                <tr key={item.participantId}>
                  <td>
                    <span
                      className={[
                        'rank-badge',
                        index === 0
                          ? 'rank-gold'
                          : index === 1
                            ? 'rank-silver'
                            : index === 2
                              ? 'rank-bronze'
                              : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {index === 0
                        ? '🥇 1'
                        : index === 1
                          ? '🥈 2'
                          : index === 2
                            ? '🥉 3'
                            : index + 1}
                    </span>
                  </td>
                  <td>{item.name}</td>
                  <td>
                    {groupsById.get(participantsById.get(item.participantId)?.groupId ?? '') ??
                      t('common.noTeam')}
                  </td>
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
          <h3>{t('rounds.history')}</h3>
          {tournament.rounds.map((round) => (
            <article key={round.id} className="history-card">
              <p>
                {t('rounds.roundHistory', {
                  number: round.number,
                  status:
                    round.kind === 'tiebreak'
                      ? `${t('rounds.tieBreakLabel')}, ${t(`status.${round.status}`)}`
                      : t(`status.${round.status}`),
                })}
              </p>
              <ul className="plain-list">
                {round.matches.map((match) => {
                  const playerAName =
                    participantsById.get(match.playerAId)?.name ?? t('common.unknown')
                  const playerBName = match.playerBId
                    ? participantsById.get(match.playerBId)?.name ?? t('common.unknown')
                    : 'BYE'

                  let resultText = t('rounds.awaiting')
                  if (match.result === 'playerA') {
                    resultText = t('rounds.winA', { name: playerAName })
                  } else if (match.result === 'playerB') {
                    resultText = t('rounds.winB', { name: playerBName })
                  } else if (match.result === 'draw') {
                    resultText = t('rounds.draw')
                  } else if (match.result === 'bye') {
                    resultText = t('rounds.byePoint')
                  }

                  return (
                    <li key={match.id}>
                      <span className="history-match-line">
                        {renderPlayerWithTeam(match.playerAId, t('common.unknown'))}
                        <span className="history-separator">-</span>
                        {match.playerBId ? (
                          renderPlayerWithTeam(match.playerBId, t('common.unknown'))
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
        <p className="muted">{t('rounds.startHint')}</p>
      ) : null}
    </section>
  )
}
