import { useEffect, useMemo, useState } from "react";
import { QuickPlayButton } from "../../components/QuickPlayButton/QuickPlayButton";
import { useQuickPlayEntry } from "../../hooks/useQuickPlayEntry";
import { BotDifficultyModal, type BotDifficulty } from "../../components/BotDifficultyModal/BotDifficultyModal";
import { RoomTimeModal } from "../../components/RoomTimeModal/RoomTimeModal";
import { useCreateRoom } from "../../hooks/useCreateRoom";
import { CreateGameButton } from "../../components/CreateGameButton/CreateGameButton";
import { ChessboardThemeModal } from "../../components/ChessboardThemeModal/ChessboardThemeModal";
import { CHESSBOARD_THEMES } from "../../components/ChessBoardConfigs/ChessBoardConfigs";
import { getChessboardThemeFromStorage, setChessboardThemeToStorage } from "../../utils/appearanceStorage";
import { getRoomTimeSettingsFromStorage, setRoomTimeSettingsToStorage } from "../../utils/roomTimeStorage";
import { Link } from "react-router-dom";
import { AppVersionCaption } from "../../components/AppVersionCaption/AppVersionCaption";
import { AppTopBar } from "../../components/AppTopBar/AppTopBar";
import AIiconPNG from '../../assets/ai-icon.png';
import SigninSVG from '../../assets/signin.svg';
import { useTranslation } from "react-i18next";

const initialRoomTime = getRoomTimeSettingsFromStorage();

export const CreateRoomScreen = () => {
    const { t } = useTranslation();
    const { openQuickPlay, quickPlayLabel, playersInRandomQueue } = useQuickPlayEntry();
    const { createRoom, isCreating, roomCreatingError } = useCreateRoom();
    const [isBotModalOpen, setIsBotModalOpen] = useState(false);
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
    const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>("medium");
    const [timeMinutes, setTimeMinutes] = useState(initialRoomTime.timeMinutes);
    const [incrementSeconds, setIncrementSeconds] = useState(initialRoomTime.incrementSeconds);
    const [_, setActiveTheme] = useState(getChessboardThemeFromStorage());
    const [selectedTheme, setSelectedTheme] = useState(getChessboardThemeFromStorage());
    const [withAIhints, setWithAIhints] = useState(false);

    useEffect(() => {
      setRoomTimeSettingsToStorage(timeMinutes, incrementSeconds);
    }, [timeMinutes, incrementSeconds]);

    const availableThemes = useMemo(() => Object.keys(CHESSBOARD_THEMES), []);
    // const activeThemeLabel = activeTheme.charAt(0).toUpperCase() + activeTheme.slice(1);

    const handleCreateBotRoom = () => {
        createRoom({
            vsBot: true,
            botDifficulty,
            botMoveTimeMs: 800,
            timeMinutes: 30,
            incrementSeconds: 0,
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
        <div className="relative w-full h-[100vh] flex justify-center items-center overflow-y-auto py-4">
            <AppTopBar />
            <div className="w-[100%] max-w-[432px] flex flex-col m-auto items-center gap-[32px] py-[32px]">
                <div className="w-full flex flex-col gap-6">
                    <Link
                        to="/login"
                        className="flex justify-center items-center gap-[8px] w-full h-[48px] rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition-colors duration-200 text-white text-[18px] flex items-center justify-center"
                    >
                        {t("room.signIn")} <img src={SigninSVG} alt="signin" />
                    </Link>

                    {/* <CreateGameButton
                        title={(
                            <span className="flex gap-[4px]">
                                Chessboard theme
                                <span className="flex font-extrabold bg-gradient-to-r from-[#10D6E8] to-[#D079DF] bg-clip-text text-transparent">
                                    + New theme
                                </span>
                            </span>
                        )}
                        subtitle={<span>Active theme: <span className="font-bold">{activeThemeLabel}</span></span>}
                        onClick={() => {
                            setSelectedTheme(activeTheme);
                            setIsThemeModalOpen(true);
                        }}
                        theme="neutral"
                    /> */}

                    <div className="flex flex-col gap-1">
                        <QuickPlayButton
                            onClick={openQuickPlay}
                            timeLabel={quickPlayLabel}
                            playersInQueue={playersInRandomQueue}
                        />
                    </div>

                    <CreateGameButton
                        title={(
                            <span className="flex gap-[4px]">
                                {t("room.playVsBot")}
                                <span className="flex font-extrabold bg-gradient-to-r from-[#E810A7] to-[#FFE600] bg-clip-text text-transparent">
                                    + {t("room.aiHints")} <img className="w-[14px] h-[14px]" src={AIiconPNG} />
                                </span>
                            </span>
                         )}
                        subtitle={t("room.botSubtitle")}
                        onClick={() => setIsBotModalOpen(true)}
                        theme="success"
                        disabled={isCreating}
                    />

                    <CreateGameButton
                        title={(
                            <span className="flex gap-[4px]">
                                {t("room.createRoom")}
                                <span className="flex font-extrabold bg-gradient-to-r from-[#E810A7] to-[#FFE600] bg-clip-text text-transparent">
                                    + {t("room.aiHints")} <img className="w-[14px] h-[14px]" src={AIiconPNG} />
                                </span>
                            </span>
                          )}
                        subtitle={t("room.timeSummary", { timeMinutes, incrementSeconds })}
                        onClick={() => setIsTimeModalOpen(true)}
                        theme="success"
                        disabled={isCreating}
                    />

                    {roomCreatingError && (
                        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm">
                            {roomCreatingError}
                        </div>
                    )}

                    <AppVersionCaption />
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
                isSaving={false}
                selectedTheme={selectedTheme}
                availableThemes={availableThemes}
                onSelectTheme={setSelectedTheme}
                onClose={() => setIsThemeModalOpen(false)}
                onConfirm={handleSaveThemeToStorage}
            />
        </div>
    );
};
