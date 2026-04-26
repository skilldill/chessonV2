import { useEffect, useState } from "react";
import { useCreateRoom } from "../../hooks/useCreateRoom";
import {
  BotDifficultyModal,
  type BotDifficulty,
  type BotPlayerColor,
  type BotStartPositionMode
} from "../BotDifficultyModal/BotDifficultyModal";
import { RoomTimeModal } from "../RoomTimeModal/RoomTimeModal";
import { CreateGameButton } from "../CreateGameButton/CreateGameButton";
import { getRoomTimeSettingsFromStorage, setRoomTimeSettingsToStorage } from "../../utils/roomTimeStorage";
import AIiconPNG from '../../assets/ai-icon.png';
import { useTranslation } from "react-i18next";

const initialRoomTime = getRoomTimeSettingsFromStorage();
const BOT_CUSTOM_FEN_STORAGE_KEY = "botCustomFEN";
const FRIEND_CUSTOM_FEN_STORAGE_KEY = "friendCustomFEN";

function getBotCustomFenFromStorage() {
  if (typeof window === "undefined") {
    return "";
  }
  return localStorage.getItem(BOT_CUSTOM_FEN_STORAGE_KEY) || "";
}

function getFriendCustomFenFromStorage() {
  if (typeof window === "undefined") {
    return "";
  }
  return localStorage.getItem(FRIEND_CUSTOM_FEN_STORAGE_KEY) || "";
}

export const CreateRoomSection = () => {
  const { t } = useTranslation();
  const { createRoom, isCreating } = useCreateRoom();
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>("medium");
  const [botPlayerColor, setBotPlayerColor] = useState<BotPlayerColor>("white");
  const [botStartPositionMode, setBotStartPositionMode] = useState<BotStartPositionMode>("default");
  const [botCustomFEN, setBotCustomFEN] = useState(getBotCustomFenFromStorage);
  const [timeMinutes, setTimeMinutes] = useState(initialRoomTime.timeMinutes);
  const [incrementSeconds, setIncrementSeconds] = useState(initialRoomTime.incrementSeconds);
  const [friendStartPositionMode, setFriendStartPositionMode] = useState<"default" | "custom">("default");
  const [friendCustomFEN, setFriendCustomFEN] = useState(getFriendCustomFenFromStorage);
  const [withAIhints, setWithAIhints] = useState(false);

  useEffect(() => {
    setRoomTimeSettingsToStorage(timeMinutes, incrementSeconds);
  }, [timeMinutes, incrementSeconds]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (botCustomFEN.length > 0) {
      localStorage.setItem(BOT_CUSTOM_FEN_STORAGE_KEY, botCustomFEN);
      return;
    }

    localStorage.removeItem(BOT_CUSTOM_FEN_STORAGE_KEY);
  }, [botCustomFEN]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (friendCustomFEN.length > 0) {
      localStorage.setItem(FRIEND_CUSTOM_FEN_STORAGE_KEY, friendCustomFEN);
      return;
    }

    localStorage.removeItem(FRIEND_CUSTOM_FEN_STORAGE_KEY);
  }, [friendCustomFEN]);

  const handleCreateBotRoom = () => {
    const trimmedFen = botCustomFEN.trim();
    createRoom({
      timeMinutes: 30,
      incrementSeconds: 0,
      vsBot: true,
      botDifficulty,
      botMoveTimeMs: 800,
      color: botPlayerColor,
      currentFEN: botStartPositionMode === "custom" && trimmedFen.length > 0 ? trimmedFen : undefined,
    });
  };

  const handleCreateFriendRoom = () => {
    const trimmedFen = friendCustomFEN.trim();
    createRoom({
      timeMinutes,
      incrementSeconds,
      withAIhints,
      currentFEN: friendStartPositionMode === "custom" && trimmedFen.length > 0 ? trimmedFen : undefined,
    });
  };

  return (
    <>
      <div className="w-full flex flex-col gap-3">
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
      </div>

      <BotDifficultyModal
        isOpen={isBotModalOpen}
        isCreating={isCreating}
        difficulty={botDifficulty}
        playerColor={botPlayerColor}
        startPositionMode={botStartPositionMode}
        customFEN={botCustomFEN}
        onChangeDifficulty={setBotDifficulty}
        onChangePlayerColor={setBotPlayerColor}
        onChangeStartPositionMode={setBotStartPositionMode}
        onChangeCustomFEN={setBotCustomFEN}
        onClose={() => setIsBotModalOpen(false)}
        onConfirm={handleCreateBotRoom}
      />

      <RoomTimeModal
        isOpen={isTimeModalOpen}
        isCreating={isCreating}
        timeMinutes={timeMinutes}
        incrementSeconds={incrementSeconds}
        withAIhints={withAIhints}
        startPositionMode={friendStartPositionMode}
        customFEN={friendCustomFEN}
        onChangeTimeMinutes={setTimeMinutes}
        onChangeIncrementSeconds={setIncrementSeconds}
        onChangeWithAIhints={setWithAIhints}
        onChangeStartPositionMode={setFriendStartPositionMode}
        onChangeCustomFEN={setFriendCustomFEN}
        onClose={() => setIsTimeModalOpen(false)}
        onConfirm={handleCreateFriendRoom}
      />
    </>
  );
};
