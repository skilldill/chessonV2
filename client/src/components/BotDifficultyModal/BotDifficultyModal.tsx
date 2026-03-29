export type BotDifficulty = 'super_easy' | 'easy' | 'medium' | 'hard';

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
  { key: 'super_easy', label: 'Super Easy', subtitle: 'Very simple play (~900-1200 Elo)' },
  { key: 'easy', label: 'Easy', subtitle: 'Makes more inaccuracies (~1200-1600 Elo)' },
  { key: 'medium', label: 'Medium', subtitle: 'Balanced play style (~1700-2200 Elo)' },
  { key: 'hard', label: 'Hard', subtitle: 'Plays significantly stronger (~2300+ Elo)' },
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
                  ? 'bg-[#555ab9]/20 text-white border-[#555ab9]/70'
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
            className="rounded-xl px-4 py-3 bg-[#555ab9] text-white font-semibold hover:bg-[#555ab9] transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Play'}
          </button>
        </div>
      </div>
    </div>
  );
};
