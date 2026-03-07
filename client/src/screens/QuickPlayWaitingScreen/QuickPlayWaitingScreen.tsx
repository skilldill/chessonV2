import { useEffect, useMemo, useRef, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { API_PREFIX } from "../../constants/api";

type RandomMatchResponse = {
  success: boolean;
  status?: "idle" | "waiting" | "matched";
  roomId?: string;
  totalPlayersInRandomQueue?: number;
  queueCountForTimeControl?: number;
  error?: string;
};

function useTimeControlFromQuery() {
  const location = useLocation();

  return useMemo(() => {
    const params = new URLSearchParams(location.search);
    const parsedMinutes = Number(params.get("timeMinutes"));
    const parsedIncrement = Number(params.get("incrementSeconds"));

    const timeMinutes = Number.isFinite(parsedMinutes) && parsedMinutes > 0
      ? Math.floor(parsedMinutes)
      : 10;
    const incrementSeconds = Number.isFinite(parsedIncrement) && parsedIncrement >= 0
      ? Math.floor(parsedIncrement)
      : 0;

    return { timeMinutes, incrementSeconds };
  }, [location.search]);
}

export const QuickPlayWaitingScreen = () => {
  const history = useHistory();
  const { timeMinutes, incrementSeconds } = useTimeControlFromQuery();
  const [isJoining, setIsJoining] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playersInRandomQueue, setPlayersInRandomQueue] = useState(0);
  const [playersInCurrentTimeControl, setPlayersInCurrentTimeControl] = useState(0);
  const didLeaveQueueRef = useRef(false);
  const matchedRoomRef = useRef<string | null>(null);

  const joinQueue = async () => {
    const response = await fetch(`${API_PREFIX}/random-match/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ timeMinutes, incrementSeconds }),
    });
    return response.json() as Promise<RandomMatchResponse>;
  };

  const fetchStatus = async () => {
    const response = await fetch(
      `${API_PREFIX}/random-match/status?timeMinutes=${timeMinutes}&incrementSeconds=${incrementSeconds}`,
      { credentials: "include" }
    );
    return response.json() as Promise<RandomMatchResponse>;
  };

  const leaveQueue = async () => {
    if (didLeaveQueueRef.current) return;
    didLeaveQueueRef.current = true;

    try {
      await fetch(`${API_PREFIX}/random-match/leave`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch (leaveError) {
      console.error("Failed to leave random queue:", leaveError);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let pollIntervalId: number | null = null;

    const handleServerResponse = (data: RandomMatchResponse) => {
      if (typeof data.totalPlayersInRandomQueue === "number") {
        setPlayersInRandomQueue(data.totalPlayersInRandomQueue);
      }
      if (typeof data.queueCountForTimeControl === "number") {
        setPlayersInCurrentTimeControl(data.queueCountForTimeControl);
      }

      if (data.success && data.status === "matched" && data.roomId) {
        matchedRoomRef.current = data.roomId;
        history.replace(`/game/${data.roomId}`);
      }
    };

    const startMatching = async () => {
      try {
        setError(null);
        const joinData = await joinQueue();
        if (!isMounted) return;

        if (!joinData.success) {
          setError(joinData.error || "Не удалось встать в очередь");
          return;
        }

        handleServerResponse(joinData);

        pollIntervalId = window.setInterval(async () => {
          try {
            const statusData = await fetchStatus();
            if (!isMounted) return;
            handleServerResponse(statusData);
          } catch (pollError) {
            console.error("Random queue poll failed:", pollError);
          }
        }, 3000);
      } catch (joinError) {
        console.error("Failed to join random queue:", joinError);
        if (isMounted) {
          setError("Не удалось подключиться к очереди");
        }
      } finally {
        if (isMounted) {
          setIsJoining(false);
        }
      }
    };

    startMatching();

    return () => {
      isMounted = false;
      if (pollIntervalId) {
        clearInterval(pollIntervalId);
      }
      if (!matchedRoomRef.current) {
        leaveQueue();
      }
    };
  }, [history, incrementSeconds, timeMinutes]);

  return (
    <div className="w-full h-[100vh] flex justify-center items-center overflow-y-auto py-4">
      <div className="max-w-[432px] w-full flex flex-col items-center gap-6 px-4">
        <h2 className="text-white text-3xl font-semibold text-center">
          Поиск соперника
        </h2>

        <div className="w-full rounded-xl border border-white/10 bg-white/5 px-6 py-5 text-white/90 text-center">
          <p className="text-lg font-semibold">Контроль: {timeMinutes} + {incrementSeconds}</p>
          <p className="mt-2 text-sm text-white/70">Игроков в рандомном режиме: {playersInRandomQueue}</p>
          <p className="mt-1 text-sm text-white/70">В этой очереди: {playersInCurrentTimeControl}</p>
        </div>

        {error ? (
          <div className="w-full rounded-xl border border-red-500/50 bg-red-500/15 px-4 py-3 text-red-200 text-sm text-center">
            {error}
          </div>
        ) : (
          <div className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/80 text-sm text-center">
            {isJoining ? "Подключаемся к очереди..." : "Ожидаем соперника..."}
          </div>
        )}

        <button
          type="button"
          onClick={async () => {
            await leaveQueue();
            history.push("/main");
          }}
          className="w-full rounded-xl px-6 py-4 bg-white/10 border border-white/15 text-white font-semibold hover:bg-white/15 transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer"
        >
          Выйти из очереди
        </button>
      </div>
    </div>
  );
};
