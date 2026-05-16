import { useCallback, useEffect, useRef, useState } from "react";
import { API_PREFIX } from "../constants/api";
import type { GameAnalysisRecord, GameAnalysisResult } from "../types/analysis";

type AnalysisStatus = "idle" | "loading" | "running" | "done" | "failed";

type AnalysisProgress = {
  current: number;
  total: number;
};

type AnalysisResponse = {
  success: boolean;
  status?: GameAnalysisRecord["status"];
  progress?: AnalysisProgress;
  analysis?: GameAnalysisRecord;
  error?: string;
};

export type UseGameAnalysisResult = {
  status: AnalysisStatus;
  progress: AnalysisProgress | null;
  analysis: GameAnalysisResult | null;
  error: string | null;
  retry: () => void;
};

export function useGameAnalysis(gameId: string | undefined): UseGameAnalysisResult {
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [analysis, setAnalysis] = useState<GameAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const requestVersionRef = useRef(0);

  const closeEvents = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
  }, []);

  const handleAnalysisRecord = useCallback((record?: GameAnalysisRecord | null) => {
    if (!record) {
      return;
    }

    setProgress({
      current: record.progressCurrent || 0,
      total: record.progressTotal || 0,
    });

    if (record.status === "done" && record.result) {
      setAnalysis(record.result);
      setStatus("done");
      closeEvents();
      return;
    }

    if (record.status === "failed") {
      setError(record.error || "Не удалось выполнить анализ партии");
      setStatus("failed");
      closeEvents();
      return;
    }

    setStatus("running");
  }, [closeEvents]);

  const openEvents = useCallback((nextGameId: string, version: number) => {
    closeEvents();

    const source = new EventSource(`${API_PREFIX}/analysis/${encodeURIComponent(nextGameId)}/events`);
    eventSourceRef.current = source;

    source.addEventListener("snapshot", (event) => {
      if (requestVersionRef.current !== version) return;
      const payload = JSON.parse((event as MessageEvent).data) as { analysis?: GameAnalysisRecord };
      handleAnalysisRecord(payload.analysis);
    });

    source.addEventListener("progress", (event) => {
      if (requestVersionRef.current !== version) return;
      const payload = JSON.parse((event as MessageEvent).data) as AnalysisProgress;
      setProgress(payload);
      setStatus("running");
    });

    source.addEventListener("done", (event) => {
      if (requestVersionRef.current !== version) return;
      const payload = JSON.parse((event as MessageEvent).data) as { analysis?: GameAnalysisRecord };
      handleAnalysisRecord(payload.analysis);
    });

    source.addEventListener("failed", (event) => {
      if (requestVersionRef.current !== version) return;
      const payload = JSON.parse((event as MessageEvent).data) as { error?: string };
      setError(payload.error || "Не удалось выполнить анализ партии");
      setStatus("failed");
      closeEvents();
    });

    source.onerror = () => {
      if (requestVersionRef.current !== version) return;
      setError("Соединение с анализом прервано");
      setStatus((currentStatus) => currentStatus === "done" ? currentStatus : "failed");
      closeEvents();
    };
  }, [closeEvents, handleAnalysisRecord]);

  const load = useCallback(async (options?: { retry?: boolean }) => {
    if (!gameId) {
      return;
    }

    const version = requestVersionRef.current + 1;
    requestVersionRef.current = version;
    closeEvents();
    setStatus("loading");
    setError(null);

    try {
      const response = await fetch(
        options?.retry
          ? `${API_PREFIX}/analysis/${encodeURIComponent(gameId)}/retry`
          : `${API_PREFIX}/analysis/${encodeURIComponent(gameId)}`,
        {
          method: options?.retry ? "POST" : "GET",
          credentials: "include",
        },
      );
      const data = await response.json() as AnalysisResponse;

      if (requestVersionRef.current !== version) return;

      if (!data.success) {
        throw new Error(data.error || "Не удалось получить анализ партии");
      }

      handleAnalysisRecord(data.analysis);

      if (data.status === "running") {
        setProgress(data.progress || null);
        setStatus("running");
        openEvents(gameId, version);
      }
    } catch (err) {
      if (requestVersionRef.current !== version) return;
      setError(err instanceof Error ? err.message : "Не удалось получить анализ партии");
      setStatus("failed");
    }
  }, [closeEvents, gameId, handleAnalysisRecord, openEvents]);

  useEffect(() => {
    void load();

    return () => {
      requestVersionRef.current += 1;
      closeEvents();
    };
  }, [closeEvents, load]);

  const retry = useCallback(() => {
    void load({ retry: true });
  }, [load]);

  return {
    status,
    progress,
    analysis,
    error,
    retry,
  };
}
