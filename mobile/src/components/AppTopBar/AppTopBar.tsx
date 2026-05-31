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
  const isAuthRoute = ["/login", "/signup", "/forgot-password", "/reset-password", "/signup-success", "/verify-email"].some((route) =>
    location.pathname.startsWith(route),
  );

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
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="h-14 border-b border-white/10 bg-black/25 backdrop-blur-md">
          <div className="mx-auto flex h-full w-full max-w-[432px] items-center justify-between px-4">
            <button
              type="button"
              onClick={() => history.push("/main")}
              className="flex items-center gap-2"
              aria-label="Chesson"
            >
              <img src="/chesson-logo.svg" alt="Chesson" className="h-6 w-auto" />
            </button>

            <div className="flex items-center gap-2">
              {!loading && name ? (
                <button
                  type="button"
                  onClick={() => history.push("/profile")}
                  className="flex h-[34px] items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-2 text-xs font-semibold text-white/85 transition active:scale-[0.98]"
                >
                  <img src={MEM_AVATARS[avatarIndex]} alt="" className="h-6 w-6 rounded-full" />
                  <span className="max-w-[92px] truncate">@{name}</span>
                </button>
              ) : !isAuthRoute ? (
                <Link
                  to="/login"
                  className="flex h-[34px] items-center rounded-lg border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/85 transition active:scale-[0.98]"
                >
                  {t("room.signIn")}
                </Link>
              ) : null}

              <button
                type="button"
                onClick={handleOpenLanguageModal}
                className="h-[34px] min-w-[42px] rounded-lg border border-white/20 bg-white/5 px-2 text-xs font-semibold text-white"
                aria-label={t("language.chooseTitle")}
              >
                {currentLanguageLabel}
              </button>
            </div>
          </div>
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
          <div
            className="relative w-full max-w-[390px] border border-white/15 bg-[#121217] shadow-2xl"
            style={{ borderRadius: 28, padding: 32 }}
          >
            <h4 className="text-white text-xl font-semibold text-center">
              {t("language.chooseTitle")}
            </h4>
            <p className="text-white/60 text-sm text-center mt-2">
              {t("language.applySubtitle")}
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4">
              <button
                type="button"
                onClick={() => setSelectedLanguage("en")}
                className={`btn-client w-full text-left border transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation ${
                  selectedLanguage === "en"
                    ? "bg-[#4F39F6]/22 text-white border-[#555ab9]/70 shadow-[0_0_0_1px_rgba(45,122,79,0.35)_inset]"
                    : "btn-client-preset text-white/90 border-white/15"
                }`}
                style={{ borderRadius: 20, padding: "14px 20px", minHeight: 60 }}
              >
                {t("language.english")}
              </button>
              <button
                type="button"
                onClick={() => setSelectedLanguage("ru")}
                className={`btn-client w-full text-left border transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation ${
                  selectedLanguage === "ru"
                    ? "bg-[#4F39F6]/22 text-white border-[#555ab9]/70 shadow-[0_0_0_1px_rgba(45,122,79,0.35)_inset]"
                    : "btn-client-preset text-white/90 border-white/15"
                }`}
                style={{ borderRadius: 20, padding: "14px 20px", minHeight: 60 }}
              >
                {t("language.russian")}
              </button>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setIsLanguageModalOpen(false)}
                className="btn-client btn-client-preset text-white font-semibold text-[18px] transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation"
                style={{ borderRadius: 20, minHeight: 66, padding: "14px 20px" }}
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleSaveLanguage}
                className="btn-client bg-[#4F39F6] text-white font-semibold text-[18px] transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation"
                style={{ borderRadius: 20, minHeight: 66, padding: "14px 20px" }}
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
