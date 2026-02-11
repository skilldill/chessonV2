import { useHistory } from 'react-router-dom';
import { useCreateRoom } from '../../hooks/useCreateRoom';

export const CreateRoomSection: React.FC = () => {
  const history = useHistory();
  const { createRoom, isCreating } = useCreateRoom();

  return (
    <>
      {/* Заголовок */}
      <div className="w-full text-center">
        <h3 className="text-left text-[24px] text-white/90 font-semibold">
          Create room
        </h3>
      </div>

      {/* Быстрые кнопки создания комнаты - плитка */}
      <div className="w-full grid grid-cols-2 gap-3">
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
    </>
  );
};
