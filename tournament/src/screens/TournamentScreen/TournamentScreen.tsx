import { useState } from 'react'
import { AppFooter } from '../../components/AppFooter/AppFooter'
import { AppHeader } from '../../components/AppHeader/AppHeader'
import { AppTabs } from '../../components/AppTabs/AppTabs'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { CreateTournamentSection } from '../../components/CreateTournamentSection/CreateTournamentSection'
import { ParticipantsSection } from '../../components/ParticipantsSection/ParticipantsSection'
import { RoundsSection } from '../../components/RoundsSection/RoundsSection'
import { useTournament } from '../../hooks/useTournament'
import { useI18n } from '../../i18n/i18n'

type Tab = 'create' | 'participants' | 'rounds'

export const TournamentScreen = () => {
  const { t } = useI18n()
  const [tab, setTab] = useState<Tab>('create')
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false)
  const {
    tournament,
    tournamentName,
    setTournamentName,
    groupName,
    setGroupName,
    participantName,
    setParticipantName,
    participantGroupId,
    setParticipantGroupId,
    standings,
    participantsById,
    activeRound,
    canAddParticipantsAfterStart,
    createTournament,
    addGroup,
    updateGroupName,
    removeGroup,
    addParticipant,
    updateParticipantName,
    updateParticipantGroup,
    removeParticipant,
    startTournament,
    createNextRound,
    setMatchResult,
    finishCurrentRound,
    finishTournament,
    resetTournament,
    completedRoundsCount,
    isCurrentRoundReady,
  } = useTournament()

  const handleStartTournament = () => {
    const started = startTournament()
    if (started) {
      setTab('rounds')
    }
  }

  const handleResetTournament = () => {
    resetTournament()
    setTab('create')
  }

  const handleFinishTournament = () => {
    setIsFinishDialogOpen(true)
  }

  const handleConfirmFinishTournament = () => {
    setIsFinishDialogOpen(false)
    const finished = finishTournament()
    if (finished) {
      setTab('rounds')
    }
  }

  return (
    <main className="layout">
      <AppHeader
        hasTournament={Boolean(tournament)}
        onResetTournament={handleResetTournament}
      />

      <div className="nav-controls">
        <AppTabs
          tab={tab}
          hasTournament={Boolean(tournament)}
          onTabChange={setTab}
        />

        {tournament && tournament.status === 'setup' ? (
            <button
              onClick={handleStartTournament}
              disabled={tournament.participants.length < 2 || tournament.groups.length === 0}
            >
              {t('screen.startFirstRound')}
            </button>
          ) : null}
      </div>

      {tab === 'create' ? (
        <CreateTournamentSection
          tournament={tournament}
          tournamentName={tournamentName}
          setTournamentName={setTournamentName}
          createTournament={createTournament}
          groupName={groupName}
          setGroupName={setGroupName}
          addGroup={addGroup}
          updateGroupName={updateGroupName}
          removeGroup={removeGroup}
        />
      ) : null}

      {tab === 'participants' && tournament ? (
        <ParticipantsSection
          tournament={tournament}
          participantName={participantName}
          setParticipantName={setParticipantName}
          participantGroupId={participantGroupId}
          setParticipantGroupId={setParticipantGroupId}
          canAddParticipantsAfterStart={canAddParticipantsAfterStart}
          addParticipant={addParticipant}
          updateParticipantName={updateParticipantName}
          updateParticipantGroup={updateParticipantGroup}
          removeParticipant={removeParticipant}
          standings={standings}
        />
      ) : null}

      {tab === 'rounds' && tournament ? (
        <RoundsSection
          tournament={tournament}
          standings={standings}
          activeRound={activeRound}
          completedRoundsCount={completedRoundsCount}
          isCurrentRoundReady={isCurrentRoundReady}
          participantsById={participantsById}
          setMatchResult={setMatchResult}
          finishCurrentRound={finishCurrentRound}
          createNextRound={createNextRound}
          onFinishTournament={handleFinishTournament}
        />
      ) : null}

      <AppFooter />

      <ConfirmDialog
        isOpen={isFinishDialogOpen}
        title={t('screen.finishTitle')}
        description={t('screen.finishDescription')}
        confirmLabel={t('screen.finishConfirm')}
        confirmVariant="danger"
        onConfirm={handleConfirmFinishTournament}
        onCancel={() => setIsFinishDialogOpen(false)}
      />
    </main>
  )
}
