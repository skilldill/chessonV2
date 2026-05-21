import { API_PREFIX } from '../constants/api';
import { GameState } from '../types';
import { useGameStorage } from './useGameStorage';
import { useEffect } from 'react';

export const useRestoreGame = () => {
    const { storageGameData, removeGameData } = useGameStorage();

    const fetchGameState = async (gameId: string) => {
        try {
            const response = await fetch(API_PREFIX + '/rooms/' + gameId, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch game data: ${response.status}`);
            }

            const data = await response.json() as { gameState: GameState };

            return data;
        } catch (err) {
            console.error('Error fetching game data:', err);
        }
    }

    const checkStartedGame = async () => {
        if (!storageGameData) return;
        if (window.location.pathname.startsWith('/analyze/') || window.location.pathname.startsWith('/analize/')) return;

        const fetchedData = await fetchGameState(storageGameData.gameId);

        if (!fetchedData) {
            removeGameData();
            return;
        }

        const { gameState } = fetchedData;

        if (gameState.gameEnded) return; // Игра закончилась, показать экран, что игры больше нет

        const targetPath = '/game/' + storageGameData.gameId;

        if (window.location.pathname === targetPath) return;

        window.location.href = targetPath;
    }

    useEffect(() => {
        if (!storageGameData) return;

        checkStartedGame();
    }, [storageGameData])
}
