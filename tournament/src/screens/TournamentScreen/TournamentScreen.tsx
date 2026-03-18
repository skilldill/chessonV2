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
type FinishDialogMode = 'finish' | 'tie-break' | null

export const TournamentScreen = () => {
  const { t } = useI18n()
  const [tab, setTab] = useState<Tab>('create')
  const [finishDialogMode, setFinishDialogMode] = useState<FinishDialogMode>(null)
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
    canManageRoster,
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
    createPrizeBoundaryTieBreak,
    prizeTieGroups,
    resetTournament,
    completedRoundsCount,
    isCurrentRoundReady,
    activeParticipantsCount,
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
    if (prizeTieGroups.length > 0) {
      setFinishDialogMode('tie-break')
      return
    }

    setFinishDialogMode('finish')
  }

  const handleConfirmFinishTournament = () => {
    if (finishDialogMode === 'tie-break') {
      const created = createPrizeBoundaryTieBreak()
      setFinishDialogMode(null)
      if (created) {
        setTab('rounds')
      }
      return
    }

    const finished = finishTournament()
    setFinishDialogMode(null)
    if (finished) {
      setTab('rounds')
    }
  }

  const handleCancelFinishDialog = () => {
    if (finishDialogMode === 'tie-break') {
      const finished = finishTournament()
      setFinishDialogMode(null)
      if (finished) {
        setTab('rounds')
      }
      return
    }

    setFinishDialogMode(null)
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
              disabled={activeParticipantsCount < 2 || tournament.groups.length === 0}
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
          canManageRoster={canManageRoster}
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
          activeParticipantsCount={activeParticipantsCount}
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
        isOpen={finishDialogMode !== null}
        title={
          finishDialogMode === 'tie-break'
            ? t('screen.tieBreakTitle')
            : t('screen.finishTitle')
        }
        description={
          finishDialogMode === 'tie-break'
            ? t('screen.tieBreakDescription')
            : t('screen.finishDescription')
        }
        confirmLabel={
          finishDialogMode === 'tie-break'
            ? t('screen.tieBreakAction')
            : t('screen.finishConfirm')
        }
        cancelLabel={
          finishDialogMode === 'tie-break'
            ? t('screen.finishAnyway')
            : t('confirm.cancel')
        }
        confirmVariant={finishDialogMode === 'tie-break' ? 'default' : 'danger'}
        closeOnOverlay={finishDialogMode !== 'tie-break'}
        closeOnEscape={finishDialogMode !== 'tie-break'}
        onConfirm={handleConfirmFinishTournament}
        onCancel={handleCancelFinishDialog}
      />
    </main>
  )
}
