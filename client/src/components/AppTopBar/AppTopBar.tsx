import { useState } from "react";
import { useTranslation } from "react-i18next";

export const AppTopBar = () => {
  const { i18n, t } = useTranslation();
  const isEnglish = (i18n.resolvedLanguage || i18n.language || "en").startsWith("en");
  const currentLanguage = isEnglish ? "en" : "ru";
  const currentLanguageLabel = isEnglish ? "EN" : "RU";
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "ru">(currentLanguage);

  const handleOpenLanguageModal = () => {
    setSelectedLanguage(currentLanguage);
    setIsLanguageModalOpen(true);
  };

  const handleSaveLanguage = () => {
    void i18n.changeLanguage(selectedLanguage);
    setIsLanguageModalOpen(false);
  };

  return (
    <>
      <div className="absolute top-0 left-0 right-0 z-20 border-b border-white/10">
        <div className="m-auto max-w-[400px] h-14 relative flex items-center justify-center bg-black/25 backdrop-blur-md">
          <img src="/chesson-logo.svg" alt="Chesson" className="h-6 w-auto" />
          <button
            type="button"
            onClick={handleOpenLanguageModal}
            className="absolute right-3 h-[28px] min-w-[42px] px-2 rounded-md border border-white/20 bg-white/5 text-white text-[12px] font-semibold hover:bg-white/10 transition-colors"
            aria-label={t("language.chooseTitle")}
          >
            {currentLanguageLabel}
          </button>
        </div>
      </div>

      {isLanguageModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={() => setIsLanguageModalOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px] cursor-default"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#121217] p-6 shadow-2xl">
            <h4 className="text-white text-xl font-semibold text-center">
              {t("language.chooseTitle")}
            </h4>
            <p className="text-white/60 text-sm text-center mt-2">
              {t("language.applySubtitle")}
            </p>

            <div className="mt-5 grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setSelectedLanguage("en")}
                className={`w-full rounded-xl px-4 py-3 text-left border transition-all duration-200 active:scale-[0.98] focus:outline-none ${
                  selectedLanguage === "en"
                    ? "bg-[#4F39F6]/20 text-white border-[#555ab9]/70"
                    : "bg-white/5 text-white/90 border-white/15 hover:border-white/35"
                }`}
              >
                {t("language.english")}
              </button>
              <button
                type="button"
                onClick={() => setSelectedLanguage("ru")}
                className={`w-full rounded-xl px-4 py-3 text-left border transition-all duration-200 active:scale-[0.98] focus:outline-none ${
                  selectedLanguage === "ru"
                    ? "bg-[#4F39F6]/20 text-white border-[#555ab9]/70"
                    : "bg-white/5 text-white/90 border-white/15 hover:border-white/35"
                }`}
              >
                {t("language.russian")}
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsLanguageModalOpen(false)}
                className="rounded-xl px-4 py-3 bg-white/10 border border-white/15 text-white font-semibold hover:bg-white/15 transition-all duration-200 active:scale-[0.98] focus:outline-none"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleSaveLanguage}
                className="rounded-xl px-4 py-3 bg-[#4F39F6] text-white font-semibold hover:bg-[#4F39F6] transition-all duration-200 active:scale-[0.98] focus:outline-none"
              >
                {t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
