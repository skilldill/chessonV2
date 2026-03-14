export type TournamentStatus = 'setup' | 'running' | 'finished'
export type RoundStatus = 'active' | 'completed'
export type MatchResult = 'playerA' | 'playerB' | 'draw' | 'bye'

export type Group = {
  id: string
  name: string
}

export type Participant = {
  id: string
  name: string
  groupId: string
}

export type Match = {
  id: string
  playerAId: string
  playerBId: string | null
  result: MatchResult | null
}

export type Round = {
  id: string
  number: number
  status: RoundStatus
  matches: Match[]
}

export type Tournament = {
  id: string
  name: string
  status: TournamentStatus
  groups: Group[]
  participants: Participant[]
  rounds: Round[]
  createdAt: string
}

export type Standing = {
  participantId: string
  name: string
  groupName: string
  points: number
  buchholz: number
  wins: number
  draws: number
  losses: number
  byes: number
}

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const round2 = (value: number) => Math.round(value * 100) / 100

export const findActiveRound = (tournament: Tournament | null) =>
  tournament?.rounds.find((round) => round.status === 'active') ?? null

export const buildStandings = (tournament: Tournament): Standing[] => {
  const groupById = new Map(tournament.groups.map((group) => [group.id, group.name]))
  const byPlayer = new Map<string, Standing>()
  const opponentsByPlayer = new Map<string, string[]>()

  for (const player of tournament.participants) {
    byPlayer.set(player.id, {
      participantId: player.id,
      name: player.name,
      groupName: groupById.get(player.groupId) ?? 'Без группы',
      points: 0,
      buchholz: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      byes: 0,
    })
    opponentsByPlayer.set(player.id, [])
  }

  for (const round of tournament.rounds) {
    for (const match of round.matches) {
      const playerA = byPlayer.get(match.playerAId)
      if (!playerA) {
        continue
      }

      if (!match.playerBId) {
        if (match.result === 'bye') {
          playerA.points += 1
          playerA.byes += 1
        }
        continue
      }

      const playerB = byPlayer.get(match.playerBId)
      if (!playerB) {
        continue
      }

      opponentsByPlayer.get(match.playerAId)?.push(match.playerBId)
      opponentsByPlayer.get(match.playerBId)?.push(match.playerAId)

      if (match.result === 'playerA') {
        playerA.points += 1
        playerA.wins += 1
        playerB.losses += 1
      } else if (match.result === 'playerB') {
        playerB.points += 1
        playerB.wins += 1
        playerA.losses += 1
      } else if (match.result === 'draw') {
        playerA.points += 0.5
        playerB.points += 0.5
        playerA.draws += 1
        playerB.draws += 1
      }
    }
  }

  for (const [playerId, standing] of byPlayer.entries()) {
    const opponents = opponentsByPlayer.get(playerId) ?? []
    const buchholz = opponents.reduce((sum, opponentId) => {
      const opponent = byPlayer.get(opponentId)
      return sum + (opponent?.points ?? 0)
    }, 0)

    standing.points = round2(standing.points)
    standing.buchholz = round2(buchholz)
  }

  return [...byPlayer.values()].sort((left, right) => {
    if (right.points !== left.points) {
      return right.points - left.points
    }

    if (right.buchholz !== left.buchholz) {
      return right.buchholz - left.buchholz
    }

    if (right.wins !== left.wins) {
      return right.wins - left.wins
    }

    return left.name.localeCompare(right.name, 'ru')
  })
}

const leadersAreDefined = (standings: Standing[], completedRounds: number) => {
  if (standings.length < 2) {
    return completedRounds > 0
  }

  if (completedRounds < 2) {
    return false
  }

  return standings[0].points - standings[1].points >= 1
}

const collectPreviousOpponents = (tournament: Tournament) => {
  const map = new Map<string, Set<string>>()

  for (const participant of tournament.participants) {
    map.set(participant.id, new Set())
  }

  for (const round of tournament.rounds) {
    for (const match of round.matches) {
      if (!match.playerBId) {
        continue
      }

      map.get(match.playerAId)?.add(match.playerBId)
      map.get(match.playerBId)?.add(match.playerAId)
    }
  }

  return map
}

