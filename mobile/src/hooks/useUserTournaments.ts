import { useState } from "react";
import { API_PREFIX } from "../constants/api";

export type UserTournament = {
  id: string;
  title: string;
  status: "setup" | "scheduled" | "running" | "finished";
  roundsCount: number;
  playedAt: string;
  endedAt: string | null;
  createdAt: string;
};

export const useUserTournaments = () => {
  const [tournaments, setTournaments] = useState<UserTournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTournaments, setShowTournaments] = useState(false);
  const [totalTournaments, setTotalTournaments] = useState(0);

  const loadTournaments = async (limit = 20) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_PREFIX}/auth/my-tournaments?limit=${limit}`, {
        credentials: "include",
      });
      const data = await response.json();

      if (data.success && data.tournaments) {
        setTournaments(data.tournaments);
        setTotalTournaments(data.pagination?.total || 0);
        setShowTournaments(true);
      }
    } catch (error) {
      console.error("Error loading tournaments:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTotalTournaments = async () => {
    try {
      const response = await fetch(`${API_PREFIX}/auth/my-tournaments?limit=1`, {
        credentials: "include",
      });
      const data = await response.json();

      if (data.success && data.pagination) {
        setTotalTournaments(data.pagination.total || 0);
      }
    } catch (error) {
      console.error("Error loading total tournaments:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return {
    tournaments,
    loading,
    showTournaments,
    setShowTournaments,
    loadTournaments,
    loadTotalTournaments,
    totalTournaments,
    formatDate,
  };
};
