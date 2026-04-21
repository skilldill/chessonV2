import { useEffect, useState } from "react";
import { useCreateRoom } from "../../hooks/useCreateRoom";
import { BotDifficultyModal, type BotDifficulty } from "../BotDifficultyModal/BotDifficultyModal";
import { RoomTimeModal } from "../RoomTimeModal/RoomTimeModal";
import { CreateGameButton } from "../CreateGameButton/CreateGameButton";
import { getRoomTimeSettingsFromStorage, setRoomTimeSettingsToStorage } from "../../utils/roomTimeStorage";
import AIiconPNG from '../../assets/ai-icon.png';
import { useTranslation } from "react-i18next";

const initialRoomTime = getRoomTimeSettingsFromStorage();

export const CreateRoomSection = () => {
  const { t } = useTranslation();
  const { createRoom, isCreating } = useCreateRoom();
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>("medium");
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
