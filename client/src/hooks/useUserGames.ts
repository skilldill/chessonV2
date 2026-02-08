import { useState } from "react";
import { API_PREFIX } from "../constants/api";

export type UserGame = {
  id: string;
  roomId: string;
  userColor: 'white' | 'black';
  opponent: {
    userName: string;
    avatar: string;
  };
  result: {
    resultType: string;
    userResult: 'win' | 'loss' | 'draw';
  };
  moveCount: number;
  startedAt: string;
  endedAt: string;
};

export const useUserGames = () => {
  const [games, setGames] = useState<UserGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGames, setShowGames] = useState(false);

  const loadGames = async (limit: number = 10) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_PREFIX}/auth/my-games?limit=${limit}`, {
        credentials: "include",
      });

      const data = await response.json();

      if (data.success && data.games) {
        setGames(data.games);
        setShowGames(true);
      }
    } catch (err) {
      console.error("Error loading games:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getResultText = (result: UserGame['result']): string => {
    if (result.userResult === 'win') return 'Победа';
    if (result.userResult === 'loss') return 'Поражение';
    return 'Ничья';
  };

  const getResultColor = (result: UserGame['result']): string => {
    if (result.userResult === 'win') return 'text-green-400';
    if (result.userResult === 'loss') return 'text-red-400';
    return 'text-gray-400';
  };

  return {
    games,
    loading,
    showGames,
    setShowGames,
    loadGames,
    formatDate,
    getResultText,
    getResultColor,
  };
};
