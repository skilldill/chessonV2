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
      <div
        className="relative w-full max-w-[390px] border border-white/15 bg-[#121217] shadow-2xl"
        style={{ borderRadius: 28, padding: 32 }}
      >
        <h4 className="text-white text-xl font-semibold text-center">
          Choose Bot Difficulty
        </h4>
        <p className="text-white/60 text-sm text-center mt-2">
          Time control: 30 minutes
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4">
          {BOT_LEVELS.map((level) => (
            <button
              key={level.key}
              type="button"
              onClick={() => onChangeDifficulty(level.key)}
              disabled={isCreating}
              className={`btn-client w-full text-left border transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden ${
                difficulty === level.key
                  ? 'bg-[#2D7A4F]/22 text-white border-[#2D7A4F]/70 shadow-[0_0_0_1px_rgba(45,122,79,0.35)_inset]'
                  : 'btn-client-preset text-white/90 border-white/15'
              }`}
              style={{ borderRadius: 20, padding: '18px 20px', minHeight: 86 }}
            >
              <div className="font-semibold text-[18px] leading-tight">{level.label}</div>
              <div className="text-sm text-white/60 mt-1 leading-tight">{level.subtitle}</div>
            </button>
          ))}
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
            {isCreating ? 'Creating...' : 'Play'}
          </button>
        </div>
      </div>
    </div>
  );
};
