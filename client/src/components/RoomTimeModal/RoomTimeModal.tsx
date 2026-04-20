type RoomTimeModalProps = {
  isOpen: boolean;
  isCreating: boolean;
  timeMinutes: number;
  incrementSeconds: number;
  withAIhints: boolean;
  onChangeTimeMinutes: (value: number) => void;
  onChangeIncrementSeconds: (value: number) => void;
  onChangeWithAIhints: (value: boolean) => void;
  onClose: () => void;
  onConfirm: () => void;
};

const MINUTES_FOR_PLAYER = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50, 60, 120];
const SECONDS_FOR_MOVE = [0, 1, 2, 3, 4, 5, 10, 15, 20, 30, 40, 50, 60, 100];

export const RoomTimeModal = ({
  isOpen,
  isCreating,
  timeMinutes,
  incrementSeconds,
  withAIhints,
  onChangeTimeMinutes,
  onChangeIncrementSeconds,
  onChangeWithAIhints,
  onClose,
  onConfirm,
}: RoomTimeModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close modal"
        onClick={() => !isCreating && onClose()}
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px] cursor-default"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#121217] p-6 shadow-2xl">
        <h4 className="text-white text-xl font-semibold text-center">
          Choose Time Control
        </h4>
        <p className="text-white/60 text-sm text-center mt-2">
          Create room for friends
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <div className="text-white/70 text-sm mb-2">Time per player (minutes)</div>
            <div className="grid grid-cols-4 gap-2">
              {MINUTES_FOR_PLAYER.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onChangeTimeMinutes(value)}
                disabled={isCreating}
                className={`h-11 rounded-lg border transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  timeMinutes === value
                    ? 'bg-[#4F39F6]/20 text-white border-[#555ab9]/70'
                    : 'bg-white/5 text-white/90 border-white/15 hover:border-white/35'
                }`}
              >
                <span className="font-semibold">{value}</span>
              </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-white/70 text-sm mb-2">Increment per move (seconds)</div>
            <div className="grid grid-cols-4 gap-2">
              {SECONDS_FOR_MOVE.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onChangeIncrementSeconds(value)}
                  disabled={isCreating}
                  className={`h-11 rounded-lg border transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    incrementSeconds === value
                      ? 'bg-[#4F39F6]/20 text-white border-[#555ab9]/70'
                      : 'bg-white/5 text-white/90 border-white/15 hover:border-white/35'
                  }`}
                >
                  <span className="font-semibold">+{value}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="text-center text-white/70 text-sm">
            Selected: {timeMinutes} min + {incrementSeconds} sec
          </div>

          <label className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={withAIhints}
              onChange={(event) => onChangeWithAIhints(event.target.checked)}
              disabled={isCreating}
              className="h-4 w-4 accent-[#555ab9] cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-white font-medium leading-tight">
                Enable{' '}
                <span className="font-extrabold bg-gradient-to-r from-[#E810A7] to-[#FFE600] bg-clip-text text-transparent">
                  AI hints
                </span>
              </span>
              <span className="text-white/60 text-xs leading-tight">Allow hint button in this room</span>
            </div>
          </label>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className="rounded-xl px-4 py-3 bg-white/10 border border-white/15 text-white font-semibold hover:bg-white/15 transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isCreating}
            className="rounded-xl px-4 py-3 bg-[#4F39F6] text-white font-semibold hover:bg-[#4F39F6] transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};
