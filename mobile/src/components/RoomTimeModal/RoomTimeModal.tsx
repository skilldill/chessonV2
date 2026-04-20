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

const MINUTES_FOR_PLAYER = [1, 2, 3, 5, 10, 15, 30, 60];
const SECONDS_FOR_MOVE = [0, 1, 2, 3, 4, 5, 10, 15]; //, 20, 30, 40, 50, 60, 100];

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
      <div
        className="relative w-full max-w-[390px] border border-white/15 bg-[#121217] shadow-2xl"
        style={{ borderRadius: 28, padding: 32 }}
      >
        <h4 className="text-white text-xl font-semibold text-center">
          Choose Time Control
        </h4>
        <p className="text-white/60 text-sm text-center mt-2">
          Create room for friends
        </p>

        <div className="mt-8 space-y-5">
          <div>
            <div className="text-white/70 text-sm mb-2">Time per player (minutes)</div>
            <div className="grid grid-cols-4 gap-2">
              {MINUTES_FOR_PLAYER.map((value) => (
              <div
                key={value}
                onClick={() => onChangeTimeMinutes(value)}
                className={`flex items-center justify-center btn-client h-11 rounded-lg border transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed ${
                  timeMinutes === value
                    ? 'bg-[#4F39F6]/22 text-white border-[#555ab9]/70 shadow-[0_0_0_1px_rgba(45,122,79,0.35)_inset]'
                    : 'btn-client-preset text-white/90 border-white/15'
                }`}
              >
                <span className="font-semibold">{value}</span>
              </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-white/70 text-sm mb-2">Increment per move (seconds)</div>
            <div className="grid grid-cols-4 gap-2">
              {SECONDS_FOR_MOVE.map((value) => (
                <div
                  key={value}
                  onClick={() => onChangeIncrementSeconds(value)}
                  className={`flex items-center justify-center btn-client h-11 rounded-lg border transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed ${
                    incrementSeconds === value
                      ? 'bg-[#4F39F6]/22 text-white border-[#555ab9]/70 shadow-[0_0_0_1px_rgba(45,122,79,0.35)_inset]'
                      : 'btn-client-preset text-white/90 border-white/15'
                  }`}
                >
                  <span className="font-semibold">+{value}</span>
                </div>
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

        <div className="mt-8 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className="btn-client btn-client-preset text-white font-semibold text-[18px] transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderRadius: 20, minHeight: 66, padding: '14px 20px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isCreating}
            className="btn-client bg-[#4F39F6] text-white font-semibold text-[18px] hover:bg-[#4F39F6] transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderRadius: 20, minHeight: 66, padding: '14px 20px' }}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};
