import { useState } from "react";
import { useHistory } from "react-router-dom";
import { API_PREFIX } from "../../constants/api";

const MINUTES_FOR_PLAYER = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50, 60, 120];
const SECONDS_FOR_MOVE = [0, 1, 2, 3, 4, 5, 10, 15, 20, 30, 40, 50, 60, 100];

export const CreateRoomScreen = () => {
    const history = useHistory();
    const [timeMinutes, setTimeMinutes] = useState(10);
    const [incrementSeconds, setIncrementSeconds] = useState(1);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreateRoom = async () => {
        try {
            setIsCreating(true);
            setError(null);

            const timeSeconds = timeMinutes * 60;

            const response = await fetch(API_PREFIX + '/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    whiteTimer: timeSeconds,
                    blackTimer: timeSeconds,
                    increment: incrementSeconds
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create room');
            }

            const data = await response.json();

            if (data.success && data.roomId) {
                history.push(`/game/${data.roomId}`);
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (err) {
            console.error('Error creating room:', err);
            setError(err instanceof Error ? err.message : 'Failed to create room');
            setIsCreating(false);
        }
    };

    return (
        <div className="w-full h-[100vh] flex justify-center items-center overflow-y-auto py-4">
            <div className="w-[348px] flex flex-col m-auto items-center gap-[32px] py-[32px]">
                <h3 className="text-white text-center text-3xl font-semibold">
                    Time settings
                </h3>

                <div className="w-full flex flex-col gap-6 px-8">
                    {/* Время на игрока */}
                    <div className="flex flex-col gap-3">
                        <label className="text-white/80 text-sm font-medium">
                            Time per player (minutes)
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {MINUTES_FOR_PLAYER.map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setTimeMinutes(value)}
                                    className={`h-12 rounded-md border-2 transition-all duration-200 active:scale-95 focus:outline-none ${
                                        timeMinutes === value
                                            ? "bg-[#4F39F6] text-white border-[#4F39F6]"
                                            : "bg-white/10 text-white border-white/30 hover:border-white/50"
                                    }`}
                                >
                                    <span className="font-semibold">{value}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Добавка времени */}
                    <div className="flex flex-col gap-3">
                        <label className="text-white/80 text-sm font-medium">
                            Increment (seconds)
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {SECONDS_FOR_MOVE.map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setIncrementSeconds(value)}
                                    className={`h-12 rounded-md border-2 transition-all duration-200 active:scale-95 focus:outline-none ${
                                        incrementSeconds === value
                                            ? "bg-[#4F39F6] text-white border-[#4F39F6]"
                                            : "bg-white/10 text-white border-white/30 hover:border-white/50"
                                    }`}
                                >
                                    <span className="font-semibold">+{value}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleCreateRoom}
                        disabled={isCreating}
                        className="rounded-md text-sm font-semibold px-4 py-2 bg-[#4F39F6] text-white min-w-[126px] cursor-pointer transition-all duration-300 active:scale-95 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed w-full"
                    >
                        {isCreating ? "Creating..." : "Create room"}
                    </button>
                </div>
            </div>
        </div>
    );
};
