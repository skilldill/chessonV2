import { API_PREFIX } from '../constants/api';
import type { GameState } from '../types';
import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

export const useRestoreGame = () => {
    const history = useHistory();
    const location = useLocation();
    useEffect(() => {
        // Explicit room creation and invitation links take priority over saved games.
        if (location.pathname !== '/' && location.pathname !== '/main') return;
        let active = true;
        const restore = async () => {
            const raw = localStorage.getItem('gameData');
            if (!raw) return;
            let gameId: string;
            try {
                const saved = JSON.parse(raw);
                if (typeof saved?.gameId !== 'string') throw new Error('Invalid saved game');
                gameId = saved.gameId;
            } catch {
                localStorage.removeItem('gameData');
                return;
            }
            try {
                const response = await fetch(API_PREFIX + '/rooms/' + gameId);
                if (!response.ok) return;
                const data = await response.json() as { gameState?: GameState };
                if (!active) return;
                if (!data.gameState || data.gameState.gameEnded) {
                    localStorage.removeItem('gameData');
                    return;
                }
                history.replace('/game/' + gameId);
            } catch (error) {
                console.error('Error restoring game:', error);
            }
        };
        void restore();
        return () => { active = false; };
    }, [location.pathname, history]);
}
