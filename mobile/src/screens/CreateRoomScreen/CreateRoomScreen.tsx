import { useEffect, useState } from 'react';
import { useCreateRoom } from '../../hooks/useCreateRoom';
import { useQuickPlayEntry } from '../../hooks/useQuickPlayEntry';
import { BotDifficultyModal, type BotDifficulty } from '../../components/BotDifficultyModal/BotDifficultyModal';
import { RoomTimeModal } from '../../components/RoomTimeModal/RoomTimeModal';
import { getRoomTimeSettingsFromStorage, setRoomTimeSettingsToStorage } from '../../utils/roomTimeStorage';
import { AppVersionCaption } from '../../components/AppVersionCaption/AppVersionCaption';
import { AppTopBar } from '../../components/AppTopBar/AppTopBar';
import {
    BotIcon,
    FriendsIcon,
    LightningIcon,
    MobilePrimaryFeatureButton,
    PuzzleIcon,
    TrophyIcon,
} from '../../components/MobileHomeCards/MobileHomeCards';
import { useTranslation } from 'react-i18next';

const initialRoomTime = getRoomTimeSettingsFromStorage();

const CreateRoomScreen: React.FC = () => {
    const { t } = useTranslation();
    const [isBotModalOpen, setIsBotModalOpen] = useState(false);
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
    const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');
    const [timeMinutes, setTimeMinutes] = useState(initialRoomTime.timeMinutes);
    const [incrementSeconds, setIncrementSeconds] = useState(initialRoomTime.incrementSeconds);
    const [withAIhints, setWithAIhints] = useState(false);

    useEffect(() => {
        setRoomTimeSettingsToStorage(timeMinutes, incrementSeconds);
    }, [timeMinutes, incrementSeconds]);

    const { createRoom, isCreating } = useCreateRoom();
    const { openQuickPlay, quickPlayLabel } = useQuickPlayEntry();

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

    return (
        <>
            <div className="relative min-h-full w-full overflow-y-auto bg-[#050507] text-white" style={{ height: window.innerHeight }}>
                <div className="fixed top-0 left-0 right-0 z-1">
                    <AppTopBar />
                </div>
                <div className="mx-auto flex w-full max-w-[432px] flex-col gap-4 px-4 pb-8 pt-[74px]">
                    <div className="grid gap-4">
                        <MobilePrimaryFeatureButton
                            title={t("room.quickPlay")}
                            subtitle={t("room.randomOpponent")}
                            badges={[quickPlayLabel]}
                            tone="purple"
                            icon={<LightningIcon />}
                            onClick={openQuickPlay}
                        />

                        <MobilePrimaryFeatureButton
                            title={t("puzzles.puzzles")}
                            subtitle={t("puzzles.findTheBestMove")}
                            badges={[t("puzzles.hints"), t("puzzles.moveHistory")]}
                            tone="rose"
                            icon={<PuzzleIcon />}
                            to="/puzzles"
                        />
                        <MobilePrimaryFeatureButton
                            title={t("room.playVsBot")}
                            subtitle={t("home.botFeature.difficulty")}
                            tone="green"
                            icon={<BotIcon />}
                            badges={["30 min + 0 sec", t("room.aiHints")]}
                            onClick={() => setIsBotModalOpen(true)}
                            disabled={isCreating}
                        />
                        <MobilePrimaryFeatureButton
                            title={t("room.createRoom")}
                            subtitle={t("home.roomFeature.link")}
                            tone="blue"
                            icon={<FriendsIcon />}
                            badges={[t("room.aiHints")]}
                            onClick={() => setIsTimeModalOpen(true)}
                            disabled={isCreating}
                        />
                        <MobilePrimaryFeatureButton
                            title={t("tournament.create")}
                            subtitle={t("home.tournamentFeature.swiss")}
                            tone="yellow"
                            icon={<TrophyIcon />}
                            badges={[t("tournament.defaultTitle")]}
                            to="/tournaments/new"
                        />
                    </div>

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

        </>
    );
};

export default CreateRoomScreen;
