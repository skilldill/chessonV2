import type { FormEvent } from 'react'
import { useI18n } from '../../i18n/i18n'
import type { Standing, Tournament } from '../../tournament-engine'

type ParticipantsSectionProps = {
  tournament: Tournament
  participantName: string
  setParticipantName: (value: string) => void
  participantGroupId: string
  setParticipantGroupId: (value: string) => void
  canAddParticipantsAfterStart: boolean
  canManageRoster: boolean
  addParticipant: (event: FormEvent) => void
  updateParticipantName: (participantId: string, nextName: string) => void
  updateParticipantGroup: (participantId: string, nextGroupId: string) => void
  removeParticipant: (participantId: string) => void
  standings: Standing[]
}

export const ParticipantsSection = ({
  tournament,
  participantName,
  setParticipantName,
  participantGroupId,
  setParticipantGroupId,
  canAddParticipantsAfterStart,
  canManageRoster,
  addParticipant,
  updateParticipantName,
  updateParticipantGroup,
  removeParticipant,
  standings,
}: ParticipantsSectionProps) => {
  const { t } = useI18n()
  const canEditParticipants = tournament.status === 'setup'
  const groupsById = new Map(tournament.groups.map((group) => [group.id, group.name]))

  return (
    <section className="card stack">
      <h2>{t('participants.title')}</h2>
      <p className="muted">{t('participants.hint')}</p>

      <form className="row" onSubmit={addParticipant}>
        <label className="field grow">
          {t('participants.name')}
          <input
            value={participantName}
            onChange={(event) => setParticipantName(event.target.value)}
            placeholder={t('participants.namePlaceholder')}
            disabled={!canAddParticipantsAfterStart}
          />
        </label>

        <label className="field grow">
          {t('participants.group')}
          <select
            value={participantGroupId}
            onChange={(event) => setParticipantGroupId(event.target.value)}
            disabled={!canAddParticipantsAfterStart || tournament.groups.length === 0}
          >
            {tournament.groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={
            !canAddParticipantsAfterStart ||
            tournament.groups.length === 0 ||
            !participantGroupId
          }
        >
          {t('participants.add')}
        </button>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>{t('table.participant')}</th>
              <th>{t('table.group')}</th>
              <th>{t('table.points')}</th>
              {canManageRoster ? <th>{t('participants.actions')}</th> : null}
            </tr>
          </thead>
          <tbody>
            {standings.length === 0 ? (
              <tr>
                <td colSpan={canManageRoster ? 5 : 4} className="muted center">
                  {t('participants.empty')}
                </td>
              </tr>
            ) : (
              standings.map((item, index) => {
                const participant = tournament.participants.find(
                  (current) => current.id === item.participantId,
                )

                if (!participant) {
                  return null
                }

                return (
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
                    <td>
                      {canEditParticipants ? (
                        <input
                          className="table-input"
                          value={participant.name}
                          onChange={(event) =>
                            updateParticipantName(item.participantId, event.target.value)
                          }
                        />
                      ) : (
                        <>
                          {item.name}
                          {(participant.isActive ?? true) ? null : (
                            <span className="participant-removed"> ({t('participants.removed')})</span>
                          )}
                        </>
                      )}
                    </td>
                    <td>
                      {canEditParticipants ? (
                        <select
                          className="table-input"
                          value={participant.groupId}
                          onChange={(event) =>
                            updateParticipantGroup(item.participantId, event.target.value)
                          }
                        >
                          {tournament.groups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        groupsById.get(participant.groupId) ?? t('common.noTeam')
                      )}
                    </td>
                    <td>{item.points}</td>
                    {canManageRoster ? (
                      <td>
                        <button
                          type="button"
                          className="danger table-action"
                          onClick={() => removeParticipant(item.participantId)}
                          disabled={!(participant.isActive ?? true)}
                        >
                          {t('create.delete')}
                        </button>
                      </td>
                    ) : null}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
