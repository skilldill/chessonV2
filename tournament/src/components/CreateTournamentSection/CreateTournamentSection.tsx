import type { FormEvent } from 'react'
import { useI18n } from '../../i18n/i18n'
import type { Tournament } from '../../tournament-engine'

type CreateTournamentSectionProps = {
  tournament: Tournament | null
  tournamentName: string
  setTournamentName: (value: string) => void
  createTournament: (event: FormEvent) => void
  groupName: string
  setGroupName: (value: string) => void
  addGroup: (event: FormEvent) => void
  updateGroupName: (groupId: string, nextName: string) => void
  removeGroup: (groupId: string) => void
}

export const CreateTournamentSection = ({
  tournament,
  tournamentName,
  setTournamentName,
  createTournament,
  groupName,
  setGroupName,
  addGroup,
  updateGroupName,
  removeGroup,
}: CreateTournamentSectionProps) => {
  const { t } = useI18n()
  const canManageGroups =
    tournament?.status === 'setup' && tournament.participants.length === 0

  return (
    <section className="card stack">
      {!tournament ? (
        <form className="stack" onSubmit={createTournament}>
          <h2>{t('create.newTournament')}</h2>
          <label className="field">
            {t('create.tournamentName')}
            <input
              placeholder={t('create.tournamentNamePlaceholder')}
              value={tournamentName}
              onChange={(event) => setTournamentName(event.target.value)}
            />
          </label>
          <button type="submit">{t('create.createButton')}</button>
        </form>
      ) : (
        <>
          <h2>{tournament.name}</h2>
          <p className="muted">
            {t('create.status')} <strong>{t(`status.${tournament.status}`)}</strong>
          </p>
          <form className="row" onSubmit={addGroup}>
            <label className="field grow">
              {t('create.addGroup')}
              <input
                placeholder={t('create.groupPlaceholder')}
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                disabled={tournament.status !== 'setup'}
              />
            </label>
            <button type="submit" disabled={tournament.status !== 'setup'}>
              {t('create.addButton')}
            </button>
          </form>

          <div>
            <h3>{t('create.groupsTitle')}</h3>
            {tournament.groups.length === 0 ? (
              <p className="muted">{t('create.noGroups')}</p>
            ) : (
              <ul className="plain-list">
                {tournament.groups.map((group) => {
                  return (
                    <li key={group.id} className="group-item">
                      {canManageGroups ? (
                        <>
                          <input
                            className="group-input"
                            defaultValue={group.name}
                            onBlur={(event) => updateGroupName(group.id, event.target.value)}
                          />
                          <button
                            type="button"
                            className="danger table-action"
                            onClick={() => removeGroup(group.id)}
                          >
                            {t('create.delete')}
                          </button>
                        </>
                      ) : (
                        <span>{group.name}</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  )
}
