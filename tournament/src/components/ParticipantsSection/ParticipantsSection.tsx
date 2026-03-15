import type { FormEvent } from 'react'
import type { Standing, Tournament } from '../../tournament-engine'

type ParticipantsSectionProps = {
  tournament: Tournament
  participantName: string
  setParticipantName: (value: string) => void
  participantGroupId: string
  setParticipantGroupId: (value: string) => void
  canAddParticipantsAfterStart: boolean
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
  addParticipant,
  updateParticipantName,
  updateParticipantGroup,
  removeParticipant,
  standings,
}: ParticipantsSectionProps) => {
  const canManageParticipants = tournament.status === 'setup'

  return (
    <section className="card stack">
      <h2>Участники</h2>
      <p className="muted">
        После запуска турнира можно добавлять участников только между турами, до
        формирования следующего тура.
      </p>

      <form className="row" onSubmit={addParticipant}>
        <label className="field grow">
          Имя участника
          <input
            value={participantName}
            onChange={(event) => setParticipantName(event.target.value)}
            placeholder="ФИО"
            disabled={!canAddParticipantsAfterStart}
          />
        </label>

        <label className="field grow">
          Группа
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
          Добавить участника
        </button>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Участник</th>
              <th>Группа</th>
              <th>Очки</th>
              {canManageParticipants ? <th>Действия</th> : null}
            </tr>
          </thead>
          <tbody>
            {standings.length === 0 ? (
              <tr>
                <td colSpan={canManageParticipants ? 5 : 4} className="muted center">
                  Участники еще не добавлены.
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
                    <td>{index + 1}</td>
                    <td>
                      {canManageParticipants ? (
                        <input
                          className="table-input"
                          value={participant.name}
                          onChange={(event) =>
                            updateParticipantName(item.participantId, event.target.value)
                          }
                        />
                      ) : (
                        item.name
                      )}
                    </td>
                    <td>
                      {canManageParticipants ? (
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
                        item.groupName
                      )}
                    </td>
                    <td>{item.points}</td>
                    {canManageParticipants ? (
                      <td>
                        <button
                          type="button"
                          className="danger table-action"
                          onClick={() => removeParticipant(item.participantId)}
                        >
                          Удалить
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
