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
  isActive?: boolean
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
  kind?: 'swiss' | 'tiebreak'
  matches: Match[]
}

export type Tournament = {
  id: string
  name: string
  status: TournamentStatus
  avoidSameGroupPairings?: boolean
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

type PlayerColor = 'white' | 'black'

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const round2 = (value: number) => Math.round(value * 100) / 100

const shuffle = <T>(items: T[], random: () => number) => {
  const result = [...items]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1))
    const current = result[index]
    result[index] = result[randomIndex]
    result[randomIndex] = current
  }

  return result
}

export const findActiveRound = (tournament: Tournament | null) =>
  tournament?.rounds.find((round) => round.status === 'active') ?? null

export const buildStandings = (tournament: Tournament): Standing[] => {
  const groupById = new Map(tournament.groups.map((group) => [group.id, group.name]))
  const playedParticipantIds = new Set<string>()

  for (const round of tournament.rounds) {
    for (const match of round.matches) {
      playedParticipantIds.add(match.playerAId)
      if (match.playerBId) {
        playedParticipantIds.add(match.playerBId)
      }
    }
  }

  const byPlayer = new Map<string, Standing>()
  const opponentsByPlayer = new Map<string, string[]>()

  for (const player of tournament.participants) {
    const isActive = player.isActive ?? true
    if (!isActive && !playedParticipantIds.has(player.id)) {
      continue
    }

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

const getByeCandidates = (
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

  const byLowestScore = (left: Participant, right: Participant) => {
    const leftStanding = standingsById.get(left.id)
    const rightStanding = standingsById.get(right.id)

    const leftPoints = leftStanding?.points ?? 0
    const rightPoints = rightStanding?.points ?? 0

    return leftPoints - rightPoints
  }

  const playersWithoutBye = sortedPlayers.filter(
    (player) => (byeCounts.get(player.id) ?? 0) === 0,
  )
  const playersWithBye = sortedPlayers.filter(
    (player) => (byeCounts.get(player.id) ?? 0) > 0,
  )

  // If there is at least one player without a BYE, prefer only this pool.
  // Players who already had BYE are used as a fallback when pairing is impossible.
  return [
    ...playersWithoutBye.sort(byLowestScore),
    ...playersWithBye.sort(byLowestScore),
  ]
}

const collectColorHistory = (tournament: Tournament) => {
  const history = new Map<string, PlayerColor[]>()

  for (const participant of tournament.participants) {
    history.set(participant.id, [])
  }

  for (const round of tournament.rounds) {
    for (const match of round.matches) {
      if (!match.playerBId) {
        continue
      }

      history.get(match.playerAId)?.push('white')
      history.get(match.playerBId)?.push('black')
    }
  }

  return history
}

const getColorPenalty = (history: PlayerColor[], nextColor: PlayerColor) => {
  const whiteGames = history.filter((color) => color === 'white').length
  const blackGames = history.length - whiteGames
  const nextBalance =
    whiteGames - blackGames + (nextColor === 'white' ? 1 : -1)
  const lastColor = history.at(-1)
  const previousColor = history.at(-2)

  let penalty = Math.abs(nextBalance) * 10
  if (lastColor === nextColor) {
    penalty += 8
  }
  if (lastColor === nextColor && previousColor === nextColor) {
    penalty += 30
  }

  return penalty
}

export const createColorBalancedMatches = (
  tournament: Tournament,
  pairs: Array<[Participant, Participant]>,
  random: () => number = Math.random,
): Match[] => {
  const colorHistory = collectColorHistory(tournament)

  return pairs.map(([first, second]) => {
    const firstHistory = colorHistory.get(first.id) ?? []
    const secondHistory = colorHistory.get(second.id) ?? []
    const directPenalty =
      getColorPenalty(firstHistory, 'white') +
      getColorPenalty(secondHistory, 'black')
    const reversedPenalty =
      getColorPenalty(firstHistory, 'black') +
      getColorPenalty(secondHistory, 'white')
    const reverse =
      reversedPenalty < directPenalty ||
      (reversedPenalty === directPenalty && random() < 0.5)
    const white = reverse ? second : first
    const black = reverse ? first : second

    colorHistory.set(white.id, [
      ...(colorHistory.get(white.id) ?? []),
      'white',
    ])
    colorHistory.set(black.id, [
      ...(colorHistory.get(black.id) ?? []),
      'black',
    ])

    return {
      id: uid(),
      playerAId: white.id,
      playerBId: black.id,
      result: null,
    }
  })
}

const getPairWeight = (
  player: Participant,
  candidate: Participant,
  standingsById: Map<string, Standing>,
  colorHistory: Map<string, PlayerColor[]>,
  diversityPriority: boolean,
  avoidSameGroupPairings: boolean,
) => {
  const playerStanding = standingsById.get(player.id)
  const candidateStanding = standingsById.get(candidate.id)

  const scoreDiff = Math.abs(
    (playerStanding?.points ?? 0) - (candidateStanding?.points ?? 0),
  )
  const buchholzDiff = Math.abs(
    (playerStanding?.buchholz ?? 0) - (candidateStanding?.buchholz ?? 0),
  )
  const sameGroup =
    avoidSameGroupPairings && player.groupId === candidate.groupId
  const playerColors = colorHistory.get(player.id) ?? []
  const candidateColors = colorHistory.get(candidate.id) ?? []
  const directColorPenalty =
    getColorPenalty(playerColors, 'white') +
    getColorPenalty(candidateColors, 'black')
  const reversedColorPenalty =
    getColorPenalty(playerColors, 'black') +
    getColorPenalty(candidateColors, 'white')
  const colorCompatibilityPenalty =
    Math.min(directColorPenalty, reversedColorPenalty) * 0.25

  return (
    scoreDiff * 8 +
    buchholzDiff * 1.5 +
    colorCompatibilityPenalty +
    (sameGroup ? (diversityPriority ? 50 : 7) : 0)
  )
}

const buildPairsWithoutRepeats = (
  players: Participant[],
  standingsById: Map<string, Standing>,
  previousOpponents: Map<string, Set<string>>,
  colorHistory: Map<string, PlayerColor[]>,
  diversityPriority: boolean,
  avoidSameGroupPairings: boolean,
): Array<[Participant, Participant]> | null => {
  if (players.length === 0) {
    return []
  }

  const [player, ...rest] = players
  const candidates = rest
    .filter((candidate) => !previousOpponents.get(player.id)?.has(candidate.id))
    .map((candidate) => ({
      candidate,
      weight: getPairWeight(
        player,
        candidate,
        standingsById,
        colorHistory,
        diversityPriority,
        avoidSameGroupPairings,
      ),
    }))
    .sort((left, right) => left.weight - right.weight)

  for (const option of candidates) {
    const remaining = rest.filter(
      (participant) => participant.id !== option.candidate.id,
    )
    const tailPairs = buildPairsWithoutRepeats(
      remaining,
      standingsById,
      previousOpponents,
      colorHistory,
      diversityPriority,
      avoidSameGroupPairings,
    )

    if (tailPairs) {
      return [[player, option.candidate], ...tailPairs]
    }
  }

  return null
}

export const generateSwissRound = (
  tournament: Tournament,
  random: () => number = Math.random,
): Round => {
  const standings = buildStandings(tournament)
  const standingsById = new Map(standings.map((item) => [item.participantId, item]))
  const completedRounds = tournament.rounds.filter(
    (round) => round.status === 'completed',
  ).length
  const diversityPriority = !leadersAreDefined(standings, completedRounds)
  const avoidSameGroupPairings = tournament.avoidSameGroupPairings ?? true

  const activeParticipants = tournament.participants.filter(
    (participant) => (participant.isActive ?? true),
  )

  const sortedPlayers = shuffle(activeParticipants, random).sort((left, right) => {
    const leftStanding = standingsById.get(left.id)
    const rightStanding = standingsById.get(right.id)

    if ((rightStanding?.points ?? 0) !== (leftStanding?.points ?? 0)) {
      return (rightStanding?.points ?? 0) - (leftStanding?.points ?? 0)
    }

    if ((rightStanding?.buchholz ?? 0) !== (leftStanding?.buchholz ?? 0)) {
      return (rightStanding?.buchholz ?? 0) - (leftStanding?.buchholz ?? 0)
    }

    return 0
  })

  const previousOpponents = collectPreviousOpponents(tournament)
  const colorHistory = collectColorHistory(tournament)
  const matches: Match[] = []
  const byeCandidates =
    sortedPlayers.length % 2 === 1
      ? getByeCandidates(sortedPlayers, standingsById, tournament)
      : [null]

  let finalPairs: Array<[Participant, Participant]> | null = null

  for (const byeCandidate of byeCandidates) {
    const unpairedPlayers = byeCandidate
      ? sortedPlayers.filter((player) => player.id !== byeCandidate.id)
      : sortedPlayers

    const pairs = buildPairsWithoutRepeats(
      unpairedPlayers,
      standingsById,
      previousOpponents,
      colorHistory,
      diversityPriority,
      avoidSameGroupPairings,
    )

    if (!pairs) {
      continue
    }

    if (byeCandidate) {
      matches.push({
        id: uid(),
        playerAId: byeCandidate.id,
        playerBId: null,
        result: 'bye',
      })
    }

    finalPairs = pairs
    break
  }

  if (!finalPairs) {
    throw new Error('Cannot generate Swiss round without repeated pairs')
  }

  matches.push(...createColorBalancedMatches(tournament, finalPairs, random))

  return {
    id: uid(),
    number: tournament.rounds.length + 1,
    status: 'active',
    kind: 'swiss',
    matches,
  }
}
