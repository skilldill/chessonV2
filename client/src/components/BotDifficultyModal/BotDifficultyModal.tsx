export type BotDifficulty = 'easy' | 'medium' | 'hard';

type BotDifficultyModalProps = {
  isOpen: boolean;
  isCreating: boolean;
  difficulty: BotDifficulty;
  onChangeDifficulty: (value: BotDifficulty) => void;
  onClose: () => void;
  onConfirm: () => void;
};

const BOT_LEVELS: Array<{
  key: BotDifficulty;
  label: string;
  subtitle: string;
}> = [
  { key: 'easy', label: 'Easy', subtitle: 'Makes more inaccuracies' },
  { key: 'medium', label: 'Medium', subtitle: 'Balanced play style' },
  { key: 'hard', label: 'Hard', subtitle: 'Plays significantly stronger' },
];

export const BotDifficultyModal = ({
  isOpen,
  isCreating,
  difficulty,
  onChangeDifficulty,
  onClose,
  onConfirm,
}: BotDifficultyModalProps) => {
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
          Choose Bot Difficulty
        </h4>
        <p className="text-white/60 text-sm text-center mt-2">
          Time control: 30 minutes
        </p>

        <div className="mt-5 grid grid-cols-1 gap-2">
          {BOT_LEVELS.map((level) => (
            <button
              key={level.key}
              type="button"
              onClick={() => onChangeDifficulty(level.key)}
              disabled={isCreating}
              className={`w-full rounded-xl px-4 py-3 text-left border transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                difficulty === level.key
                  ? 'bg-[#2D7A4F]/20 text-white border-[#2D7A4F]/70'
                  : 'bg-white/5 text-white/90 border-white/15 hover:border-white/35'
              }`}
            >
              <div className="font-semibold">{level.label}</div>
              <div className="text-xs text-white/60 mt-0.5">{level.subtitle}</div>
            </button>
          ))}
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
            {isCreating ? 'Creating...' : 'Play'}
          </button>
        </div>
      </div>
    </div>
  );
};
