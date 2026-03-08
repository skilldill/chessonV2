import { API_PREFIX } from '../constants/api';
import type { GameState } from '../types';
import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

export const useRestoreGame = () => {
    const history = useHistory();
    const location = useLocation();
    const removeGameData = () => localStorage.removeItem('gameData');

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
        const rawGameData = localStorage.getItem('gameData');
        if (!rawGameData) return;

        let storageGameData: { gameId: string } | null = null;
        try {
            storageGameData = JSON.parse(rawGameData);
        } catch (error) {
            removeGameData();
            return;
        }

        if (!storageGameData?.gameId) {
            removeGameData();
            return;
        }

        const fetchedData = await fetchGameState(storageGameData.gameId);

        if (!fetchedData) {
            removeGameData();
            return;
        }

        const { gameState } = fetchedData;

        if (gameState.gameEnded) {
            removeGameData();
            return;
        }

        if (!history) return;
        history.push('/game/' + storageGameData.gameId);
    }

    useEffect(() => {
        checkStartedGame();
    }, [location.pathname, history])
}
