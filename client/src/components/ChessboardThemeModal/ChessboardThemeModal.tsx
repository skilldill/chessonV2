import type { ReactNode } from "react";

type ChessboardThemeModalProps = {
  isOpen: boolean;
  isSaving: boolean;
  selectedTheme: string;
  availableThemes: string[];
  onSelectTheme: (theme: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  error?: string;
};

const THEME_LABELS: Record<string, ReactNode> = {
  default: "Default",
  magic: <span>Magic <span className="font-extrabold bg-gradient-to-r from-[#10D6E8] to-[#D079DF] bg-clip-text text-transparent">
    New theme
  </span></span>,
  dagestan: <span>Legend's of Dagestan <span className="font-extrabold bg-gradient-to-r from-[#10D6E8] to-[#D079DF] bg-clip-text text-transparent">
    New theme
  </span></span>,
};

export const ChessboardThemeModal = ({
  isOpen,
  isSaving,
  selectedTheme,
  availableThemes,
  onSelectTheme,
  onClose,
  onConfirm,
  error,
}: ChessboardThemeModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close modal"
        onClick={() => !isSaving && onClose()}
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px] cursor-default"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#121217] p-6 shadow-2xl">
        <h4 className="text-white text-xl font-semibold text-center">
          Choose Chessboard Theme
        </h4>
        <p className="text-white/60 text-sm text-center mt-2">
          Theme will apply to your next game
        </p>

        <div className="mt-5 grid grid-cols-1 gap-2">
          {availableThemes.map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => onSelectTheme(theme)}
              disabled={isSaving}
              className={`w-full rounded-xl px-4 py-3 text-left border transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${selectedTheme === theme
                  ? "bg-[#555ab9]/20 text-white border-[#555ab9]/70"
                  : "bg-white/5 text-white/90 border-white/15 hover:border-white/35"
                }`}
            >
              <div className="font-semibold">{THEME_LABELS[theme] ?? theme}</div>
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl px-4 py-3 bg-white/10 border border-white/15 text-white font-semibold hover:bg-white/15 transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="rounded-xl px-4 py-3 bg-[#555ab9] text-white font-semibold hover:bg-[#555ab9] transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};
