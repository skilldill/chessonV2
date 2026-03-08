import { useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { API_PREFIX } from "../constants/api";

const DEFAULT_TIME_MINUTES = 10;
const DEFAULT_INCREMENT_SECONDS = 0;

export const useQuickPlayEntry = () => {
  const history = useHistory();
  const [playersInRandomQueue, setPlayersInRandomQueue] = useState(0);

  const quickPlayPath = `/quick-play?timeMinutes=${DEFAULT_TIME_MINUTES}&incrementSeconds=${DEFAULT_INCREMENT_SECONDS}`;

  const quickPlayLabel = useMemo(
    () => `${DEFAULT_TIME_MINUTES} min + ${DEFAULT_INCREMENT_SECONDS} sec`,
    []
  );

  useEffect(() => {
    let isMounted = true;

    const fetchRandomQueueStatus = async () => {
      try {
        const response = await fetch(
          `${API_PREFIX}/random-match/status?timeMinutes=${DEFAULT_TIME_MINUTES}&incrementSeconds=${DEFAULT_INCREMENT_SECONDS}`,
          { credentials: "include" }
        );
        const data = await response.json();
        if (!isMounted) return;

        if (data.success && typeof data.totalPlayersInRandomQueue === "number") {
          setPlayersInRandomQueue(data.totalPlayersInRandomQueue);
        }
      } catch (error) {
        console.error("Failed to fetch random queue status:", error);
      }
    };

    fetchRandomQueueStatus();
    const intervalId = window.setInterval(fetchRandomQueueStatus, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const clearLocalStorageQuickPlay = () => {
    localStorage.removeItem("gameData");
    localStorage.removeItem("wsClientId");
    localStorage.removeItem("quickPlayRoomId");
    localStorage.removeItem("quickPlayGuestId");
    localStorage.removeItem("quickPlayGuestNickname");

    console.log('removed store');
  }

  const openQuickPlay = () => {
    clearLocalStorageQuickPlay();
    history.push(quickPlayPath);
  };

  return {
    playersInRandomQueue,
    quickPlayLabel,
    openQuickPlay,
  };
};
