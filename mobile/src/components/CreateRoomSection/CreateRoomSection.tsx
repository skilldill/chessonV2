import { useHistory } from 'react-router-dom';
import { useState } from 'react';
import { useCreateRoom } from '../../hooks/useCreateRoom';
import { BotDifficultyModal, type BotDifficulty } from '../BotDifficultyModal/BotDifficultyModal';
import RobotEmojiWebp from '../../assets/robot-emoji.webp';

export const CreateRoomSection: React.FC = () => {
  const history = useHistory();
  const { createRoom, isCreating } = useCreateRoom();
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');

  const handleCreateBotRoom = () => {
    createRoom({
      timeMinutes: 30,
      incrementSeconds: 0,
      vsBot: true,
      botDifficulty,
      botMoveTimeMs: 800
    });
  };

  return (
    <>
      {/* Заголовок */}
      <div className="w-full text-center">
        <h3 className="text-left text-[24px] text-white/90 font-semibold">
          Create a Room
        </h3>
      </div>

      {/* Быстрые кнопки создания комнаты - плитка */}
      <div className="w-full grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setIsBotModalOpen(true)}
          disabled={isCreating}
          className="btn-client btn-client-preset col-span-2 rounded-xl px-4 py-5 min-h-[64px] text-white/90 font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed border border-[#2D7A4F]/60 bg-[#2D7A4F]/20"
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
          onClick={() => createRoom({ timeMinutes: 3, incrementSeconds: 0 })}
          className="btn-client btn-client-preset rounded-xl px-4 py-5 min-h-[64px] text-white/90 font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold">3 min</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => createRoom({ timeMinutes: 3, incrementSeconds: 2 })}
          className="btn-client btn-client-preset rounded-xl px-4 py-5 min-h-[64px] text-white/90 font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold">3 min + 2 sec</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => createRoom({ timeMinutes: 5, incrementSeconds: 0 })}
          className="btn-client btn-client-preset rounded-xl px-4 py-5 min-h-[64px] text-white/90 font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold">5 min</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => createRoom({ timeMinutes: 5, incrementSeconds: 2 })}
          className="btn-client btn-client-preset rounded-xl px-4 py-5 min-h-[64px] text-white/90 font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold">5 min + 2 sec</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => createRoom({ timeMinutes: 10, incrementSeconds: 0 })}
          className="btn-client btn-client-preset rounded-xl px-4 py-5 min-h-[64px] text-white/90 font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold">10 min</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => createRoom({ timeMinutes: 10, incrementSeconds: 5 })}
          className="btn-client btn-client-preset rounded-xl px-4 py-5 min-h-[64px] text-white/90 font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold">10 min + 5 sec</span>
          </div>
        </button>
      </div>

      {/* Кнопка для перехода на экран настройки времени */}
      <button
        type="button"
        onClick={() => history.push('/create-room')}
        className="btn-client btn-client-preset w-full rounded-xl px-6 py-5 min-h-[56px] text-white/90 font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation"
      >
        <div className="flex items-center justify-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Set time
        </div>
      </button>

      <BotDifficultyModal
        isOpen={isBotModalOpen}
        isCreating={isCreating}
        difficulty={botDifficulty}
        onChangeDifficulty={setBotDifficulty}
        onClose={() => setIsBotModalOpen(false)}
        onConfirm={handleCreateBotRoom}
      />
    </>
  );
};
