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

        <div className="mt-8 grid grid-cols-1 gap-4">
          {controls.map((control) => {
            const key = `${control.timeMinutes}:${control.incrementSeconds}`;
            const isSelected = selectedKey === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(key)}
                disabled={isCreating}
                className={`btn-client w-full text-left border transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden ${
                  isSelected
                    ? 'bg-[#2D7A4F]/22 text-white border-[#2D7A4F]/70 shadow-[0_0_0_1px_rgba(45,122,79,0.35)_inset]'
                    : 'btn-client-preset text-white/90 border-white/15'
                }`}
                style={{ borderRadius: 20, padding: '18px 20px', minHeight: 86 }}
              >
                <div className="font-semibold text-[18px] leading-tight">{control.label}</div>
                <div className="text-sm text-white/60 mt-1 leading-tight">{control.subtitle}</div>
              </button>
            );
          })}
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
            className="btn-client bg-[#2D7A4F] text-white font-semibold text-[18px] hover:bg-[#266944] transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderRadius: 20, minHeight: 66, padding: '14px 20px' }}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};
