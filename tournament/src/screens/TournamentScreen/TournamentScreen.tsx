import { useState } from 'react'
import type App from '../../App'
import { AppFooter } from '../../components/AppFooter/AppFooter'
import { AppHeader } from '../../components/AppHeader/AppHeader'
import { AppTabs } from '../../components/AppTabs/AppTabs'
import { CreateTournamentSection } from '../../components/CreateTournamentSection/CreateTournamentSection'
import { ParticipantsSection } from '../../components/ParticipantsSection/ParticipantsSection'
import { RoundsSection } from '../../components/RoundsSection/RoundsSection'
import { useTournament } from '../../hooks/useTournament'

type Tab = 'create' | 'participants' | 'rounds'

export const TournamentScreen = () => {
  const [tab, setTab] = useState<Tab>('create')
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
    addParticipant,
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

      <AppTabs
        tab={tab}
        hasTournament={Boolean(tournament)}
        onTabChange={setTab}
      />

      {tab === 'create' ? (
        <CreateTournamentSection
          tournament={tournament}
          tournamentName={tournamentName}
          setTournamentName={setTournamentName}
          createTournament={createTournament}
          groupName={groupName}
          setGroupName={setGroupName}
          addGroup={addGroup}
          onStartTournament={handleStartTournament}
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
    </main>
  )
}
