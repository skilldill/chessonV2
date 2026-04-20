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
import { getRoomTimeSettingsFromStorage, setRoomTimeSettingsToStorage } from '../../utils/roomTimeStorage';
import { CreateGameButton } from '../../components/CreateGameButton/CreateGameButton';
import { AppVersionCaption } from '../../components/AppVersionCaption/AppVersionCaption';
import { AppTopBar } from '../../components/AppTopBar/AppTopBar';
import AIiconPNG from '../../assets/ai-icon.png';
import SigninSVG from '../../assets/signin.svg';

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
                <div className="relative w-full min-h-full flex justify-center items-center overflow-y-auto py-4">
                    <AppTopBar />
                    <div className="max-w-[432px] w-full flex flex-col items-center gap-6 px-4">
                        <div className='w-full flex flex-col gap-6'>
                            <div
                                onClick={() => { window.location.href = '/login' }}
                                className="flex justify-center items-center w-full h-[48px] gap-[8px] rounded-xl border border-white/15 bg-white/5 active:bg-white/10 transition-colors duration-200 text-white text-[18px] font-semibold"
                            >
                                Sign in <img src={SigninSVG} alt="signin" />
                            </div>

                            {/* Временно заблокирую, потому что не знаю насколько актуально */}
                            {/* <CreateGameButton
                                title={(
                                    <span className="flex gap-[4px]">
                                        Chessboard theme
                                        <span className="flex font-extrabold bg-gradient-to-r from-[#10D6E8] to-[#D079DF] bg-clip-text text-transparent">
                                            + New theme
                                        </span>
                                    </span>
                                )}
                                subtitle={activeThemeLabel}
                                onClick={() => {
                                    setSelectedTheme(activeTheme);
                                    setIsThemeModalOpen(true);
                                }}
                                theme="neutral"
                            /> */}

                            <QuickPlayButton
                                onClick={openQuickPlay}
                                timeLabel={quickPlayLabel}
                                playersInQueue={playersInRandomQueue}
                            />

                            <CreateGameButton
                                title={(
                                    <span className="flex gap-[4px]">
                                        Play vs Bot
                                        <span className="flex font-extrabold bg-gradient-to-r from-[#E810A7] to-[#FFE600] bg-clip-text text-transparent">
                                            + AI hints <img className="w-[14px] h-[14px]" src={AIiconPNG} />
                                        </span>
                                    </span>
                                )}
                                subtitle="30 min, choose difficulty"
                                onClick={() => setIsBotModalOpen(true)}
                                theme="success"
                                disabled={isCreating}
                            />

                            <CreateGameButton
                                title={(
                                    <span className="flex gap-[4px]">
                                        Create room
                                        <span className="flex font-extrabold bg-gradient-to-r from-[#E810A7] to-[#FFE600] bg-clip-text text-transparent">
                                            + AI hints <img className="w-[14px] h-[14px]" src={AIiconPNG} />
                                        </span>
                                    </span>
                                )}
                                subtitle={`${timeMinutes} min + ${incrementSeconds} sec`}
                                onClick={() => setIsTimeModalOpen(true)}
                                theme="success"
                                disabled={isCreating}
                            />

                            <AppVersionCaption />
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
