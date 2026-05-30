import { useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MEM_AVATARS } from "../../constants/avatars";
import { useProfileData } from "../../hooks/useProfileData";

export const AppTopBar = () => {
  const { i18n, t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const { name, avatarIndex, loading } = useProfileData();
  const isEnglish = (i18n.resolvedLanguage || i18n.language || "en").startsWith("en");
  const currentLanguage = isEnglish ? "en" : "ru";
  const currentLanguageLabel = isEnglish ? "EN" : "RU";
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "ru">(currentLanguage);
  const [isShareCopied, setIsShareCopied] = useState(false);
  const isAuthRoute = ["/login", "/signup", "/forgot-password", "/reset-password", "/signup-success", "/verify-email"].some((route) =>
    location.pathname.startsWith(route),
  );
  const isAnalyzeRoute = location.pathname.startsWith("/analyze/") || location.pathname.startsWith("/analize/");

  const handleOpenLanguageModal = () => {
    setSelectedLanguage(currentLanguage);
    setIsLanguageModalOpen(true);
  };

  const handleSaveLanguage = () => {
    void i18n.changeLanguage(selectedLanguage);
    setIsLanguageModalOpen(false);
  };

  const handleShareAnalysis = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsShareCopied(true);
      window.setTimeout(() => setIsShareCopied(false), 1600);
    } catch {
      setIsShareCopied(false);
    }
  };

  return (
    <>
      <div className="border-b border-white/10 bg-black/35 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] w-full max-w-[1120px] items-center justify-between px-6">
          <button
            type="button"
            onClick={() => history.push("/main")}
            className="flex items-center gap-3"
            aria-label="Chesson"
          >
            <img src="/chesson-logo.svg" alt="Chesson" className="h-8 w-auto" />
          </button>

          <div className="flex items-center gap-3">
            {isAnalyzeRoute && (
              <button
                type="button"
                onClick={handleShareAnalysis}
                className="hidden h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08] active:scale-[0.98] sm:flex"
              >
                <LinkIcon />
                {isShareCopied ? t("analysis.shareCopied") : t("analysis.shareGame")}
              </button>
            )}

            {!loading && name ? (
              <button
                type="button"
                onClick={() => history.push("/profile")}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08] active:scale-[0.98]"
              >
                <img src={MEM_AVATARS[avatarIndex]} alt="" className="h-7 w-7 rounded-full" />
                <span className="hidden sm:inline">@{name}</span>
              </button>
            ) : !isAuthRoute ? (
              <Link
                to="/login"
                className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08] active:scale-[0.98]"
              >
                {t("room.signIn")}
              </Link>
            ) : null}

            <button
              type="button"
              onClick={handleOpenLanguageModal}
              className="h-10 rounded-lg border border-white/15 bg-white/[0.04] px-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]"
              aria-label={t("language.chooseTitle")}
            >
              {currentLanguageLabel}
            </button>
          </div>
        </div>
      </div>

      {isLanguageModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={() => setIsLanguageModalOpen(false)}
            className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-[2px]"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#121217] p-6 shadow-2xl">
            <h4 className="text-center text-xl font-semibold text-white">{t("language.chooseTitle")}</h4>
            <p className="mt-2 text-center text-sm text-white/60">{t("language.applySubtitle")}</p>

            <div className="mt-5 grid grid-cols-1 gap-2">
              {(["en", "ru"] as const).map((language) => (
                <button
                  key={language}
                  type="button"
                  onClick={() => setSelectedLanguage(language)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition-all duration-200 active:scale-[0.98] focus:outline-none ${
                    selectedLanguage === language
                      ? "border-[#555ab9]/70 bg-[#4F39F6]/20 text-white"
                      : "border-white/15 bg-white/5 text-white/90 hover:border-white/35"
                  }`}
                >
                  {language === "en" ? t("language.english") : t("language.russian")}
                </button>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsLanguageModalOpen(false)}
                className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 font-semibold text-white transition-all duration-200 hover:bg-white/15 active:scale-[0.98] focus:outline-none"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleSaveLanguage}
                className="rounded-xl bg-[#4F39F6] px-4 py-3 font-semibold text-white transition-all duration-200 hover:bg-[#4F39F6] active:scale-[0.98] focus:outline-none"
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

function LinkIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 13.5L14 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9.3 7.7L10.8 6.2C12.5 4.5 15.3 4.5 17 6.2C18.7 7.9 18.7 10.7 17 12.4L15.5 13.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14.7 16.3L13.2 17.8C11.5 19.5 8.7 19.5 7 17.8C5.3 16.1 5.3 13.3 7 11.6L8.5 10.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
