import { useEffect, useRef, useState } from "react";
import { Link, useHistory, useLocation, useParams } from "react-router-dom";
import { API_PREFIX, TOURNAMENT_WS_URL } from "../../constants/api";
import { TOURNAMENT_MAX_PLAYERS, TOURNAMENT_MAX_ROUNDS } from "../../constants/tournament";
import { AppTopBar } from "../../components/AppTopBar/AppTopBar";
import { RoomTimeModal } from "../../components/RoomTimeModal/RoomTimeModal";
import { getRoomTimeSettingsFromStorage, setRoomTimeSettingsToStorage } from "../../utils/roomTimeStorage";
import { useTranslation } from "react-i18next";

type TournamentParticipant = {
  id: string;
  userId: string | null;
  nickname: string;
  avatar: string;
  active: boolean;
  removed: boolean;
  connected: boolean;
};

type TournamentMatch = {
  id: string;
  playerAId: string;
  playerBId: string | null;
  gameRoomId: string | null;
  status: "pending" | "active" | "completed";
  result: "playerA" | "playerB" | "draw" | "bye" | "absent" | null;
};

type TournamentRound = {
  id: string;
  number: number;
  kind?: "swiss" | "tiebreak";
  status: "active" | "completed";
  matches: TournamentMatch[];
};

type TournamentStanding = {
  participantId: string;
  nickname: string;
  points: number;
  buchholz: number;
  wins: number;
  draws: number;
  losses: number;
  byes: number;
};

type Tournament = {
  id: string;
  title: string;
  roundsCount: number;
  timeControl: {
    timeMinutes: number;
    incrementSeconds: number;
  };
  roundDelaySeconds: number;
  coffeeBreak: {
    enabled: boolean;
    afterRound: number;
    durationMinutes: number;
  };
  creatorUserId?: string;
  canManage?: boolean;
  status: "setup" | "scheduled" | "running" | "finished";
  participants: TournamentParticipant[];
  rounds: TournamentRound[];
  currentRoundNumber: number;
  finishAfterCurrentRound: boolean;
  tieBreakDeclined: boolean;
  nextRoundDelayKind?: "regular" | "coffeeBreak" | null;
  tieBreakAvailable: boolean;
  startAt?: string;
  waitingForPlayers?: boolean;
  standings: TournamentStanding[];
};

const TOURNAMENT_GUEST_ID_KEY = "tournamentGuestId";
const TOURNAMENT_PARTICIPANT_KEY_PREFIX = "tournamentParticipant:";
const TOURNAMENT_GAME_PROFILE_KEY = "tournamentGameProfile";
const TOURNAMENT_COMPLETED_GAME_KEY = "tournamentCompletedGame";
const ROUND_DELAY_SECONDS_OPTIONS = [0, 5, 10, 15, 30, 60, 120, 300];
const COFFEE_BREAK_MINUTES_OPTIONS = [1, 3, 5, 10, 15, 30, 45, 60];

