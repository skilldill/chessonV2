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
  standings,
}: ParticipantsSectionProps) => {
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
            </tr>
          </thead>
          <tbody>
            {standings.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted center">
                  Участники еще не добавлены.
                </td>
              </tr>
            ) : (
              standings.map((item, index) => (
                <tr key={item.participantId}>
                  <td>{index + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.groupName}</td>
                  <td>{item.points}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
