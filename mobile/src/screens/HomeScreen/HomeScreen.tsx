import { useEffect, useState } from 'react';
import { useQuickPlayEntry } from '../../hooks/useQuickPlayEntry';
import { useCreateRoom } from '../../hooks/useCreateRoom';
import { getRoomTimeSettingsFromStorage, setRoomTimeSettingsToStorage } from '../../utils/roomTimeStorage';
import { AppVersionCaption } from '../../components/AppVersionCaption/AppVersionCaption';
import { AppTopBar } from '../../components/AppTopBar/AppTopBar';
import { BotDifficultyModal, type BotDifficulty } from '../../components/BotDifficultyModal/BotDifficultyModal';
import { RoomTimeModal } from '../../components/RoomTimeModal/RoomTimeModal';
import {
  BotIcon,
  FriendsIcon,
  LabsIcon,
  LightningIcon,
  MobilePrimaryFeatureButton,
  PuzzleIcon,
  TrophyIcon,
} from '../../components/MobileHomeCards/MobileHomeCards';
import { useTranslation } from 'react-i18next';
import { TWO_QUEENS_FEN, TWO_QUEENS_GAME_MODE } from '../../constants/chess';

const initialRoomTime = getRoomTimeSettingsFromStorage();

const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const { createRoom, isCreating } = useCreateRoom();
  const { quickPlayLabel, openQuickPlay } = useQuickPlayEntry();
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [isLabsModalOpen, setIsLabsModalOpen] = useState(false);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');
  const [timeMinutes, setTimeMinutes] = useState(initialRoomTime.timeMinutes);
  const [incrementSeconds, setIncrementSeconds] = useState(initialRoomTime.incrementSeconds);
  const [withAIhints, setWithAIhints] = useState(false);

  useEffect(() => {
    setRoomTimeSettingsToStorage(timeMinutes, incrementSeconds);
  }, [timeMinutes, incrementSeconds]);

  const handleCreateBotRoom = () => {
    createRoom({
      timeMinutes: 30,
      incrementSeconds: 0,
      vsBot: true,
      botDifficulty,
      botMoveTimeMs: 800,
    }, () => {
      setIsBotModalOpen(false);
    });
  };

  const handleCreateFriendRoom = () => {
    createRoom({
      timeMinutes,
      incrementSeconds,
      withAIhints,
    }, () => {
      setIsTimeModalOpen(false);
    });
  };

  const handleCreateTwoQueensRoom = () => {
    createRoom({
      timeMinutes,
      incrementSeconds,
      withAIhints: false,
      currentFEN: TWO_QUEENS_FEN,
      gameMode: TWO_QUEENS_GAME_MODE,
    }, () => {
      setIsLabsModalOpen(false);
    });
  };

  return (
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
            title={t("labs.title")}
            subtitle={t("labs.cardSubtitle")}
            tone="purple"
            icon={<LabsIcon />}
            badges={[t("labs.badge"), t("labs.noKingsBadge")]}
            featuredBadge={t("labs.newBadge")}
            onClick={() => setIsLabsModalOpen(true)}
            disabled={isCreating}
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

      <LabsModal
        isOpen={isLabsModalOpen}
        isCreating={isCreating}
        onClose={() => setIsLabsModalOpen(false)}
        onCreateTwoQueens={handleCreateTwoQueensRoom}
      />
    </div>
  );
};

function LabsModal({
  isOpen,
  isCreating,
  onClose,
  onCreateTwoQueens,
}: {
  isOpen: boolean;
  isCreating: boolean;
  onClose: () => void;
  onCreateTwoQueens: () => void;
}) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-[392px] rounded-xl border border-[#8B7CFF]/30 bg-[#0B0B12] p-5 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-xl font-bold">{t("labs.modalTitle")}</h2>
            <p className="m-0 mt-1.5 text-sm text-white/60">{t("labs.modalSubtitle")}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-white/60 transition hover:bg-white/10 hover:text-white">
            {t("common.close")}
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={onCreateTwoQueens}
            disabled={isCreating}
            className="flex items-center justify-between gap-3 rounded-lg border border-[#8B7CFF]/45 bg-[#4F39F6]/15 p-4 text-left transition hover:border-[#B8AEFF] hover:bg-[#4F39F6]/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>
              <span className="block text-base font-semibold">{t("labs.twoQueens.title")}</span>
              <span className="mt-1 block text-sm text-white/60">{t("labs.twoQueens.subtitle")}</span>
            </span>
            <span className="text-xl text-white/70">›</span>
          </button>

          <p className="m-0 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-white/55">
            {t("labs.moreComingSoon")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default HomeScreen;