const chooseByePlayer = (
  sortedPlayers: Participant[],
  standingsById: Map<string, Standing>,
  tournament: Tournament,
) => {
  const byeCounts = new Map<string, number>()

  for (const participant of tournament.participants) {
    byeCounts.set(participant.id, 0)
  }

  for (const round of tournament.rounds) {
    for (const match of round.matches) {
      if (match.result === 'bye') {
        byeCounts.set(match.playerAId, (byeCounts.get(match.playerAId) ?? 0) + 1)
      }
    }
  }

  const sortedForBye = [...sortedPlayers].sort((left, right) => {
    const leftStanding = standingsById.get(left.id)
    const rightStanding = standingsById.get(right.id)

    const leftPoints = leftStanding?.points ?? 0
    const rightPoints = rightStanding?.points ?? 0

    if (leftPoints !== rightPoints) {
      return leftPoints - rightPoints
    }

    const leftByes = byeCounts.get(left.id) ?? 0
    const rightByes = byeCounts.get(right.id) ?? 0

    if (leftByes !== rightByes) {
      return leftByes - rightByes
    }

    return left.name.localeCompare(right.name, 'ru')
  })

  return sortedForBye[0]
}

export const generateSwissRound = (tournament: Tournament): Round => {
  const standings = buildStandings(tournament)
  const standingsById = new Map(standings.map((item) => [item.participantId, item]))
  const completedRounds = tournament.rounds.filter(
    (round) => round.status === 'completed',
  ).length
  const diversityPriority = !leadersAreDefined(standings, completedRounds)

  const sortedPlayers = [...tournament.participants].sort((left, right) => {
    const leftStanding = standingsById.get(left.id)
    const rightStanding = standingsById.get(right.id)

    if ((rightStanding?.points ?? 0) !== (leftStanding?.points ?? 0)) {
      return (rightStanding?.points ?? 0) - (leftStanding?.points ?? 0)
    }

    if ((rightStanding?.buchholz ?? 0) !== (leftStanding?.buchholz ?? 0)) {
      return (rightStanding?.buchholz ?? 0) - (leftStanding?.buchholz ?? 0)
    }

    return left.name.localeCompare(right.name, 'ru')
  })

  const previousOpponents = collectPreviousOpponents(tournament)
  const unpaired = [...sortedPlayers]
  const matches: Match[] = []

  if (unpaired.length % 2 === 1) {
    const byePlayer = chooseByePlayer(unpaired, standingsById, tournament)
    matches.push({
      id: uid(),
      playerAId: byePlayer.id,
      playerBId: null,
      result: 'bye',
    })

    const index = unpaired.findIndex((player) => player.id === byePlayer.id)
    unpaired.splice(index, 1)
  }

  while (unpaired.length > 1) {
    const player = unpaired.shift()
    if (!player) {
      break
    }

    const playerStanding = standingsById.get(player.id)
    let bestIndex = 0
    let bestScore = Number.POSITIVE_INFINITY

    for (let index = 0; index < unpaired.length; index += 1) {
      const candidate = unpaired[index]
      const candidateStanding = standingsById.get(candidate.id)

      const scoreDiff = Math.abs(
        (playerStanding?.points ?? 0) - (candidateStanding?.points ?? 0),
      )
      const buchholzDiff = Math.abs(
        (playerStanding?.buchholz ?? 0) - (candidateStanding?.buchholz ?? 0),
      )
      const sameGroup = player.groupId === candidate.groupId
      const alreadyPlayed =
        previousOpponents.get(player.id)?.has(candidate.id) ?? false

      const weight =
        scoreDiff * 8 +
        buchholzDiff * 1.5 +
        (sameGroup ? (diversityPriority ? 50 : 7) : 0) +
        (alreadyPlayed ? 200 : 0) +
        index * 0.25

      if (weight < bestScore) {
        bestScore = weight
        bestIndex = index
      }
    }

    const opponent = unpaired.splice(bestIndex, 1)[0]
    matches.push({
      id: uid(),
      playerAId: player.id,
      playerBId: opponent.id,
      result: null,
    })
  }

  return {
    id: uid(),
    number: tournament.rounds.length + 1,
    status: 'active',
    matches,
  }
}
