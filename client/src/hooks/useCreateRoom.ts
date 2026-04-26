import { useState } from "react";
import { API_PREFIX } from "../constants/api";
import { useHistory } from "react-router-dom";

const BOT_GUEST_PROFILE_KEY = "botGuestProfile";

type CreateRoomData = {
    timeMinutes: number;
    incrementSeconds: number;
    vsBot?: boolean;
    withAIhints?: boolean;
    botDifficulty?: 'super_easy' | 'easy' | 'medium' | 'hard';
    botMoveTimeMs?: number;
    color?: 'white' | 'black';
    currentFEN?: string;
}

export const useCreateRoom = () => {
    const [isCreating, setIsCreating] = useState(false);
    const [roomCreatingError, setRoomCreatingError] = useState<string | null>(null);
    const history = useHistory();

    const createRoom = async (roomData: CreateRoomData) => {
        try {
            setIsCreating(true);
            setRoomCreatingError(null);

            const timeSeconds = roomData.timeMinutes * 60;

            const response = await fetch(API_PREFIX + '/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    whiteTimer: timeSeconds,
                    blackTimer: timeSeconds,
                    increment: roomData.incrementSeconds,
                    vsBot: roomData.vsBot,
                    withAIhints: roomData.withAIhints,
                    botDifficulty: roomData.botDifficulty,
                    botMoveTimeMs: roomData.botMoveTimeMs,
                    color: roomData.color,
                    currentFEN: roomData.currentFEN
                })
            });

            const data = await response.json();

            if (data.success && data.roomId) {
                if (roomData.vsBot) {
                    const randomId = Math.floor(100 + Math.random() * 900);
                    const avatar = Math.floor(Math.random() * 6);
                    localStorage.setItem(
                        BOT_GUEST_PROFILE_KEY,
                        JSON.stringify({
                            roomId: data.roomId,
                            playerName: `Guest Cat ${randomId}`,
                            avatar: `${avatar}`,
                        })
                    );
                }
                // Редирект на созданную комнату
                history.push(`/game/${data.roomId}`);
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (err) {
            console.error('Error creating room:', err);
            setRoomCreatingError(err instanceof Error ? err.message : 'Failed to create room');
            setIsCreating(false);
        }
    };

    return {
        createRoom,
        isCreating,
        roomCreatingError,
    };
}
