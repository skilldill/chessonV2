import { useTranslation } from "react-i18next";

export type BotDifficulty = 'super_easy' | 'easy' | 'medium' | 'hard';
export type BotPlayerColor = "white" | "black";
export type BotStartPositionMode = "default" | "custom";

type BotDifficultyModalProps = {
  isOpen: boolean;
  isCreating: boolean;
  difficulty: BotDifficulty;
  playerColor: BotPlayerColor;
  startPositionMode: BotStartPositionMode;
  customFEN: string;
  onChangeDifficulty: (value: BotDifficulty) => void;
  onChangePlayerColor: (value: BotPlayerColor) => void;
  onChangeStartPositionMode: (value: BotStartPositionMode) => void;
  onChangeCustomFEN: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export const BotDifficultyModal = ({
  isOpen,
  isCreating,
  difficulty,
  playerColor,
  startPositionMode,
  customFEN,
  onChangeDifficulty,
  onChangePlayerColor,
  onChangeStartPositionMode,
  onChangeCustomFEN,
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
      <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#121217] p-6 shadow-2xl">
        <h4 className="text-white text-xl font-semibold text-center">
          {t("bot.title")}
        </h4>
        <p className="text-white/60 text-sm text-center mt-2">
          {t("bot.timeControlStatic")}
        </p>

        <div className="mt-5 grid grid-cols-1 gap-2">
          {levels.map((level) => (
            <button
              key={level.key}
              type="button"
              onClick={() => onChangeDifficulty(level.key)}
              disabled={isCreating}
              className={`w-full rounded-xl px-4 py-3 text-left border transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                difficulty === level.key
                  ? 'bg-[#4F39F6]/20 text-white border-[#555ab9]/70'
                  : 'bg-white/5 text-white/90 border-white/15 hover:border-white/35'
              }`}
            >
              <div className="font-semibold">{level.label}</div>
              <div className="text-xs text-white/60 mt-0.5">{level.subtitle}</div>
            </button>
          ))}
        </div>

        <div className="mt-5">
          <div className="text-white/70 text-sm mb-2">{t("bot.playAs")}</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChangePlayerColor("white")}
              disabled={isCreating}
              className={`rounded-xl px-4 py-2 text-sm border transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                playerColor === "white"
                  ? 'bg-[#4F39F6]/20 text-white border-[#555ab9]/70'
                  : 'bg-white/5 text-white/90 border-white/15 hover:border-white/35'
              }`}
            >
              {t("bot.color.white")}
            </button>
            <button
              type="button"
              onClick={() => onChangePlayerColor("black")}
              disabled={isCreating}
              className={`rounded-xl px-4 py-2 text-sm border transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                playerColor === "black"
                  ? 'bg-[#4F39F6]/20 text-white border-[#555ab9]/70'
                  : 'bg-white/5 text-white/90 border-white/15 hover:border-white/35'
              }`}
            >
              {t("bot.color.black")}
            </button>
          </div>
        </div>

        <div className="mt-5">
          <div className="text-white/70 text-sm mb-2">{t("bot.startPosition")}</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChangeStartPositionMode("default")}
              disabled={isCreating}
              className={`rounded-xl px-4 py-2 text-sm border transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                startPositionMode === "default"
                  ? 'bg-[#4F39F6]/20 text-white border-[#555ab9]/70'
                  : 'bg-white/5 text-white/90 border-white/15 hover:border-white/35'
              }`}
            >
              {t("bot.position.default")}
            </button>
            <button
              type="button"
              onClick={() => onChangeStartPositionMode("custom")}
              disabled={isCreating}
              className={`rounded-xl px-4 py-2 text-sm border transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                startPositionMode === "custom"
                  ? 'bg-[#4F39F6]/20 text-white border-[#555ab9]/70'
                  : 'bg-white/5 text-white/90 border-white/15 hover:border-white/35'
              }`}
            >
              {t("bot.position.custom")}
            </button>
          </div>

          {startPositionMode === "custom" && (
            <div className="mt-3">
              <label className="block text-white/70 text-xs mb-1.5" htmlFor="bot-custom-fen">
                {t("bot.fenLabel")}
              </label>
              <input
                id="bot-custom-fen"
                type="text"
                value={customFEN}
                onChange={(event) => onChangeCustomFEN(event.target.value)}
                disabled={isCreating}
                placeholder={t("bot.fenPlaceholder")}
                className="w-full rounded-xl px-3 py-2.5 bg-white/5 border border-white/15 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-white/35 disabled:opacity-50"
              />
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className="rounded-xl px-4 py-3 bg-white/10 border border-white/15 text-white font-semibold hover:bg-white/15 transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isCreating}
            className="rounded-xl px-4 py-3 bg-[#4F39F6] text-white font-semibold hover:bg-[#4F39F6] transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? t("common.creating") : t("common.play")}
          </button>
        </div>
      </div>
    </div>
  );
};
