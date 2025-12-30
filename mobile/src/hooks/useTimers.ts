import type { FigureColor } from "react-chessboard-ui";
import type { GameState, TimerState } from "../types";
import { DEFAULT_TIMER_SECONDS } from "../constants/timers";
import { useEffect, useMemo, useState } from "react";

type UseTimersProps = {
    playerColor: FigureColor;
    timer?: TimerState;
    gameState?: GameState;
}

export const useTimers = ({ playerColor, timer, gameState }: UseTimersProps) => {
    const [initialOpponentTime, setInitialOpponentTime] = useState(DEFAULT_TIMER_SECONDS);
    const [initialPlayerTime, setInitialPlayerTime] = useState(DEFAULT_TIMER_SECONDS);
    
    useEffect(() => {
        if (gameState && gameState.timer) {
            setInitialOpponentTime(playerColor === "white" ? 
                    gameState.timer.initialBlackTime : 
                    gameState.timer.initialWhiteTime
            );

            setInitialPlayerTime(playerColor === "white" ? 
                gameState.timer.initialWhiteTime : 
                gameState.timer.initialBlackTime
            );
        }
    }, [])

    // Определяем время для соперника и игрока
    const opponentTime = useMemo(() => {
        if (!timer) return DEFAULT_TIMER_SECONDS; // значение по умолчанию
        return playerColor === "white" ? timer.blackTime : timer.whiteTime;
    }, [timer, playerColor]);

    const playerTime = useMemo(() => {
        if (!timer) return DEFAULT_TIMER_SECONDS; // значение по умолчанию
        return playerColor === "white" ? timer.whiteTime : timer.blackTime;
    }, [timer, playerColor]);

    return { initialOpponentTime, initialPlayerTime, opponentTime, playerTime };
}
