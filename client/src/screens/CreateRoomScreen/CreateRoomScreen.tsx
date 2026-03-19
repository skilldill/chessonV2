import { useState } from "react";
import { useHistory } from "react-router-dom";
import { API_PREFIX } from "../../constants/api";
import { QuickPlayButton } from "../../components/QuickPlayButton/QuickPlayButton";
import { useQuickPlayEntry } from "../../hooks/useQuickPlayEntry";
import { BotDifficultyModal, type BotDifficulty } from "../../components/BotDifficultyModal/BotDifficultyModal";
import RobotEmojiWebp from "../../assets/robot-emoji.webp";

const BOT_GUEST_PROFILE_KEY = "botGuestProfile";
const MINUTES_FOR_PLAYER = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50, 60, 120];
const SECONDS_FOR_MOVE = [0, 1, 2, 3, 4, 5, 10, 15, 20, 30, 40, 50, 60, 100];
export const CreateRoomScreen = () => {
    const history = useHistory();
    const { openQuickPlay, quickPlayLabel, playersInRandomQueue } = useQuickPlayEntry();
    const [timeMinutes, setTimeMinutes] = useState(10);
    const [incrementSeconds, setIncrementSeconds] = useState(1);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isBotModalOpen, setIsBotModalOpen] = useState(false);
    const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');

    const handleCreateRoom = async (
        options?: {
            vsBot?: boolean;
            botDifficulty?: BotDifficulty;
            botMoveTimeMs?: number;
            timeMinutes?: number;
            incrementSeconds?: number;
        }
    ) => {
        try {
            setIsCreating(true);
            setError(null);

            const selectedTimeMinutes = options?.timeMinutes ?? timeMinutes;
            const selectedIncrementSeconds = options?.incrementSeconds ?? incrementSeconds;
            const timeSeconds = selectedTimeMinutes * 60;

            const response = await fetch(API_PREFIX + '/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    whiteTimer: timeSeconds,
                    blackTimer: timeSeconds,
                    increment: selectedIncrementSeconds,
                    vsBot: options?.vsBot,
                    botDifficulty: options?.botDifficulty,
                    botMoveTimeMs: options?.botMoveTimeMs
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create room');
            }

            const data = await response.json();

            if (data.success && data.roomId) {
                if (options?.vsBot) {
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

    const handleCreateBotRoom = async () => {
        await handleCreateRoom({
            vsBot: true,
            botDifficulty,
            botMoveTimeMs: 800,
            timeMinutes: 30,
            incrementSeconds: 0
        });
    };

    return (
        <div className="w-full h-[100vh] flex justify-center items-center overflow-y-auto py-4">
            <div className="max-w-[432px] px-6 flex flex-col m-auto items-center gap-[32px] py-[32px]">
                <h3 className="text-white text-center text-3xl font-semibold">
                    Time settings
                </h3>

                <div className="w-full flex flex-col gap-6">
                    <div className="flex flex-col gap-1">
                        <QuickPlayButton
                            onClick={openQuickPlay}
                            timeLabel={quickPlayLabel}
                            playersInQueue={playersInRandomQueue}
                        />
                        <p className="text-xs text-white/60 px-2">
                            {playersInRandomQueue} {playersInRandomQueue === 1 ? "player" : "players"} in quick play
                        </p>
                    </div>

                    <button
                        onClick={() => setIsBotModalOpen(true)}
                        disabled={isCreating}
                        className="w-full rounded-xl px-4 py-4 bg-[#2D7A4F]/20 border border-[#2D7A4F]/60 text-white font-semibold hover:bg-[#2D7A4F]/30 transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-2">
                                <img
                                    src={RobotEmojiWebp}
                                    alt="Bot"
                                    className="w-[24px] h-[24px] select-none"
                                />
                                <span className="text-lg font-bold">Play vs Bot</span>
                            </div>
                            <span className="text-sm opacity-90">30 min, choose difficulty</span>
                        </div>
                    </button>

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
                        onClick={() => void handleCreateRoom()}
                        disabled={isCreating}
                        className="rounded-md text-sm font-semibold px-4 py-2 bg-[#4F39F6] text-white min-w-[126px] cursor-pointer transition-all duration-300 active:scale-95 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed w-full"
                    >
                        {isCreating ? "Creating..." : "Create room"}
                    </button>
                </div>
            </div>

            <BotDifficultyModal
                isOpen={isBotModalOpen}
                isCreating={isCreating}
                difficulty={botDifficulty}
                onChangeDifficulty={setBotDifficulty}
                onClose={() => setIsBotModalOpen(false)}
                onConfirm={handleCreateBotRoom}
            />
        </div>
    );
};
