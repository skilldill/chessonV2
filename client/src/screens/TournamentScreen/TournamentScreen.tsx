import { useEffect, useRef, useState } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import { API_PREFIX, TOURNAMENT_WS_URL } from "../../constants/api";
import { TOURNAMENT_MAX_PLAYERS, TOURNAMENT_MAX_ROUNDS } from "../../constants/tournament";
import { AppTopBar } from "../../components/AppTopBar/AppTopBar";
import { RoomTimeModal } from "../../components/RoomTimeModal/RoomTimeModal";
import { getRoomTimeSettingsFromStorage, setRoomTimeSettingsToStorage } from "../../utils/roomTimeStorage";

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
  creatorUserId: string;
  status: "setup" | "scheduled" | "running" | "finished";
  participants: TournamentParticipant[];
  rounds: TournamentRound[];
  currentRoundNumber: number;
  finishAfterCurrentRound: boolean;
  startAt?: string;
  waitingForPlayers?: boolean;
  standings: TournamentStanding[];
};

const TOURNAMENT_GUEST_ID_KEY = "tournamentGuestId";
const TOURNAMENT_PARTICIPANT_KEY_PREFIX = "tournamentParticipant:";
const TOURNAMENT_GAME_PROFILE_KEY = "tournamentGameProfile";
const TOURNAMENT_COMPLETED_GAME_KEY = "tournamentCompletedGame";

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

function resultLabel(match: TournamentMatch) {
  if (match.status !== "completed") return "Идет";
  if (match.result === "absent") return "0";
  if (match.result === "bye") return "1-0";
  if (match.result === "draw") return "1/2-1/2";
  if (match.result === "playerA") return "1-0";
  if (match.result === "playerB") return "0-1";
  return "Завершена";
}

function formatCountdown(totalSeconds: number) {
  const seconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;
  return minutes > 0 ? `${minutes}:${restSeconds.toString().padStart(2, "0")}` : `${restSeconds}`;
}