function getOrCreateGuestId() {
  const existingId = localStorage.getItem(TOURNAMENT_GUEST_ID_KEY);
  if (existingId) return existingId;

  const nextId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID().replace(/-/g, "")
    : `${Date.now()}${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(TOURNAMENT_GUEST_ID_KEY, nextId);
  return nextId;
}

function getStoredParticipant(tournamentId: string) {
  const raw = localStorage.getItem(`${TOURNAMENT_PARTICIPANT_KEY_PREFIX}${tournamentId}`);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as { id: string; nickname: string; avatar: string };
  } catch {
    return null;
  }
}

function storeParticipant(tournamentId: string, participant: { id: string; nickname: string; avatar: string }) {
  localStorage.setItem(`${TOURNAMENT_PARTICIPANT_KEY_PREFIX}${tournamentId}`, JSON.stringify(participant));
}

function participantName(tournament: Tournament, participantId: string | null) {
  if (!participantId) return "BYE";
  return tournament.participants.find((participant) => participant.id === participantId)?.nickname || "Player";
}

function resultLabel(match: TournamentMatch, t: (key: string) => string) {
  if (match.status !== "completed") return t("tournament.matchInProgress");
  if (match.result === "absent") return "0";
  if (match.result === "bye") return "1-0";
  if (match.result === "draw") return "1/2-1/2";
  if (match.result === "playerA") return "1-0";
  if (match.result === "playerB") return "0-1";
  return t("tournament.matchCompleted");
}

function TournamentMatchPlayers({ tournament, match }: { tournament: Tournament; match: TournamentMatch }) {
  const label = `${participantName(tournament, match.playerAId)} - ${participantName(tournament, match.playerBId)}`;

  if (!match.gameRoomId) {
    return <span>{label}</span>;
  }

  return (
    <a
      href={`/game/${match.gameRoomId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-white underline decoration-[#555ab9b3] underline-offset-4 transition-colors hover:text-[#b9baff]"
    >
      {label}
    </a>
  );
}

function formatCountdown(totalSeconds: number) {
  const seconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;
  return minutes > 0 ? `${minutes}:${restSeconds.toString().padStart(2, "0")}` : `${restSeconds}`;
}

function formatDelayLabel(seconds: number, t: (key: string, options?: Record<string, unknown>) => string) {
  if (seconds < 60) {
    return t("tournament.secondsShort", { count: seconds });
  }

  if (seconds % 60 === 0) {
    return t("tournament.minutesShort", { count: seconds / 60 });
  }

  return t("tournament.minutesSecondsShort", {
    minutes: Math.floor(seconds / 60),
    seconds: seconds % 60,
  });
}

function getPrizeBadge(place: number) {
  if (place === 1) return `🥇 ${place}`;
  if (place === 2) return `🥈 ${place}`;
  if (place === 3) return `🥉 ${place}`;
  return `${place}`;
}

function getPrizeRowClass(place: number) {
  if (place === 1) return "border-[#d4af37]/40 bg-[#d4af37]/15";
  if (place === 2) return "border-[#a5adba]/40 bg-[#a5adba]/15";
  if (place === 3) return "border-[#b87333]/40 bg-[#b87333]/15";
  return "border-white/10 bg-black/10";
}

function getPrizeBadgeClass(place: number) {
  if (place === 1) return "bg-[#d4af37]/25 text-[#f6d97a]";
  if (place === 2) return "bg-[#a5adba]/25 text-[#d5dae4]";
  if (place === 3) return "bg-[#b87333]/25 text-[#e9b083]";
  return "text-white/50";
}

type TimeOptionModalProps = {
  isOpen: boolean;
  title: string;
  subtitle: string;
  options: number[];
  selectedValue: number;
  renderValue: (value: number) => string;
  onSelect: (value: number) => void;
  onClose: () => void;
};

function TimeOptionModal({ isOpen, title, subtitle, options, selectedValue, renderValue, onSelect, onClose }: TimeOptionModalProps) {
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <button type="button" aria-label={t("common.close")} onClick={onClose} className="absolute inset-0 cursor-default" />
      <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#121217] p-6 shadow-2xl">
        <h4 className="text-white text-xl font-semibold text-center">{title}</h4>
        <p className="text-white/60 text-sm text-center mt-2">{subtitle}</p>
        <div className="mt-6 grid grid-cols-4 gap-2">
          {options.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onSelect(value)}
              className={`h-11 rounded-lg border text-sm font-semibold transition-colors ${
                selectedValue === value
                  ? "border-[#555ab9b3] bg-[#4f39f633] text-white"
                  : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              {renderValue(value)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 h-11 w-full rounded-xl bg-[#4f39f6] text-sm font-semibold text-white hover:bg-[#432dd9]"
        >
          {t("common.save")}
        </button>
      </div>
    </div>
  );
}

export function CreateTournamentScreen() {
  const { t } = useTranslation();
  const history = useHistory();
  const initialRoomTime = getRoomTimeSettingsFromStorage();
  const [title, setTitle] = useState("");
  const [roundsCount, setRoundsCount] = useState(5);
  const [timeMinutes, setTimeMinutes] = useState(initialRoomTime.timeMinutes);
  const [incrementSeconds, setIncrementSeconds] = useState(initialRoomTime.incrementSeconds);
  const [roundDelaySeconds, setRoundDelaySeconds] = useState(15);
  const [coffeeBreakEnabled, setCoffeeBreakEnabled] = useState(false);
  const [coffeeBreakAfterRound, setCoffeeBreakAfterRound] = useState(1);
  const [coffeeBreakDurationMinutes, setCoffeeBreakDurationMinutes] = useState(5);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [isRoundDelayModalOpen, setIsRoundDelayModalOpen] = useState(false);
  const [isCoffeeBreakDurationModalOpen, setIsCoffeeBreakDurationModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setRoomTimeSettingsToStorage(timeMinutes, incrementSeconds);
  }, [timeMinutes, incrementSeconds]);

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const response = await fetch(`${API_PREFIX}/tournaments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          roundsCount,
          timeMinutes,
          incrementSeconds,
          roundDelaySeconds,
          coffeeBreak: {
            enabled: coffeeBreakEnabled,
            afterRound: coffeeBreakAfterRound,
            durationMinutes: coffeeBreakDurationMinutes,
          },
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || t("tournament.createError"));
      history.push(`/tournaments/${data.tournament.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("tournament.createError"));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-[100vh] text-white px-4 py-20">
      <AppTopBar />
      <main className="mx-auto flex w-full max-w-[520px] flex-col gap-5">
        <h1 className="text-2xl font-bold">{t("tournament.newTitle")}</h1>
        <label className="flex flex-col gap-2 text-sm text-white/70">
          {t("tournament.titleLabel")}
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-12 rounded-lg border border-white/15 bg-white/10 px-4 text-base text-white outline-none focus:border-[#4f39f6]"
            placeholder={t("tournament.titlePlaceholder")}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-white/70">
          {t("tournament.roundsCountLabel")}
          <input
            value={roundsCount}
            onChange={(event) => setRoundsCount(Math.max(1, Number(event.target.value) || 1))}
            type="number"
            min={1}
            max={TOURNAMENT_MAX_ROUNDS}
            className="h-12 rounded-lg border border-white/15 bg-white/10 px-4 text-base text-white outline-none focus:border-[#4f39f6]"
          />
        </label>
        <button
          type="button"
          onClick={() => setIsTimeModalOpen(true)}
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-left text-white hover:bg-white/10"
        >
          <div className="text-white/50 text-xs">{t("tournament.gameTime")}</div>
          <div className="text-white/90 text-base font-semibold mt-1">{timeMinutes} + {incrementSeconds}</div>
        </button>

        <button
          type="button"
          onClick={() => setIsRoundDelayModalOpen(true)}
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-left text-white hover:bg-white/10"
        >
          <div className="text-white/50 text-xs">{t("tournament.roundDelay")}</div>
          <div className="text-white/90 text-base font-semibold mt-1">{formatDelayLabel(roundDelaySeconds, t)}</div>
        </button>

        <label className="flex items-center gap-3 rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white">
          <input
            type="checkbox"
            checked={!coffeeBreakEnabled}
            onChange={(event) => setCoffeeBreakEnabled(!event.target.checked)}
            className="h-4 w-4 accent-[#4f39f6]"
          />
          <span className="text-sm font-semibold">{t("tournament.noCoffeeBreak")}</span>
        </label>

        {coffeeBreakEnabled && (
          <div className="grid gap-3 rounded-lg border border-[#555ab9b3] bg-[#4f39f633] p-4">
            <label className="flex flex-col gap-2 text-sm text-white/70">
              {t("tournament.coffeeBreakAfterRound")}
              <input
                value={coffeeBreakAfterRound}
                onChange={(event) => setCoffeeBreakAfterRound(Math.max(1, Math.min(Number(event.target.value) || 1, roundsCount)))}
                type="number"
                min={1}
                max={roundsCount}
                className="h-11 rounded-lg border border-white/15 bg-black/20 px-3 text-white outline-none focus:border-[#4f39f6]"
              />
            </label>
            <button
              type="button"
              onClick={() => setIsCoffeeBreakDurationModalOpen(true)}
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-left text-white hover:bg-white/10"
            >
              <div className="text-white/50 text-xs">{t("tournament.coffeeBreakDuration")}</div>
              <div className="text-white/90 text-base font-semibold mt-1">
                {t("tournament.minutesShort", { count: coffeeBreakDurationMinutes })}
              </div>
            </button>
          </div>
        )}

        {error && <div className="rounded-lg border border-red-500/50 bg-red-500/15 p-3 text-sm text-red-200">{error}</div>}
        <button
          type="button"
          disabled={isCreating || !title.trim()}
          onClick={handleCreate}
          className="h-12 rounded-lg bg-[#4f39f6] px-4 font-semibold text-white transition-opacity hover:bg-[#432dd9] disabled:opacity-50"
        >
          {t("tournament.create")}
        </button>

        <RoomTimeModal
          isOpen={isTimeModalOpen}
          isCreating={isCreating}
          timeMinutes={timeMinutes}
          incrementSeconds={incrementSeconds}
          withAIhints={false}
          showAdvancedOptions={false}
          title={t("tournament.gameTimeTitle")}
          subtitle={t("tournament.gameTimeSubtitle")}
          startPositionMode="default"
          customFEN=""
          onChangeTimeMinutes={setTimeMinutes}
          onChangeIncrementSeconds={setIncrementSeconds}
          onChangeWithAIhints={() => undefined}
          onChangeStartPositionMode={() => undefined}
          onChangeCustomFEN={() => undefined}
          onClose={() => setIsTimeModalOpen(false)}
          onConfirm={() => setIsTimeModalOpen(false)}
        />
        <TimeOptionModal
          isOpen={isRoundDelayModalOpen}
          title={t("tournament.roundDelayTitle")}
          subtitle={t("tournament.roundDelaySubtitle")}
          options={ROUND_DELAY_SECONDS_OPTIONS}
          selectedValue={roundDelaySeconds}
          renderValue={(value) => formatDelayLabel(value, t)}
          onSelect={setRoundDelaySeconds}
          onClose={() => setIsRoundDelayModalOpen(false)}
        />
        <TimeOptionModal
          isOpen={isCoffeeBreakDurationModalOpen}
          title={t("tournament.coffeeBreakDurationTitle")}
          subtitle={t("tournament.coffeeBreakDurationSubtitle")}
          options={COFFEE_BREAK_MINUTES_OPTIONS}
          selectedValue={coffeeBreakDurationMinutes}
          renderValue={(value) => t("tournament.minutesShort", { count: value })}
          onSelect={setCoffeeBreakDurationMinutes}
          onClose={() => setIsCoffeeBreakDurationModalOpen(false)}
        />
      </main>
    </div>
  );
}

export function TournamentRoomScreen() {
  const { t } = useTranslation();
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const history = useHistory();
  const location = useLocation();
  const isViewOnly = new URLSearchParams(location.search).get("viewOnly") === "true";
  const wsRef = useRef<WebSocket | null>(null);
  const openedGameRoomRef = useRef<string | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participant, setParticipant] = useState(getStoredParticipant(tournamentId));
  const [nickname, setNickname] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCurrentUserChecked, setIsCurrentUserChecked] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const [isShareCopied, setIsShareCopied] = useState(false);
  const [isBroadcastCopied, setIsBroadcastCopied] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const playerCount = tournament?.participants.filter((item) => !item.removed).length || 0;
  const currentRound = tournament?.rounds.find((round) => round.number === tournament.currentRoundNumber);
  const standingsByParticipantId = new Map(
    (tournament?.standings || []).map((standing, index) => [standing.participantId, { ...standing, place: index + 1 }])
  );
  const sortedParticipants = [...(tournament?.participants || [])]
    .filter((item) => !item.removed)
    .sort((firstPlayer, secondPlayer) => {
      const firstStanding = standingsByParticipantId.get(firstPlayer.id);
      const secondStanding = standingsByParticipantId.get(secondPlayer.id);
      const pointsDiff = (secondStanding?.points || 0) - (firstStanding?.points || 0);
      if (pointsDiff !== 0) return pointsDiff;

      const buchholzDiff = (secondStanding?.buchholz || 0) - (firstStanding?.buchholz || 0);
      if (buchholzDiff !== 0) return buchholzDiff;

      const winsDiff = (secondStanding?.wins || 0) - (firstStanding?.wins || 0);
      if (winsDiff !== 0) return winsDiff;

      return firstPlayer.nickname.localeCompare(secondPlayer.nickname, "ru");
    });
  const hasTieBreakRounds = Boolean(tournament?.rounds.some((round) => round.kind === "tiebreak"));
  const displayedPlacesByParticipantId = new Map<string, number>();
  if (tournament?.status === "finished" && !hasTieBreakRounds) {
    let currentPlace = 0;
    for (let index = 0; index < sortedParticipants.length; index++) {
      const participantItem = sortedParticipants[index];
      const currentStanding = standingsByParticipantId.get(participantItem.id);
      const previousStanding = standingsByParticipantId.get(sortedParticipants[index - 1]?.id);
      if (
        previousStanding &&
        currentStanding?.points === previousStanding.points &&
        currentStanding?.buchholz === previousStanding.buchholz
      ) {
        displayedPlacesByParticipantId.set(participantItem.id, currentPlace);
      } else {
        currentPlace += 1;
        displayedPlacesByParticipantId.set(participantItem.id, currentPlace);
      }
    }
  }
  const participantMatch = currentRound?.matches.find((match) =>
    participant?.id && (match.playerAId === participant.id || match.playerBId === participant.id)
  );
  const canOpenGame = participantMatch?.gameRoomId && participantMatch.status === "active";
  const startAtMs = tournament?.startAt ? new Date(tournament.startAt).getTime() : null;
  const secondsToStart = startAtMs ? Math.max(0, Math.ceil((startAtMs - nowMs) / 1000)) : 0;
  const isCoffeeBreakActive = tournament?.status === "scheduled" && tournament.nextRoundDelayKind === "coffeeBreak";
  const nextRoundDelaySeconds =
    isCoffeeBreakActive &&
    tournament?.coffeeBreak?.enabled
      ? tournament.coffeeBreak.durationMinutes * 60
      : tournament?.roundDelaySeconds ?? 15;
  const isTournamentFull = playerCount >= TOURNAMENT_MAX_PLAYERS;
  const isLateParticipantWaiting =
    Boolean(participant) &&
    tournament?.status === "running" &&
    !participantMatch &&
    currentRound?.status === "active";
  const participantInTournament = participant
    ? tournament?.participants.find((item) => item.id === participant.id && !item.removed)
    : undefined;

  const refreshTournament = async () => {
    const response = await fetch(`${API_PREFIX}/tournaments/${tournamentId}`, { credentials: "include" });
    const data = await response.json();
    if (data.success) setTournament(data.tournament);
  };

  useEffect(() => {
    refreshTournament();
    fetch(`${API_PREFIX}/auth/me`, { credentials: "include" })
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.user?.id) {
          setCurrentUserId(data.user.id);
        }
      })
      .catch(() => undefined)
      .finally(() => setIsCurrentUserChecked(true));
    const query = !isViewOnly && participant?.id ? `&participantId=${encodeURIComponent(participant.id)}` : "";
    const ws = new WebSocket(`${TOURNAMENT_WS_URL}?tournamentId=${encodeURIComponent(tournamentId)}${query}`);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "tournamentState") {
        setTournament((previous) => ({
          ...data.tournament,
          canManage: data.tournament.canManage ?? previous?.canManage,
        }));
      }
    };
    return () => ws.close(1000, "Tournament screen closed");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId, participant?.id, isViewOnly]);

  useEffect(() => {
    if (!tournament?.startAt) {
      return;
    }

    const interval = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [tournament?.startAt]);

  useEffect(() => {
    if (isViewOnly || !participant || !participantMatch?.gameRoomId || participantMatch.status !== "active") {
      return;
    }

    if (localStorage.getItem(TOURNAMENT_COMPLETED_GAME_KEY) === `${tournamentId}:${participantMatch.gameRoomId}`) {
      return;
    }

    if (openedGameRoomRef.current === participantMatch.gameRoomId) {
      return;
    }

    openedGameRoomRef.current = participantMatch.gameRoomId;
    localStorage.setItem(
      TOURNAMENT_GAME_PROFILE_KEY,
      JSON.stringify({
        tournamentId,
        roomId: participantMatch.gameRoomId,
        playerName: participant.nickname,
        avatar: participant.avatar,
      })
    );
    localStorage.setItem(
      "gameData",
      JSON.stringify({
        gameId: participantMatch.gameRoomId,
        playerName: participant.nickname,
        avatar: participant.avatar,
      })
    );
    history.push(`/game/${participantMatch.gameRoomId}`);
  }, [history, isViewOnly, participant, participantMatch?.gameRoomId, participantMatch?.status, tournamentId]);

  useEffect(() => {
    if (isViewOnly || !tournament || !currentUserId || participant) {
      return;
    }

    const ownParticipant = tournament.participants.find((item) => item.userId === currentUserId && item.active && !item.removed);
    if (!ownParticipant) {
      return;
    }

    const nextParticipant = {
      id: ownParticipant.id,
      nickname: ownParticipant.nickname,
      avatar: ownParticipant.avatar,
    };
    setParticipant(nextParticipant);
    storeParticipant(tournamentId, nextParticipant);
  }, [currentUserId, isViewOnly, participant, tournament, tournamentId]);

  useEffect(() => {
    if (isViewOnly || !participant || !tournament) {
      return;
    }

    const currentParticipant = tournament.participants.find((item) => item.id === participant.id && !item.removed);
    if (currentParticipant && !currentParticipant.active && tournament.status !== "finished") {
      setParticipant(null);
    }
  }, [isViewOnly, participant, tournament]);

  const callAction = async (path: string, body?: unknown) => {
    setIsBusy(true);
    setError(null);
    try {
      const response = await fetch(`${API_PREFIX}/tournaments/${tournamentId}${path}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || t("tournament.actionError"));
      if (data.tournament) {
        setTournament((previous) => ({
          ...data.tournament,
          canManage: data.tournament.canManage ?? previous?.canManage,
        }));
      }
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("tournament.actionError"));
      return null;
    } finally {
      setIsBusy(false);
    }
  };

  const handleJoin = async () => {
    const guestId = getOrCreateGuestId();
    const data = await callAction("/join", { nickname, participantId: guestId, avatar: "0" });
    if (data?.participant) {
      setParticipant(data.participant);
      storeParticipant(tournamentId, data.participant);
    }
  };

  const handleLeave = async () => {
    if (!participant) return;
    const data = await callAction("/leave", { participantId: participant.id });
    if (data?.success) {
      setParticipant(null);
      setShowLeaveConfirm(false);
    }
  };

  const handleFinishTournament = async () => {
    const data = await callAction("/finish-after-round");
    if (data?.success) {
      setShowFinishConfirm(false);
    }
  };

  const handleShare = async () => {
    const tournamentUrl = `${window.location.origin}/tournaments/${tournamentId}`;

    try {
      await navigator.clipboard.writeText(tournamentUrl);
      setIsShareCopied(true);
      window.setTimeout(() => setIsShareCopied(false), 2000);
    } catch (error) {
      setError(t("tournament.shareError"));
    }
  };

  const handleShareBroadcast = async () => {
    const broadcastUrl = `${window.location.origin}/tournaments/${tournamentId}?viewOnly=true`;

    try {
      await navigator.clipboard.writeText(broadcastUrl);
      setIsBroadcastCopied(true);
      window.setTimeout(() => setIsBroadcastCopied(false), 2000);
    } catch (error) {
      setError(t("tournament.shareError"));
    }
  };

  const getParticipantStatus = (item: TournamentParticipant) => {
    if (!item.active) {
      return { label: t("tournament.status.left"), className: "px-3 py-2 text-white/40" };
    }

    const currentMatch = currentRound?.matches.find(
      (match) =>
        (match.playerAId === item.id || match.playerBId === item.id)
    );

    if (currentMatch?.status === "active") {
      return { label: t("tournament.status.playing"), className: "px-3 py-2 text-yellow-300" };
    }

    if (currentMatch?.status === "completed" && !item.connected) {
      return { label: t("tournament.status.reviewingGame"), className: "px-3 py-2 text-yellow-300" };
    }

    return { label: t("tournament.status.waitingNextRound"), className: "px-3 py-2 text-emerald-300" };
  };

  const isCreator = Boolean(
    tournament?.canManage ||
    (tournament?.creatorUserId && currentUserId && tournament.creatorUserId === currentUserId)
  );
  return (
    <div className="min-h-[100vh] text-white px-4 py-20">
      {!isViewOnly && <AppTopBar />}
      <main className="mx-auto grid w-full max-w-[1120px] gap-5 lg:grid-cols-[360px_1fr]">
        <section className="flex flex-col gap-4">
          {!isViewOnly && <Link to="/main" className="text-sm text-white/60 hover:text-white">{t("common.back")}</Link>}
          <div>
            <h1 className="text-2xl font-bold">{tournament?.title || t("tournament.defaultTitle")}</h1>
            <p className="text-sm text-white/60">
              {t("tournament.summary", {
                playerCount,
                maxPlayers: TOURNAMENT_MAX_PLAYERS,
                roundsCount: tournament?.roundsCount || 0,
                timeMinutes: tournament?.timeControl?.timeMinutes || 10,
                incrementSeconds: tournament?.timeControl?.incrementSeconds || 0,
                status: tournament?.status || "loading",
              })}
            </p>
          </div>

          {!isViewOnly && (
            <div className="grid gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="h-10 rounded-lg border border-[#555ab9b3] bg-[#4f39f633] text-sm font-semibold text-white hover:bg-[#4f39f64d] transition-colors"
              >
                {isShareCopied ? t("tournament.shareCopied") : t("tournament.share")}
              </button>
              <button
                type="button"
                onClick={handleShareBroadcast}
                className="h-10 rounded-lg border border-white/15 bg-white/10 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
              >
                {isBroadcastCopied ? t("tournament.broadcastCopied") : t("tournament.shareBroadcast")}
              </button>
            </div>
          )}

          {tournament?.status === "scheduled" && tournament.startAt && (
            <div className="rounded-lg border border-[#555ab9b3] bg-[#4f39f633] p-4">
              <div className="text-sm text-white/70">
                {tournament.currentRoundNumber > 0 ? t("tournament.nextRoundStartsIn") : t("tournament.startsIn")}
              </div>
              <div className="mt-1 text-3xl font-bold text-[#4f39f6]">{formatCountdown(secondsToStart)}</div>
              {!isViewOnly && isCreator && isCoffeeBreakActive && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => callAction("/end-coffee-break")}
                  className="mt-3 h-10 w-full rounded-lg bg-[#4f39f6] text-sm font-semibold text-white hover:bg-[#432dd9] disabled:opacity-50"
                >
                  {t("tournament.endCoffeeBreak")}
                </button>
              )}
            </div>
          )}

          {isLateParticipantWaiting && (
            <div className="rounded-lg border border-[#555ab9b3] bg-[#4f39f633] p-4 text-sm text-white/85">
              {t("tournament.lateJoinHint")}
            </div>
          )}

          {tournament?.waitingForPlayers && (
            <div className="rounded-lg border border-[#555ab9b3] bg-[#4f39f633] p-4 text-sm text-white/80">
              {t("tournament.waitingForPlayers")}
            </div>
          )}

          {!isViewOnly && (!participant || (participantInTournament && !participantInTournament.active)) && isCurrentUserChecked && tournament?.status !== "finished" && (
            <div className="flex flex-col gap-3 rounded-lg border border-white/15 bg-white/5 p-4">
              {!currentUserId && (
                <input
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  className="h-11 rounded-lg border border-white/15 bg-black/20 px-3 text-white outline-none"
                  placeholder={t("tournament.nicknamePlaceholder")}
                />
              )}
              <button
                type="button"
                disabled={isBusy || isTournamentFull}
                onClick={handleJoin}
                className="h-11 rounded-lg bg-[#4f39f6] font-semibold text-white hover:bg-[#432dd9] disabled:opacity-50"
              >
                {isTournamentFull ? t("tournament.full") : participantInTournament ? t("tournament.rejoin") : t("tournament.join")}
              </button>
            </div>
          )}

          {!isViewOnly && participant && tournament?.status !== "finished" && participantInTournament?.active && (
            <div className="flex flex-col gap-3 rounded-lg border border-white/15 bg-white/5 p-4">
              <div className="text-sm text-white/70">{t("tournament.playingAs")}</div>
              <div className="text-lg font-semibold">{participant.nickname}</div>
              {canOpenGame && <div className="text-sm text-[#4f39f6]">{t("tournament.gameOpening")}</div>}
              <button type="button" disabled={isBusy} onClick={() => setShowLeaveConfirm(true)} className="h-10 rounded-lg border border-white/15 bg-white/10 text-sm">
                {t("tournament.leave")}
              </button>
            </div>
          )}

          {!isViewOnly && isCreator && tournament && tournament.status !== "finished" && (
            <div className="flex flex-col gap-2 rounded-lg border border-white/15 bg-white/5 p-4">
              {(tournament.status === "setup" || (tournament.status === "scheduled" && tournament.rounds.length === 0)) && (
                playerCount < 3 ? (
                  <div className="rounded-lg border border-[#555ab9b3] bg-[#4f39f633] px-3 py-2 text-center text-sm text-white/85">
                    {t("tournament.minPlayersHint")}
                  </div>
                ) : (
                  <>
                    <button type="button" disabled={isBusy} onClick={() => callAction("/start", { delaySeconds: 0 })} className="h-10 rounded-lg bg-[#4f39f6] text-sm font-semibold text-white hover:bg-[#432dd9] disabled:opacity-50">{t("tournament.startNow")}</button>
                    <button type="button" disabled={isBusy} onClick={() => callAction("/start", { delaySeconds: 60 })} className="h-10 rounded-lg bg-white/10 text-sm">{t("tournament.startInOneMinute")}</button>
                    <button type="button" disabled={isBusy} onClick={() => callAction("/start", { delaySeconds: 300 })} className="h-10 rounded-lg bg-white/10 text-sm">{t("tournament.startInFiveMinutes")}</button>
                  </>
                )
              )}
              {tournament.status === "running" && (
                <>
                  {tournament.waitingForPlayers && (
                    <button type="button" disabled={isBusy} onClick={() => callAction("/force-next-round")} className="h-10 rounded-lg bg-[#4f39f6] text-sm font-semibold text-white hover:bg-[#432dd9] disabled:opacity-50">
                      {t("tournament.forceNextRoundWithDelay", { delay: formatDelayLabel(nextRoundDelaySeconds, t) })}
                    </button>
                  )}
                  <button type="button" disabled={isBusy} onClick={() => callAction("/add-round")} className="h-10 rounded-lg bg-white/10 text-sm">
                    {t("tournament.addRound")}
                  </button>
                  {tournament.finishAfterCurrentRound ? (
                    <div className="rounded-lg border border-[#555ab9b3] bg-[#4f39f633] px-3 py-2 text-center text-sm text-white/85">
                      {t("tournament.finishAfterRoundNotice")}
                    </div>
                  ) : (
                    <button type="button" disabled={isBusy} onClick={() => setShowFinishConfirm(true)} className="h-10 rounded-lg border border-[#555ab9b3] bg-[#4f39f633] text-sm text-white/85 hover:bg-[#4f39f64d] disabled:opacity-50">
                      {t("tournament.finishNow")}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {error && <div className="rounded-lg border border-red-500/50 bg-red-500/15 p-3 text-sm text-red-200">{error}</div>}

          {!isViewOnly && isCreator && tournament?.tieBreakAvailable && (
            <div className="grid gap-3 rounded-lg border border-[#555ab9b3] bg-[#4f39f633] p-4">
              <div>
                <div className="text-sm font-semibold text-white">{t("tournament.tieBreakTitle")}</div>
                <div className="mt-1 text-sm text-white/70">{t("tournament.tieBreakDescription")}</div>
              </div>
              <button type="button" disabled={isBusy} onClick={() => callAction("/create-tie-break")} className="h-10 rounded-lg bg-[#4f39f6] text-sm font-semibold text-white disabled:opacity-50">
                {t("tournament.createTieBreak")}
              </button>
              <button type="button" disabled={isBusy} onClick={() => callAction("/decline-tie-break")} className="h-10 rounded-lg bg-white/10 text-sm text-white disabled:opacity-50">
                {t("tournament.sharePrizePlaces")}
              </button>
            </div>
          )}
        </section>

        <section className="grid gap-5">
          <div className="rounded-lg border border-white/15 bg-white/5 p-4">
            <h2 className="mb-3 text-lg font-semibold">{t("tournament.players")}</h2>
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-white/10 text-xs uppercase tracking-wide text-white/50">
                  <tr>
                    <th className="px-3 py-2 font-semibold">#</th>
                    <th className="px-3 py-2 font-semibold">{t("tournament.table.player")}</th>
                    {tournament?.status !== "finished" && <th className="px-3 py-2 font-semibold">{t("tournament.table.status")}</th>}
                    <th className="px-3 py-2 font-semibold">{t("tournament.table.points")}</th>
                    <th className="px-3 py-2 font-semibold">{t("tournament.table.buchholz")}</th>
                    <th className="px-3 py-2 font-semibold">{t("tournament.table.wins")}</th>
                    {!isViewOnly && isCreator && tournament?.status !== "finished" && <th className="px-3 py-2 font-semibold" />}
                  </tr>
                </thead>
                <tbody>
                  {sortedParticipants.map((item, index) => {
                    const standing = standingsByParticipantId.get(item.id);
                    const playerStatus = getParticipantStatus(item);

                    return (
                      <tr
                        key={item.id}
                        className={`border-t ${tournament?.status === "finished" ? getPrizeRowClass(displayedPlacesByParticipantId.get(item.id) ?? index + 1) : "border-white/10 bg-black/10"}`}
                      >
                        <td className="px-3 py-2 text-white/50">
                          {(() => {
                            const place = displayedPlacesByParticipantId.get(item.id) ?? index + 1;
                            if (tournament?.status !== "finished" || place > 3) return place;
                            return (
                              <span className={`inline-flex min-w-[52px] items-center justify-center rounded-full px-2 py-0.5 font-semibold ${getPrizeBadgeClass(place)}`}>
                                {getPrizeBadge(place)}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-3 py-2 font-medium text-white">{item.nickname}</td>
                        {tournament?.status !== "finished" && (
                          <td className={playerStatus.className}>{playerStatus.label}</td>
                        )}
                        <td className="px-3 py-2 text-white/80">{standing?.points || 0}</td>
                        <td className="px-3 py-2 text-white/60">{standing?.buchholz || 0}</td>
                        <td className="px-3 py-2 text-white/60">{standing?.wins || 0}</td>
                        {!isViewOnly && isCreator && tournament?.status !== "finished" && (
                          <td className="px-3 py-2 text-right">
                            {item.id !== participant?.id && (
                              <button type="button" onClick={() => callAction("/remove-player", { participantId: item.id })} className="rounded border border-white/15 px-2 py-1 text-white/70 hover:bg-white/10">
                                {t("tournament.remove")}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {sortedParticipants.length === 0 && (
                    <tr>
                      <td colSpan={!isViewOnly && isCreator && tournament?.status !== "finished" ? 7 : tournament?.status === "finished" ? 5 : 6} className="px-3 py-5 text-center text-white/50">
                        {t("tournament.noPlayers")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {tournament?.status === "finished" ? (
            <div className="rounded-lg border border-white/15 bg-white/5 p-4">
              <h2 className="mb-3 text-lg font-semibold">{t("tournament.allRounds")}</h2>
              <div className="grid gap-4">
                {tournament.rounds.map((round) => (
                  <div key={round.id} className="grid gap-2">
                    <div className="text-sm font-semibold text-white/80">{t("tournament.roundNumber", { number: round.number })}</div>
                    {round.matches.map((match) => (
                      <div key={match.id} className="grid gap-2 rounded-md bg-black/20 px-3 py-2 text-sm sm:grid-cols-[1fr_auto]">
                        <TournamentMatchPlayers tournament={tournament} match={match} />
                        <span className="text-white/70">{resultLabel(match, t)}</span>
                      </div>
                    ))}
                  </div>
                ))}
                {tournament.rounds.length === 0 && <div className="text-sm text-white/60">{t("tournament.noRounds")}</div>}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-white/15 bg-white/5 p-4">
              <h2 className="mb-3 text-lg font-semibold">
                {currentRound ? t("tournament.currentRoundNumber", { number: currentRound.number }) : t("tournament.currentRound")}
              </h2>
              <div className="grid gap-2">
                {(currentRound?.matches || []).map((match) => (
                  <div key={match.id} className="grid gap-2 rounded-md bg-black/20 px-3 py-2 text-sm sm:grid-cols-[1fr_auto]">
                    <TournamentMatchPlayers tournament={tournament!} match={match} />
                    <span className="text-white/70">{resultLabel(match, t)}</span>
                  </div>
                ))}
                {!currentRound && <div className="text-sm text-white/60">{t("tournament.roundNotStarted")}</div>}
              </div>
            </div>
          )}

        </section>
      </main>

      {!isViewOnly && showLeaveConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={() => setShowLeaveConfirm(false)}
            className="absolute inset-0 cursor-default"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#121217] p-6 shadow-2xl">
            <h4 className="text-white text-xl font-semibold text-center">{t("tournament.leaveConfirmTitle")}</h4>
            <p className="text-white/60 text-sm text-center mt-3">
              {t("tournament.leaveConfirmText")}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                className="rounded-xl px-4 py-3 bg-white/10 border border-white/15 text-white font-semibold hover:bg-white/15 transition-all duration-200"
              >
                {t("tournament.stay")}
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={handleLeave}
                className="rounded-xl px-4 py-3 bg-red-500/80 text-white font-semibold hover:bg-red-500 transition-all duration-200 disabled:opacity-50"
              >
                {t("tournament.leaveConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {!isViewOnly && showFinishConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={() => setShowFinishConfirm(false)}
            className="absolute inset-0 cursor-default"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#121217] p-6 shadow-2xl">
            <h4 className="text-white text-xl font-semibold text-center">{t("tournament.finishConfirmTitle")}</h4>
            <p className="text-white/60 text-sm text-center mt-3">
              {t("tournament.finishConfirmText")}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowFinishConfirm(false)}
                className="rounded-xl px-4 py-3 bg-white/10 border border-white/15 text-white font-semibold hover:bg-white/15 transition-all duration-200"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={handleFinishTournament}
                className="rounded-xl px-4 py-3 bg-[#4f39f6] text-white font-semibold hover:bg-[#432dd9] transition-all duration-200 disabled:opacity-50"
              >
                {t("tournament.finishConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
