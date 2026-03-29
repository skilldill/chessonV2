import { useEffect, useState } from 'react';
import { useCreateRoom } from '../../hooks/useCreateRoom';
import { BotDifficultyModal, type BotDifficulty } from '../BotDifficultyModal/BotDifficultyModal';
import { RoomTimeModal } from '../RoomTimeModal/RoomTimeModal';
import { getRoomTimeSettingsFromStorage, setRoomTimeSettingsToStorage } from '../../utils/roomTimeStorage';
import { CreateGameButton } from '../CreateGameButton/CreateGameButton';
import AIiconPNG from '../../assets/ai-icon.png';

const initialRoomTime = getRoomTimeSettingsFromStorage();

export const CreateRoomSection: React.FC = () => {
  const { createRoom, isCreating } = useCreateRoom();
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
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
