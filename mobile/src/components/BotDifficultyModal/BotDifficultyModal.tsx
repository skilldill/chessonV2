import { useTranslation } from "react-i18next";

export type BotDifficulty = 'super_easy' | 'easy' | 'medium' | 'hard';

type BotDifficultyModalProps = {
  isOpen: boolean;
  isCreating: boolean;
  difficulty: BotDifficulty;
  onChangeDifficulty: (value: BotDifficulty) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export const BotDifficultyModal = ({
  isOpen,
  isCreating,
  difficulty,
  onChangeDifficulty,
  onClose,
  onConfirm,
}: BotDifficultyModalProps) => {
  const { t } = useTranslation();
  const levels = [
    { key: 'super_easy' as const, label: t("bot.super_easy.label"), subtitle: t("bot.super_easy.subtitle") },
    { key: 'easy' as const, label: t("bot.easy.label"), subtitle: t("bot.easy.subtitle") },
    { key: 'medium' as const, label: t("bot.medium.label"), subtitle: t("bot.medium.subtitle") },
    { key: 'hard' as const, label: t("bot.hard.label"), subtitle: t("bot.hard.subtitle") },
  ];
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label={t("common.close")}
        onClick={() => !isCreating && onClose()}
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px] cursor-default"
      />
      <div
        className="relative w-full max-w-[390px] border border-white/15 bg-[#121217] shadow-2xl"
        style={{ borderRadius: 28, padding: 32 }}
      >
        <h4 className="text-white text-xl font-semibold text-center">
          {t("bot.title")}
        </h4>
        <p className="text-white/60 text-sm text-center mt-2">
          {t("bot.timeControlStatic")}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4">
          {levels.map((level) => (
            <button
              key={level.key}
              type="button"
              onClick={() => onChangeDifficulty(level.key)}
              disabled={isCreating}
              className={`btn-client w-full text-left border transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden ${
                difficulty === level.key
                  ? 'bg-[#4F39F6]/22 text-white border-[#555ab9]/70 shadow-[0_0_0_1px_rgba(45,122,79,0.35)_inset]'
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
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isCreating}
            className="btn-client bg-[#4F39F6] text-white font-semibold text-[18px] hover:bg-[#4F39F6] transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderRadius: 20, minHeight: 66, padding: '14px 20px' }}
          >
            {isCreating ? t("common.creating") : t("common.play")}
          </button>
        </div>
      </div>
    </div>
  );
};
