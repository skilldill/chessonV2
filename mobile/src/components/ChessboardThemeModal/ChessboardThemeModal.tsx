import { ReactNode } from "react";

type ChessboardThemeModalProps = {
  isOpen: boolean;
  selectedTheme: string;
  availableThemes: string[];
  onSelectTheme: (theme: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

const THEME_LABELS: Record<string, ReactNode> = {
  default: 'Default',
  magic: <span>Magic <span className="font-extrabold bg-gradient-to-r from-[#10D6E8] to-[#D079DF] bg-clip-text text-transparent">
    New theme
  </span></span>,
};

export const ChessboardThemeModal = ({
  isOpen,
  selectedTheme,
  availableThemes,
  onSelectTheme,
  onClose,
  onConfirm,
}: ChessboardThemeModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px] cursor-default"
      />
      <div
        className="relative w-full max-w-[390px] border border-white/15 bg-[#121217] shadow-2xl"
        style={{ borderRadius: 28, padding: 32 }}
      >
        <h4 className="text-white text-xl font-semibold text-center">
          Choose Chessboard Theme
        </h4>
        <p className="text-white/60 text-sm text-center mt-2">
          Theme will apply to your next game
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4">
          {availableThemes.map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => onSelectTheme(theme)}
              className={`btn-client w-full text-left border transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation overflow-hidden ${selectedTheme === theme
                  ? 'bg-[#555ab9]/22 text-white border-[#555ab9]/70 shadow-[0_0_0_1px_rgba(45,122,79,0.35)_inset]'
                  : 'btn-client-preset text-white/90 border-white/15'
                }`}
              style={{ borderRadius: 20, padding: '18px 20px', minHeight: 86 }}
            >
              <div className="font-semibold text-[18px] leading-tight">{THEME_LABELS[theme] ?? theme}</div>
            </button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-client btn-client-preset text-white font-semibold text-[18px] transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation"
            style={{ borderRadius: 20, minHeight: 66, padding: '14px 20px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-client bg-[#555ab9] text-white font-semibold text-[18px] hover:bg-[#555ab9] transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation"
            style={{ borderRadius: 20, minHeight: 66, padding: '14px 20px' }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