export function CreateTournamentScreen() {
  const history = useHistory();
  const initialRoomTime = getRoomTimeSettingsFromStorage();
  const [title, setTitle] = useState("");
  const [roundsCount, setRoundsCount] = useState(5);
  const [timeMinutes, setTimeMinutes] = useState(initialRoomTime.timeMinutes);
  const [incrementSeconds, setIncrementSeconds] = useState(initialRoomTime.incrementSeconds);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
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
        body: JSON.stringify({ title, roundsCount, timeMinutes, incrementSeconds }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Не удалось создать турнир");
      history.push(`/tournaments/${data.tournament.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать турнир");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-[100vh] text-white px-4 py-20">
      <AppTopBar />
      <main className="mx-auto flex w-full max-w-[520px] flex-col gap-5">
        <h1 className="text-2xl font-bold">Новый онлайн-турнир</h1>
        <label className="flex flex-col gap-2 text-sm text-white/70">
          Название
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-12 rounded-lg border border-white/15 bg-white/10 px-4 text-base text-white outline-none focus:border-[#4f39f6]"
            placeholder="Например, Friday Swiss"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-white/70">
          Количество туров
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
          <div className="text-white/50 text-xs">Время партий</div>
          <div className="text-white/90 text-base font-semibold mt-1">{timeMinutes} + {incrementSeconds}</div>
        </button>

        {error && <div className="rounded-lg border border-red-500/50 bg-red-500/15 p-3 text-sm text-red-200">{error}</div>}
        <button
          type="button"
          disabled={isCreating || !title.trim()}
          onClick={handleCreate}
          className="h-12 rounded-lg bg-[#4f39f6] px-4 font-semibold text-white transition-opacity hover:bg-[#432dd9] disabled:opacity-50"
        >
          Создать турнир
        </button>

        <RoomTimeModal
          isOpen={isTimeModalOpen}
          isCreating={isCreating}
          timeMinutes={timeMinutes}
          incrementSeconds={incrementSeconds}
          withAIhints={false}
          showAdvancedOptions={false}
          title="Время партий турнира"
          subtitle="Выберите контроль времени для всех партий турнира"
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
      </main>
    </div>
  );
}

export function TournamentRoomScreen() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const history = useHistory();
  const wsRef = useRef<WebSocket | null>(null);
  const openedGameRoomRef = useRef<string | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participant, setParticipant] = useState(getStoredParticipant(tournamentId));
  const [nickname, setNickname] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCurrentUserChecked, setIsCurrentUserChecked] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const [isShareCopied, setIsShareCopied] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const playerCount = tournament?.participants.filter((item) => !item.removed).length || 0;
  const currentRound = tournament?.rounds.find((round) => round.number === tournament.currentRoundNumber);
  const standingsByParticipantId = new Map(
    (tournament?.standings || []).map((standing, index) => [standing.participantId, { ...standing, place: index + 1 }])
  );
  const participantMatch = currentRound?.matches.find((match) =>
    participant?.id && (match.playerAId === participant.id || match.playerBId === participant.id)
  );
  const canOpenGame = participantMatch?.gameRoomId && participantMatch.status === "active";
  const startAtMs = tournament?.startAt ? new Date(tournament.startAt).getTime() : null;
  const secondsToStart = startAtMs ? Math.max(0, Math.ceil((startAtMs - nowMs) / 1000)) : 0;
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
    const query = participant?.id ? `&participantId=${encodeURIComponent(participant.id)}` : "";
    const ws = new WebSocket(`${TOURNAMENT_WS_URL}?tournamentId=${encodeURIComponent(tournamentId)}${query}`);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "tournamentState") {
        setTournament(data.tournament);
      }
    };
    return () => ws.close(1000, "Tournament screen closed");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId, participant?.id]);

  useEffect(() => {
    if (!tournament?.startAt) {
      return;
    }

    const interval = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [tournament?.startAt]);

  useEffect(() => {
    if (!participant || !participantMatch?.gameRoomId || participantMatch.status !== "active") {
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
  }, [history, participant, participantMatch?.gameRoomId, participantMatch?.status, tournamentId]);

  useEffect(() => {
    if (!tournament || !currentUserId || participant) {
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
  }, [currentUserId, participant, tournament, tournamentId]);

  useEffect(() => {
    if (!participant || !tournament) {
      return;
    }

    const currentParticipant = tournament.participants.find((item) => item.id === participant.id && !item.removed);
    if (currentParticipant && !currentParticipant.active && tournament.status !== "finished") {
      setParticipant(null);
    }
  }, [participant, tournament]);

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
      if (!data.success) throw new Error(data.error || "Действие не выполнено");
      if (data.tournament) setTournament(data.tournament);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Действие не выполнено");
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
      setError("Не удалось скопировать ссылку");
    }
  };

  const isCreator = Boolean(tournament?.creatorUserId && currentUserId && tournament.creatorUserId === currentUserId);
  return (
    <div className="min-h-[100vh] text-white px-4 py-20">
      <AppTopBar />
      <main className="mx-auto grid w-full max-w-[1120px] gap-5 lg:grid-cols-[360px_1fr]">
        <section className="flex flex-col gap-4">
          <Link to="/main" className="text-sm text-white/60 hover:text-white">Назад</Link>
          <div>
            <h1 className="text-2xl font-bold">{tournament?.title || "Турнир"}</h1>
            <p className="text-sm text-white/60">
              {playerCount}/{TOURNAMENT_MAX_PLAYERS} игроков · {tournament?.roundsCount || 0} туров · {tournament?.timeControl?.timeMinutes || 10} + {tournament?.timeControl?.incrementSeconds || 0} · {tournament?.status || "loading"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="h-10 rounded-lg border border-white/15 bg-white/10 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
          >
            {isShareCopied ? "Ссылка скопирована" : "Поделиться"}
          </button>

          {tournament?.status === "scheduled" && tournament.startAt && (
            <div className="rounded-lg border border-[#555ab9b3] bg-[#4f39f633] p-4">
              <div className="text-sm text-white/70">
                {tournament.currentRoundNumber > 0 ? "Следующий тур начнется через" : "Турнир начнется через"}
              </div>
              <div className="mt-1 text-3xl font-bold text-[#4f39f6]">{formatCountdown(secondsToStart)}</div>
            </div>
          )}

          {isLateParticipantWaiting && (
            <div className="rounded-lg border border-[#555ab9b3] bg-[#4f39f633] p-4 text-sm text-white/85">
              Вы вошли после начала текущего тура. За пропущенные туры будет 0 очков, первая партия появится со следующего тура.
            </div>
          )}

          {tournament?.waitingForPlayers && (
            <div className="rounded-lg border border-[#555ab9b3] bg-[#4f39f633] p-4 text-sm text-white/80">
              Ждем, пока все участники вернутся в турнирную комнату после партий.
            </div>
          )}

          {(!participant || (participantInTournament && !participantInTournament.active)) && isCurrentUserChecked && tournament?.status !== "finished" && (
            <div className="flex flex-col gap-3 rounded-lg border border-white/15 bg-white/5 p-4">
              {!currentUserId && (
                <input
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  className="h-11 rounded-lg border border-white/15 bg-black/20 px-3 text-white outline-none"
                  placeholder="Никнейм для турнира"
                />
              )}
              <button
                type="button"
                disabled={isBusy || isTournamentFull}
                onClick={handleJoin}
                className="h-11 rounded-lg bg-[#4f39f6] font-semibold text-white hover:bg-[#432dd9] disabled:opacity-50"
              >
                {isTournamentFull ? "Турнир заполнен" : participantInTournament ? "Вернуться в турнир" : "Войти в турнир"}
              </button>
            </div>
          )}

          {participant && tournament?.status !== "finished" && participantInTournament?.active && (
            <div className="flex flex-col gap-3 rounded-lg border border-white/15 bg-white/5 p-4">
              <div className="text-sm text-white/70">Вы играете как</div>
              <div className="text-lg font-semibold">{participant.nickname}</div>
              {canOpenGame && <div className="text-sm text-[#4f39f6]">Партия открывается автоматически...</div>}
              <button type="button" disabled={isBusy} onClick={() => setShowLeaveConfirm(true)} className="h-10 rounded-lg border border-white/15 bg-white/10 text-sm">
                Покинуть турнир
              </button>
            </div>
          )}

          {isCreator && tournament && tournament.status !== "finished" && (
            <div className="flex flex-col gap-2 rounded-lg border border-white/15 bg-white/5 p-4">
              {(tournament.status === "setup" || (tournament.status === "scheduled" && tournament.rounds.length === 0)) && (
                playerCount < 3 ? (
                  <div className="rounded-lg border border-[#555ab9b3] bg-[#4f39f633] px-3 py-2 text-center text-sm text-white/85">
                    Для начала турнира необходимо минимум 3 участника
                  </div>
                ) : (
                  <>
                    <button type="button" disabled={isBusy} onClick={() => callAction("/start", { delaySeconds: 0 })} className="h-10 rounded-lg bg-[#4f39f6] text-sm font-semibold text-white hover:bg-[#432dd9] disabled:opacity-50">Запустить сейчас</button>
                    <button type="button" disabled={isBusy} onClick={() => callAction("/start", { delaySeconds: 60 })} className="h-10 rounded-lg bg-white/10 text-sm">Через 1 минуту</button>
                    <button type="button" disabled={isBusy} onClick={() => callAction("/start", { delaySeconds: 300 })} className="h-10 rounded-lg bg-white/10 text-sm">Через 5 минут</button>
                  </>
                )
              )}
              {tournament.status === "running" && (
                <>
                  {tournament.waitingForPlayers && (
                    <button type="button" disabled={isBusy} onClick={() => callAction("/force-next-round")} className="h-10 rounded-lg bg-[#4f39f6] text-sm font-semibold text-white hover:bg-[#432dd9] disabled:opacity-50">
                      Не ждать всех, начать через 15 секунд
                    </button>
                  )}
                  <button type="button" disabled={isBusy} onClick={() => callAction("/add-round")} className="h-10 rounded-lg bg-white/10 text-sm">
                    Добавить тур
                  </button>
                  {tournament.finishAfterCurrentRound ? (
                    <div className="rounded-lg border border-[#555ab9b3] bg-[#4f39f633] px-3 py-2 text-center text-sm text-white/85">
                      Турнир завершится сразу после текущего тура
                    </div>
                  ) : (
                    <button type="button" disabled={isBusy} onClick={() => setShowFinishConfirm(true)} className="h-10 rounded-lg border border-[#555ab9b3] bg-[#4f39f633] text-sm text-white/85 hover:bg-[#4f39f64d] disabled:opacity-50">
                      Завершить турнир сейчас
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {error && <div className="rounded-lg border border-red-500/50 bg-red-500/15 p-3 text-sm text-red-200">{error}</div>}
        </section>

        <section className="grid gap-5">
          <div className="rounded-lg border border-white/15 bg-white/5 p-4">
            <h2 className="mb-3 text-lg font-semibold">Игроки</h2>
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-white/10 text-xs uppercase tracking-wide text-white/50">
                  <tr>
                    <th className="px-3 py-2 font-semibold">#</th>
                    <th className="px-3 py-2 font-semibold">Игрок</th>
                    {tournament?.status !== "finished" && <th className="px-3 py-2 font-semibold">Статус</th>}
                    <th className="px-3 py-2 font-semibold">Очки</th>
                    <th className="px-3 py-2 font-semibold">Бх</th>
                    <th className="px-3 py-2 font-semibold">Победы</th>
                    {isCreator && tournament?.status !== "finished" && <th className="px-3 py-2 font-semibold" />}
                  </tr>
                </thead>
                <tbody>
                  {tournament?.participants.filter((item) => !item.removed).map((item, index) => {
                    const standing = standingsByParticipantId.get(item.id);

                    return (
                      <tr key={item.id} className="border-t border-white/10 bg-black/10">
                        <td className="px-3 py-2 text-white/50">{standing?.place || index + 1}</td>
                        <td className="px-3 py-2 font-medium text-white">{item.nickname}</td>
                        {tournament?.status !== "finished" && (
                          <td className={item.active ? "px-3 py-2 text-emerald-300" : "px-3 py-2 text-white/40"}>
                            {item.active ? "в игре" : "вышел"}
                          </td>
                        )}
                        <td className="px-3 py-2 text-white/80">{standing?.points || 0}</td>
                        <td className="px-3 py-2 text-white/60">{standing?.buchholz || 0}</td>
                        <td className="px-3 py-2 text-white/60">{standing?.wins || 0}</td>
                        {isCreator && tournament?.status !== "finished" && (
                          <td className="px-3 py-2 text-right">
                            {item.id !== participant?.id && (
                              <button type="button" onClick={() => callAction("/remove-player", { participantId: item.id })} className="rounded border border-white/15 px-2 py-1 text-white/70 hover:bg-white/10">
                                убрать
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {(!tournament || tournament.participants.filter((item) => !item.removed).length === 0) && (
                    <tr>
                      <td colSpan={isCreator && tournament?.status !== "finished" ? 7 : tournament?.status === "finished" ? 5 : 6} className="px-3 py-5 text-center text-white/50">
                        Игроков пока нет.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {tournament?.status === "finished" ? (
            <div className="rounded-lg border border-white/15 bg-white/5 p-4">
              <h2 className="mb-3 text-lg font-semibold">Все туры</h2>
              <div className="grid gap-4">
                {tournament.rounds.map((round) => (
                  <div key={round.id} className="grid gap-2">
                    <div className="text-sm font-semibold text-white/80">Тур {round.number}</div>
                    {round.matches.map((match) => (
                      <div key={match.id} className="grid gap-2 rounded-md bg-black/20 px-3 py-2 text-sm sm:grid-cols-[1fr_auto]">
                        <span>{participantName(tournament, match.playerAId)} - {participantName(tournament, match.playerBId)}</span>
                        <span className="text-white/70">{resultLabel(match)}</span>
                      </div>
                    ))}
                  </div>
                ))}
                {tournament.rounds.length === 0 && <div className="text-sm text-white/60">Туры не проводились.</div>}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-white/15 bg-white/5 p-4">
              <h2 className="mb-3 text-lg font-semibold">
                Текущий тур{currentRound ? `: Тур ${currentRound.number}` : ""}
              </h2>
              <div className="grid gap-2">
                {(currentRound?.matches || []).map((match) => (
                  <div key={match.id} className="grid gap-2 rounded-md bg-black/20 px-3 py-2 text-sm sm:grid-cols-[1fr_auto]">
                    <span>{participantName(tournament!, match.playerAId)} - {participantName(tournament!, match.playerBId)}</span>
                    <span className="text-white/70">{resultLabel(match)}</span>
                  </div>
                ))}
                {!currentRound && <div className="text-sm text-white/60">Тур еще не запущен.</div>}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-white/15 bg-white/5 p-4">
            <h2 className="mb-3 text-lg font-semibold">{tournament?.status === "finished" ? "Итоговая таблица" : "Предварительная таблица"}</h2>
            <div className="grid gap-2">
              {(tournament?.standings || []).map((standing, index) => (
                <div key={standing.participantId} className="grid grid-cols-[32px_1fr_56px_80px] items-center rounded-md bg-black/20 px-3 py-2 text-sm">
                  <span className="text-white/50">{index + 1}</span>
                  <span>{standing.nickname}</span>
                  <span>{standing.points}</span>
                  <span className="text-white/50">Бх {standing.buchholz}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {showLeaveConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <button
            type="button"
            aria-label="Закрыть"
            onClick={() => setShowLeaveConfirm(false)}
            className="absolute inset-0 cursor-default"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#121217] p-6 shadow-2xl">
            <h4 className="text-white text-xl font-semibold text-center">Покинуть турнир?</h4>
            <p className="text-white/60 text-sm text-center mt-3">
              Если вы покинете турнир, вы не попадете в следующие пары, а несыгранная партия текущего тура может быть засчитана как 0 очков.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                className="rounded-xl px-4 py-3 bg-white/10 border border-white/15 text-white font-semibold hover:bg-white/15 transition-all duration-200"
              >
                Остаться
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={handleLeave}
                className="rounded-xl px-4 py-3 bg-red-500/80 text-white font-semibold hover:bg-red-500 transition-all duration-200 disabled:opacity-50"
              >
                Покинуть
              </button>
            </div>
          </div>
        </div>
      )}

      {showFinishConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <button
            type="button"
            aria-label="Закрыть"
            onClick={() => setShowFinishConfirm(false)}
            className="absolute inset-0 cursor-default"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#121217] p-6 shadow-2xl">
            <h4 className="text-white text-xl font-semibold text-center">Завершить турнир?</h4>
            <p className="text-white/60 text-sm text-center mt-3">
              Если сейчас идет тур, турнир завершится сразу после последней партии этого тура. Следующий тур создан не будет.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowFinishConfirm(false)}
                className="rounded-xl px-4 py-3 bg-white/10 border border-white/15 text-white font-semibold hover:bg-white/15 transition-all duration-200"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={handleFinishTournament}
                className="rounded-xl px-4 py-3 bg-[#4f39f6] text-white font-semibold hover:bg-[#432dd9] transition-all duration-200 disabled:opacity-50"
              >
                Завершить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
