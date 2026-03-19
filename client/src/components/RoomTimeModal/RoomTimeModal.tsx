export type RoomTimeControl = {
  timeMinutes: number;
  incrementSeconds: number;
  label: string;
  subtitle: string;
};

type RoomTimeModalProps = {
  isOpen: boolean;
  isCreating: boolean;
  controls: RoomTimeControl[];
  selectedKey: string;
  onSelect: (key: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export const RoomTimeModal = ({
  isOpen,
  isCreating,
  controls,
  selectedKey,
  onSelect,
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

        <div className="mt-5 grid grid-cols-1 gap-2">
          {controls.map((control) => {
            const key = `${control.timeMinutes}:${control.incrementSeconds}`;
            const isSelected = selectedKey === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(key)}
                disabled={isCreating}
                className={`w-full rounded-xl px-4 py-3 text-left border transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSelected
                    ? 'bg-[#2D7A4F]/20 text-white border-[#2D7A4F]/70'
                    : 'bg-white/5 text-white/90 border-white/15 hover:border-white/35'
                }`}
              >
                <div className="font-semibold">{control.label}</div>
                <div className="text-xs text-white/60 mt-0.5">{control.subtitle}</div>
              </button>
            );
          })}
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
            className="rounded-xl px-4 py-3 bg-[#2D7A4F] text-white font-semibold hover:bg-[#266944] transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};
