import { API_PREFIX } from '../constants/api';
import type { GameState } from '../types';
import { useGameStorage } from './useGameStorage';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

export const useRestoreGame = () => {
    const { storageGameData, removeGameData } = useGameStorage();
    const history = useHistory();

    const fetchGameState = async (gameId: string) => {
        try {
            const response = await fetch(API_PREFIX + '/rooms/' + gameId, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            const resData = await response.json();
            const data = (resData as { gameState: GameState });

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

        if (!history) return;
        history.push('/game/' + storageGameData.gameId);
    }

    useEffect(() => {
        if (!storageGameData) return;

        checkStartedGame();
    }, [storageGameData, history])
}
