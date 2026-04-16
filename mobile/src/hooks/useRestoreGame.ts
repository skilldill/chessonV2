import { CapacitorHttp } from '@capacitor/core';
import { API_PREFIX } from '../constants/api';
import { GameState } from '../types';
import { useGameStorage } from './useGameStorage';
import { useEffect } from 'react';

export const useRestoreGame = () => {
    const { storageGameData, removeGameData } = useGameStorage();

    const fetchGameState = async (gameId: string) => {
        try {
            const response = await CapacitorHttp.get({
                url: API_PREFIX + '/rooms/' + gameId,
            })

            const data = (response.data as { gameState: GameState });

            return data;
        } catch (err) {
            console.error('Error fetching game data:', err);
        }
    }

    const checkStartedGame = async () => {
        if (!storageGameData) return;

        const fetchedData = await fetchGameState(storageGameData.gameId);

        if (!fetchedData) {
            removeGameData();
            return;
        }

        const { gameState } = fetchedData;

        if (gameState.gameEnded) return; // Игра закончилась, показать экран, что игры больше нет

        window.location.href = '/game/' + storageGameData.gameId;
    }

    useEffect(() => {
        if (!storageGameData) return;

        checkStartedGame();
    }, [storageGameData])
}
