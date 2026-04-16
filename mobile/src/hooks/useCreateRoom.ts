import { useState } from "react";
import { API_PREFIX } from "../constants/api";
import { CapacitorHttp } from '@capacitor/core';

const BOT_GUEST_PROFILE_KEY = "botGuestProfile";

type CreateRoomData = {
    timeMinutes: number;
    incrementSeconds: number;
    vsBot?: boolean;
    withAIhints?: boolean;
    botDifficulty?: 'super_easy' | 'easy' | 'medium' | 'hard';
    botMoveTimeMs?: number;
}

export const useCreateRoom = () => {
    const [isCreating, setIsCreating] = useState(false);
    const [roomCreatingError, setRoomCreatingError] = useState<string | null>(null);

    const createRoom = async (roomData: CreateRoomData, onSuccess?: () => void) => {
        try {
            setIsCreating(true);
            setRoomCreatingError(null);

            const timeSeconds = roomData.timeMinutes * 60;

            const response = await CapacitorHttp.post({
                url: API_PREFIX + '/rooms',
                data: {
                    whiteTimer: timeSeconds,
                    blackTimer: timeSeconds,
                    increment: roomData.incrementSeconds,
                    vsBot: roomData.vsBot,
                    withAIhints: roomData.withAIhints,
                    botDifficulty: roomData.botDifficulty,
                    botMoveTimeMs: roomData.botMoveTimeMs
                }
            })

            const data = response.data;

            if (data.roomId) {
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
                onSuccess?.();

                // Редирект на созданную комнату
                window.location.href = `/game/${data.roomId}`;
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
