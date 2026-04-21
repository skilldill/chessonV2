import { useEffect, useMemo, useRef, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { API_PREFIX } from "../../constants/api";
import { useTranslation } from "react-i18next";

const QUICK_PLAY_GUEST_ID_KEY = "quickPlayGuestId";
const QUICK_PLAY_PROFILE_KEY = "quickPlayProfile";
const QUICK_PLAY_ROOM_ID_KEY = "quickPlayRoomId";
const QUICK_PLAY_GUEST_NICKNAME_KEY = "quickPlayGuestNickname";

const GUEST_CAT_WORDS = [
  "Mad",
  "Fury",
  "Good",
  "Big",
  "Small",
  "Swift",
  "Lucky",
  "Brave",
  "Calm",
  "Wild",
  "Sharp",
  "Rapid",
  "Bold",
  "Mighty",
  "Sneaky",
  "Quiet",
  "Storm",
  "Silver",
  "Golden",
  "Cosmic",
];

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

function getOrCreateQuickPlayGuestId() {
  const existingGuestId = localStorage.getItem(QUICK_PLAY_GUEST_ID_KEY);
  if (existingGuestId) return existingGuestId;

  const generatedGuestId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "")
      : `${Date.now()}_${Math.random().toString(36).slice(2)}`;

  localStorage.setItem(QUICK_PLAY_GUEST_ID_KEY, generatedGuestId);
  return generatedGuestId;
}

function createStableGuestNickname(guestId: string) {
  let hash = 0;
  for (let i = 0; i < guestId.length; i++) {
    hash = (hash * 31 + guestId.charCodeAt(i)) >>> 0;
  }

  const word = GUEST_CAT_WORDS[hash % GUEST_CAT_WORDS.length] || "Mad";
  return `${word} cat`;
}

function getOrCreateQuickPlayGuestNickname(guestId: string) {
  const existingNickname = localStorage.getItem(QUICK_PLAY_GUEST_NICKNAME_KEY);
  if (existingNickname) return existingNickname;

  const nickname = createStableGuestNickname(guestId);
  localStorage.setItem(QUICK_PLAY_GUEST_NICKNAME_KEY, nickname);
  return nickname;
}

export const QuickPlayWaitingScreen = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { timeMinutes, incrementSeconds } = useTimeControlFromQuery();
  const guestIdRef = useRef<string>(getOrCreateQuickPlayGuestId());
  const guestNicknameRef = useRef<string>(getOrCreateQuickPlayGuestNickname(guestIdRef.current));
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
      body: JSON.stringify({ timeMinutes, incrementSeconds, guestId: guestIdRef.current }),
    });
    return response.json() as Promise<RandomMatchResponse>;
  };

  const fetchStatus = async () => {
    const response = await fetch(
      `${API_PREFIX}/random-match/status?timeMinutes=${timeMinutes}&incrementSeconds=${incrementSeconds}&guestId=${guestIdRef.current}`,
      { credentials: "include" }
    );
    return response.json() as Promise<RandomMatchResponse>;
  };

  const leaveQueue = async () => {
    if (didLeaveQueueRef.current) return;
    didLeaveQueueRef.current = true;

    try {
      await fetch(`${API_PREFIX}/random-match/leave?guestId=${guestIdRef.current}`, {
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
        localStorage.setItem(
          QUICK_PLAY_PROFILE_KEY,
          JSON.stringify({ playerName: guestNicknameRef.current, avatar: "0" })
        );
        localStorage.removeItem("gameData");
        localStorage.setItem(QUICK_PLAY_ROOM_ID_KEY, data.roomId);
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
          setError(joinData.error || t("quick.failedJoinQueue"));
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
          setError(t("quick.failedConnectQueue"));
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
  }, [history, incrementSeconds, t, timeMinutes]);

  return (
    <div className="w-full h-[100vh] flex justify-center items-center overflow-y-auto py-4">
      <div className="max-w-[432px] w-full flex flex-col items-center gap-6 px-4">
        <div className="flex items-center gap-2">
          <h2 className="text-white text-3xl font-semibold text-center">
            {t("quick.findingOpponent")}
          </h2>
          <span
            className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-400/90 text-amber-950"
            aria-label="Test mode"
          >
            Beta
          </span>
        </div>

        <div className="w-full rounded-xl border border-white/10 bg-white/5 px-6 py-5 text-white/90 text-center">
          <p className="text-lg font-semibold">{t("quick.timeControl", { timeMinutes, incrementSeconds })}</p>
          <p className="mt-2 text-sm text-white/70">{t("quick.playersMatchmaking", { count: playersInRandomQueue })}</p>
          <p className="mt-1 text-sm text-white/70">{t("quick.inThisQueue", { count: playersInCurrentTimeControl })}</p>
        </div>

        {error ? (
          <div className="w-full rounded-xl border border-red-500/50 bg-red-500/15 px-4 py-3 text-red-200 text-sm text-center">
            {error}
          </div>
        ) : (
          <div className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/80 text-sm text-center">
            {isJoining ? t("quick.joiningQueue") : t("quick.waitingOpponent")}
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
          {t("quick.leaveQueue")}
        </button>
      </div>
    </div>
  );
};
