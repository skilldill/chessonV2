import { IonPage, IonContent } from '@ionic/react';
import { QuickPlayButton } from '../../components/QuickPlayButton/QuickPlayButton';
import { useEffect, useState } from 'react';
import { useCreateRoom } from '../../hooks/useCreateRoom';
import { useQuickPlayEntry } from '../../hooks/useQuickPlayEntry';
import { BotDifficultyModal, type BotDifficulty } from '../../components/BotDifficultyModal/BotDifficultyModal';
import { RoomTimeModal } from '../../components/RoomTimeModal/RoomTimeModal';
import { CHESSBOARD_THEMES } from '../../components/ChessBoardConfigs/ChessBoardConfigs';
import { ChessboardThemeModal } from '../../components/ChessboardThemeModal/ChessboardThemeModal';
import { getChessboardThemeFromStorage, setChessboardThemeToStorage } from '../../utils/appearanceStorage';
import RobotEmojiWebp from '../../assets/robot-emoji.webp';
import { getRoomTimeSettingsFromStorage, setRoomTimeSettingsToStorage } from '../../utils/roomTimeStorage';

const initialRoomTime = getRoomTimeSettingsFromStorage();

const CreateRoomScreen: React.FC = () => {
    const [isBotModalOpen, setIsBotModalOpen] = useState(false);
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
    const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');
    const [timeMinutes, setTimeMinutes] = useState(initialRoomTime.timeMinutes);
    const [incrementSeconds, setIncrementSeconds] = useState(initialRoomTime.incrementSeconds);
    const [withAIhints, setWithAIhints] = useState(false);
    const [activeTheme, setActiveTheme] = useState(getChessboardThemeFromStorage());
    const [selectedTheme, setSelectedTheme] = useState(getChessboardThemeFromStorage());

    useEffect(() => {
        setRoomTimeSettingsToStorage(timeMinutes, incrementSeconds);
    }, [timeMinutes, incrementSeconds]);

    const { createRoom, isCreating } = useCreateRoom();
    const { openQuickPlay, quickPlayLabel, playersInRandomQueue } = useQuickPlayEntry();

    const availableThemes = Object.keys(CHESSBOARD_THEMES);
    const activeThemeLabel = activeTheme === 'magic' ? 'Magic' : 'Default';

    const handleCreateBotRoom = () => {
        createRoom({
            timeMinutes: 30,
            incrementSeconds: 0,
            vsBot: true,
            botDifficulty,
            botMoveTimeMs: 800
        });
    };

    const handleCreateFriendRoom = () => {
        createRoom({
            timeMinutes,
            incrementSeconds,
            withAIhints,
        });
    };

    const handleSaveThemeToStorage = () => {
        setChessboardThemeToStorage(selectedTheme);
        setActiveTheme(selectedTheme);
        setIsThemeModalOpen(false);
    };

    return (
        <IonPage>
            <IonContent>
                <div className="w-full min-h-full flex justify-center items-center overflow-y-auto py-4">
                    <div className="max-w-[432px] w-full flex flex-col items-center gap-6 px-4">
                        <div className='w-full flex flex-col gap-6'>
                            <div className="flex flex-col gap-1">
                            <QuickPlayButton
                                onClick={openQuickPlay}
                                timeLabel={quickPlayLabel}
                                playersInQueue={playersInRandomQueue}
                            />
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsBotModalOpen(true)}
                                disabled={isCreating}
                                className="btn-client btn-client-preset w-full rounded-xl px-4 py-5 min-h-[64px] text-white/90 font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed border border-[#2D7A4F]/60 bg-[#2D7A4F]/20"
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-2">
                                        <img src={RobotEmojiWebp} alt="Bot" className="w-[30px] h-[30px] select-none" />
                                        <span className="text-lg font-bold">Play vs Bot</span>
                                    </div>
                                    <span className="text-sm opacity-90">30 min, choose difficulty</span>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsTimeModalOpen(true)}
                                disabled={isCreating}
                                className="btn-client btn-client-preset w-full rounded-xl px-4 py-5 min-h-[64px] text-white/90 font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed border border-[#2D7A4F]/60 bg-[#2D7A4F]/20"
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-2">
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            aria-hidden
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                                        </svg>
                                    <span className="text-lg font-bold">Create room</span>
                                </div>
                                    <span className="text-sm opacity-90">{timeMinutes} min + {incrementSeconds} sec</span>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedTheme(activeTheme);
                                    setIsThemeModalOpen(true);
                                }}
                                className="btn-client btn-client-preset w-full rounded-xl px-4 py-5 min-h-[64px] text-white/90 font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation border border-white/10 bg-white/4"
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-lg font-bold">Chessboard theme</span>
                                    <span className="text-sm opacity-90">{activeThemeLabel}</span>
                                </div>
                            </button>
                        </div>
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

                <RoomTimeModal
                    isOpen={isTimeModalOpen}
                    isCreating={isCreating}
                    timeMinutes={timeMinutes}
                    incrementSeconds={incrementSeconds}
                    withAIhints={withAIhints}
                    onChangeTimeMinutes={setTimeMinutes}
                    onChangeIncrementSeconds={setIncrementSeconds}
                    onChangeWithAIhints={setWithAIhints}
                    onClose={() => setIsTimeModalOpen(false)}
                    onConfirm={handleCreateFriendRoom}
                />

                <ChessboardThemeModal
                    isOpen={isThemeModalOpen}
                    selectedTheme={selectedTheme}
                    availableThemes={availableThemes}
                    onSelectTheme={setSelectedTheme}
                    onClose={() => setIsThemeModalOpen(false)}
                    onConfirm={handleSaveThemeToStorage}
                />
            </IonContent>
        </IonPage>
    );
};

export default CreateRoomScreen;
