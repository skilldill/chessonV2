import { useEffect, useState } from 'react';
import { useCreateRoom } from '../../hooks/useCreateRoom';
import { BotDifficultyModal, type BotDifficulty } from '../BotDifficultyModal/BotDifficultyModal';
import { RoomTimeModal } from '../RoomTimeModal/RoomTimeModal';
import RobotEmojiWebp from '../../assets/robot-emoji.webp';
import { getRoomTimeSettingsFromStorage, setRoomTimeSettingsToStorage } from '../../utils/roomTimeStorage';

const initialRoomTime = getRoomTimeSettingsFromStorage();

export const CreateRoomSection: React.FC = () => {
  const { createRoom, isCreating } = useCreateRoom();
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');
  const [timeMinutes, setTimeMinutes] = useState(initialRoomTime.timeMinutes);
  const [incrementSeconds, setIncrementSeconds] = useState(initialRoomTime.incrementSeconds);

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
    });
  };

  return (
    <>
      <div className="w-full text-center">
        <h3 className="text-left text-[24px] text-white/90 font-semibold">
          Create a Room
        </h3>
      </div>

      <div className="w-full flex flex-col gap-3">
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
        onChangeTimeMinutes={setTimeMinutes}
        onChangeIncrementSeconds={setIncrementSeconds}
        onClose={() => setIsTimeModalOpen(false)}
        onConfirm={handleCreateFriendRoom}
      />
    </>
  );
};
