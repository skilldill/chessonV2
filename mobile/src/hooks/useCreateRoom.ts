import { useState } from "react";
import { API_PREFIX } from "../constants/api";
import { useHistory } from "react-router-dom";
import { CapacitorHttp } from '@capacitor/core';

type CreateRoomData = {
    timeMinutes: number;
    incrementSeconds: number;
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

            const response = await CapacitorHttp.post({
                url: API_PREFIX + '/rooms',
                data: {
                    whiteTimer: timeSeconds,
                    blackTimer: timeSeconds,
                    increment: roomData.incrementSeconds
                }
            })

            const data = response.data;

            if (data.roomId) {
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
