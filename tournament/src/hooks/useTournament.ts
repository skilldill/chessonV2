import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  buildStandings,
  findActiveRound,
  generateSwissRound,
  uid,
  type Group,
  type Match,
  type MatchResult,
  type Round,
  type Tournament,
} from '../tournament-engine'

const STORAGE_KEY = 'chess-swiss-tournament-v1'

export const useTournament = () => {
  const [tournament, setTournament] = useState<Tournament | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return null
    }

    try {
      return JSON.parse(raw) as Tournament
    } catch {
      return null
    }
  })

  const [tournamentName, setTournamentName] = useState('')
  const [groupName, setGroupName] = useState('')
  const [participantName, setParticipantName] = useState('')
  const [participantGroupId, setParticipantGroupId] = useState('')

  useEffect(() => {
    if (!tournament) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(tournament))
  }, [tournament])

  useEffect(() => {
    if (!tournament) {
      return
    }

    if (!participantGroupId && tournament.groups.length > 0) {
      setParticipantGroupId(tournament.groups[0].id)
    }
  }, [participantGroupId, tournament])

  const standings = useMemo(
    () => (tournament ? buildStandings(tournament) : []),
    [tournament],
  )

  const participantsById = useMemo(
    () => new Map((tournament?.participants ?? []).map((item) => [item.id, item])),
    [tournament?.participants],
  )

  const activeRound = useMemo(() => findActiveRound(tournament), [tournament])

  const activeParticipantsCount = useMemo(
    () =>
      tournament?.participants.filter((participant) => participant.isActive ?? true)
        .length ?? 0,
    [tournament?.participants],
  )

  const canAddParticipantsAfterStart = useMemo(() => {
    if (!tournament) {
      return false
    }

    if (tournament.status === 'setup') {
      return true
    }

    if (tournament.status !== 'running') {
      return false
    }

    return !activeRound
  }, [activeRound, tournament])

  const canManageRoster = useMemo(() => {
    if (!tournament) {
      return false
    }

    if (tournament.status === 'setup') {
      return true
    }

    return tournament.status === 'running' && !activeRound
  }, [activeRound, tournament])

  const hasTieBreakRounds = useMemo(
    () => tournament?.rounds.some((round) => round.kind === 'tiebreak') ?? false,
    [tournament?.rounds],
  )

  const prizeTieGroups = useMemo(() => {
    if (!tournament || tournament.status !== 'running' || activeRound) {
      return []
    }

    const prizePlaces = 3
    const activeStandings = standings.filter(
      (item) => participantsById.get(item.participantId)?.isActive ?? true,
    )

    if (activeStandings.length < 2) {
      return []
    }

    const groupsByKey = new Map<string, typeof activeStandings>()
    for (const item of activeStandings) {
      const key = `${item.points}|${item.buchholz}`
      const group = groupsByKey.get(key)
      if (group) {
        group.push(item)
      } else {
        groupsByKey.set(key, [item])
      }
    }

    const indexById = new Map(
      activeStandings.map((item, index) => [item.participantId, index]),
    )

    return [...groupsByKey.values()]
      .filter((group) => group.length > 1)
      .filter((group) =>
        group.some((item) => (indexById.get(item.participantId) ?? Number.MAX_SAFE_INTEGER) < prizePlaces),
      )
      .sort((left, right) => {
        const leftIndex = Math.min(
          ...left.map((item) => indexById.get(item.participantId) ?? Number.MAX_SAFE_INTEGER),
        )
        const rightIndex = Math.min(
          ...right.map((item) => indexById.get(item.participantId) ?? Number.MAX_SAFE_INTEGER),
        )
        return leftIndex - rightIndex
      })
  }, [activeRound, participantsById, standings, tournament])

  const createTournament = (event: FormEvent) => {
    event.preventDefault()

    const cleanedName = tournamentName.trim()
    if (!cleanedName) {
      return
    }

    setTournament({
      id: uid(),
      name: cleanedName,
      status: 'setup',
      groups: [],
      participants: [],
      rounds: [],
      createdAt: new Date().toISOString(),
    })

    setGroupName('')
    setParticipantName('')
    setParticipantGroupId('')
  }

  const addGroup = (event: FormEvent) => {
    event.preventDefault()

    if (!tournament) {
      return
    }

    const cleanedName = groupName.trim()
    if (!cleanedName) {
      return
    }

    if (
      tournament.groups.some(
        (group) => group.name.toLowerCase() === cleanedName.toLowerCase(),
      )
    ) {
      return
    }

    const nextGroup: Group = {
      id: uid(),
      name: cleanedName,
    }

    setTournament({
      ...tournament,
      groups: [...tournament.groups, nextGroup],
    })

    setGroupName('')
    if (!participantGroupId) {
      setParticipantGroupId(nextGroup.id)
    }
  }

  const updateGroupName = (groupId: string, nextName: string) => {
    if (!tournament || tournament.status !== 'setup' || tournament.participants.length > 0) {
      return
    }

    const cleanedName = nextName.trim()
    if (!cleanedName) {
      return
    }

    if (
      tournament.groups.some(
        (group) =>
          group.id !== groupId && group.name.toLowerCase() === cleanedName.toLowerCase(),
      )
    ) {
      return
    }

    setTournament({
      ...tournament,
      groups: tournament.groups.map((group) =>
        group.id === groupId ? { ...group, name: cleanedName } : group,
      ),
    })
  }

  const removeGroup = (groupId: string) => {
    if (!tournament || tournament.status !== 'setup' || tournament.participants.length > 0) {
      return
    }

    const nextGroups = tournament.groups.filter((group) => group.id !== groupId)
    setTournament({
      ...tournament,
      groups: nextGroups,
    })

    if (participantGroupId === groupId) {
      setParticipantGroupId(nextGroups[0]?.id ?? '')
    }
  }

  const addParticipant = (event: FormEvent) => {
    event.preventDefault()

    if (!tournament || !canAddParticipantsAfterStart) {
      return
    }

    const cleanedName = participantName.trim()
    if (!cleanedName || !participantGroupId) {
      return
    }

    const hasGroup = tournament.groups.some((group) => group.id === participantGroupId)
    if (!hasGroup) {
      return
    }

    setTournament({
      ...tournament,
      participants: [
        ...tournament.participants,
        {
          id: uid(),
          name: cleanedName,
          groupId: participantGroupId,
          isActive: true,
        },
      ],
    })

    setParticipantName('')
  }

  const updateParticipantName = (participantId: string, nextName: string) => {
    if (!tournament || tournament.status !== 'setup') {
      return
    }

    const cleanedName = nextName.trim()
    if (!cleanedName) {
      return
    }

    setTournament({
      ...tournament,
      participants: tournament.participants.map((participant) =>
        participant.id === participantId
          ? { ...participant, name: cleanedName }
          : participant,
      ),
    })
  }

  const updateParticipantGroup = (participantId: string, nextGroupId: string) => {
    if (!tournament || tournament.status !== 'setup') {
      return
    }

    if (!tournament.groups.some((group) => group.id === nextGroupId)) {
      return
    }

    setTournament({
      ...tournament,
      participants: tournament.participants.map((participant) =>
        participant.id === participantId
          ? { ...participant, groupId: nextGroupId }
          : participant,
      ),
    })
  }

  const removeParticipant = (participantId: string) => {
    if (!tournament || !canManageRoster) {
      return
    }

    if (tournament.status === 'setup') {
      setTournament({
        ...tournament,
        participants: tournament.participants.filter(
          (participant) => participant.id !== participantId,
        ),
      })
      return
    }

    setTournament({
      ...tournament,
      participants: tournament.participants.map((participant) =>
        participant.id === participantId
          ? { ...participant, isActive: false }
          : participant,
      ),
    })
  }

  const startTournament = () => {
    if (!tournament || tournament.status !== 'setup') {
      return false
    }

    if (activeParticipantsCount < 2) {
      return false
    }

    let round: Round
    try {
      round = generateSwissRound(tournament)
    } catch {
      return false
    }

    setTournament({
      ...tournament,
      status: 'running',
      rounds: [round],
    })

    return true
  }

  const createNextRound = () => {
    if (!tournament || tournament.status !== 'running') {
      return
    }

    if (findActiveRound(tournament)) {
      return
    }

    if (hasTieBreakRounds) {
      return
    }

    if (activeParticipantsCount < 2) {
      return
    }

    let nextRound: Round
    try {
      nextRound = generateSwissRound(tournament)
    } catch {
      return
    }

    setTournament({
      ...tournament,
      rounds: [...tournament.rounds, nextRound],
    })
  }

  const createPrizeBoundaryTieBreak = () => {
    if (!tournament || tournament.status !== 'running') {
      return false
    }

    if (findActiveRound(tournament)) {
      return false
    }

    if (prizeTieGroups.length === 0) {
      return false
    }

    const matches: Match[] = []
    for (const group of prizeTieGroups) {
      const participants = group
        .map((item) => participantsById.get(item.participantId))
        .filter(
          (participant): participant is NonNullable<typeof participant> =>
            Boolean(participant && (participant.isActive ?? true)),
        )

      for (let index = 0; index < participants.length; index += 1) {
        for (
          let candidateIndex = index + 1;
          candidateIndex < participants.length;
          candidateIndex += 1
        ) {
          matches.push({
            id: uid(),
            playerAId: participants[index].id,
            playerBId: participants[candidateIndex].id,
            result: null,
          })
        }
      }
    }

    if (matches.length === 0) {
      return false
    }

    setTournament({
      ...tournament,
      rounds: [
        ...tournament.rounds,
        {
          id: uid(),
          number: tournament.rounds.length + 1,
          status: 'active',
          kind: 'tiebreak',
          matches,
        },
      ],
    })

    return true
  }

  const setMatchResult = (matchId: string, value: MatchResult) => {
    if (!tournament || tournament.status !== 'running') {
      return
    }

    const currentRound = findActiveRound(tournament)
    if (!currentRound) {
      return
    }

    const updatedRound: Round = {
      ...currentRound,
      matches: currentRound.matches.map((match) =>
        match.id === matchId ? { ...match, result: value } : match,
      ),
    }

    setTournament({
      ...tournament,
      rounds: tournament.rounds.map((round) =>
        round.id === currentRound.id ? updatedRound : round,
      ),
    })
  }

  const finishCurrentRound = () => {
    if (!tournament || tournament.status !== 'running') {
      return
    }

    const currentRound = findActiveRound(tournament)
    if (!currentRound) {
      return
    }

    const isReady = currentRound.matches.every((match) => match.result !== null)
    if (!isReady) {
      return
    }

    setTournament({
      ...tournament,
      rounds: tournament.rounds.map((round) =>
        round.id === currentRound.id ? { ...round, status: 'completed' } : round,
      ),
    })
  }

  const finishTournament = () => {
    if (!tournament || tournament.status !== 'running') {
      return false
    }

    if (findActiveRound(tournament)) {
      return false
    }

    setTournament({
      ...tournament,
      status: 'finished',
    })

    return true
  }

  const resetTournament = () => {
    setTournament(null)
    setTournamentName('')
    setGroupName('')
    setParticipantName('')
    setParticipantGroupId('')
  }

  const completedRoundsCount =
    tournament?.rounds.filter((round) => round.status === 'completed').length ?? 0

  const isCurrentRoundReady =
    activeRound?.matches.every((match) => match.result !== null) ?? false

  return {
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
    prizeTieGroups,
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
    createPrizeBoundaryTieBreak,
    setMatchResult,
    finishCurrentRound,
    finishTournament,
    resetTournament,
    completedRoundsCount,
    isCurrentRoundReady,
    activeParticipantsCount,
  }
}
