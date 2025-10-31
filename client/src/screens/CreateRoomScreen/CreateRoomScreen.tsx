import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

export const CreateRoomScreen = () => {
    const history = useHistory();
    const [isCreating, setIsCreating] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const createRoom = async () => {
            try {
                setIsCreating(true);
                setError(null);

                const response = await fetch('/api/api/rooms', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({})
                });

                if (!response.ok) {
                    throw new Error('Failed to create room');
                }

                const data = await response.json();

                if (data.success && data.roomId) {
                    // Редирект на созданную комнату
                    history.push(`/${data.roomId}`);
                } else {
                    throw new Error('Invalid response from server');
                }
            } catch (err) {
                console.error('Error creating room:', err);
                setError(err instanceof Error ? err.message : 'Failed to create room');
                setIsCreating(false);
            }
        };

        createRoom();
    }, [history]);

    return (
        <div className="w-full h-[100vh] flex justify-center items-center">
            {isCreating ? (
                <div className="text-center">
                    <div className="text-lg mb-4">Создание комнаты...</div>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                </div>
            ) : error ? (
                <div className="text-center">
                    <div className="text-lg text-red-600 mb-4">Ошибка: {error}</div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Попробовать снова
                    </button>
                </div>
            ) : null}
        </div>
    );
};

