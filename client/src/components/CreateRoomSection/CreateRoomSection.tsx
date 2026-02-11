import { useState } from "react";
import { useCreateRoom } from "../../hooks/useCreateRoom";

const MINUTES_FOR_PLAYER = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50, 60, 120];
const SECONDS_FOR_MOVE = [0, 1, 2, 3, 4, 5, 10, 15, 20, 30, 40, 50, 60, 100];

export const CreateRoomSection = () => {
  const { createRoom, isCreating } = useCreateRoom();
  const [showTimeSettings, setShowTimeSettings] = useState(false);
  const [timeMinutes, setTimeMinutes] = useState(10);
  const [incrementSeconds, setIncrementSeconds] = useState(1);

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
          onClick={() => createRoom({ timeMinutes: 3, incrementSeconds: 0 })}
          disabled={isCreating}
          className="rounded-xl px-4 py-4 bg-white/5 border border-white/10 text-white/90 font-semibold hover:bg-white/8 hover:border-[#4F39F6]/50 transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold">3 min</span>
          </div>
        </button>

        <button
          onClick={() => createRoom({ timeMinutes: 3, incrementSeconds: 2 })}
          disabled={isCreating}
          className="rounded-xl px-4 py-4 bg-white/5 border border-white/10 text-white/90 font-semibold hover:bg-white/8 hover:border-[#4F39F6]/50 transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold">3 min + 2 sec</span>
          </div>
        </button>

        <button
          onClick={() => createRoom({ timeMinutes: 5, incrementSeconds: 0 })}
          disabled={isCreating}
          className="rounded-xl px-4 py-4 bg-white/5 border border-white/10 text-white/90 font-semibold hover:bg-white/8 hover:border-[#4F39F6]/50 transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold">5 min</span>
          </div>
        </button>

        <button
          onClick={() => createRoom({ timeMinutes: 5, incrementSeconds: 2 })}
          disabled={isCreating}
          className="rounded-xl px-4 py-4 bg-white/5 border border-white/10 text-white/90 font-semibold hover:bg-white/8 hover:border-[#4F39F6]/50 transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold">5 min + 2 sec</span>
          </div>
        </button>

        <button
          onClick={() => createRoom({ timeMinutes: 10, incrementSeconds: 0 })}
          disabled={isCreating}
          className="rounded-xl px-4 py-4 bg-white/5 border border-white/10 text-white/90 font-semibold hover:bg-white/8 hover:border-[#4F39F6]/50 transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold">10 min</span>
          </div>
        </button>

        <button
          onClick={() => createRoom({ timeMinutes: 10, incrementSeconds: 5 })}
          disabled={isCreating}
          className="rounded-xl px-4 py-4 bg-white/5 border border-white/10 text-white/90 font-semibold hover:bg-white/8 hover:border-[#4F39F6]/50 transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold">10 min + 5 sec</span>
          </div>
        </button>
      </div>

      {/* Кнопка для показа/скрытия настроек времени */}
      <button
        onClick={() => setShowTimeSettings(!showTimeSettings)}
        className="w-full rounded-xl px-6 py-4 bg-white/5 border border-white/10 text-white/90 font-semibold hover:bg-white/10 hover:border-[#4F39F6]/50 transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer"
      >
        <div className="flex items-center justify-center gap-2">
          <svg 
            className={`w-5 h-5 transition-transform duration-300 ${showTimeSettings ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {showTimeSettings ? "Hide settings" : "Set time"}
        </div>
      </button>

      {/* Time settings - раскрывающийся блок */}
      {showTimeSettings && (
        <div className="w-full bg-white/5 border border-white/10 rounded-xl p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Время на игрока */}
          <div className="flex flex-col gap-3">
            <label className="text-white/70 text-sm font-medium">
              Time per player (minutes)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {MINUTES_FOR_PLAYER.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTimeMinutes(value)}
                  disabled={isCreating}
                  className={`h-12 rounded-md border transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    timeMinutes === value
                      ? "bg-[#4F39F6]/15 text-white border-[#4F39F6]/60"
                      : "bg-white/5 text-white/80 border-white/15 hover:border-white/30"
                  }`}
                >
                  <span className="font-semibold">{value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Добавка времени */}
          <div className="flex flex-col gap-3">
            <label className="text-white/70 text-sm font-medium">
              Increment (seconds)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SECONDS_FOR_MOVE.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setIncrementSeconds(value)}
                  disabled={isCreating}
                  className={`h-12 rounded-md border transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    incrementSeconds === value
                      ? "bg-[#4F39F6]/15 text-white border-[#4F39F6]/60"
                      : "bg-white/5 text-white/80 border-white/15 hover:border-white/30"
                  }`}
                >
                  <span className="font-semibold">+{value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Кнопка создания с выбранными настройками */}
          <button
            onClick={() => createRoom({ timeMinutes, incrementSeconds })}
            disabled={isCreating}
            className="w-full rounded-xl px-6 py-4 bg-[#4F39F6] text-white font-semibold hover:bg-[#4332D7] transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Creating...
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg font-bold">Create room</span>
                <span className="text-sm opacity-90">{timeMinutes} min + {incrementSeconds} sec</span>
              </div>
            )}
          </button>
        </div>
      )}
    </>
  );
};
