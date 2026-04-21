import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LANGUAGE, resources, SUPPORTED_LANGUAGES, type AppLanguage } from "./resources";

const STORAGE_KEY = "chesson-mobile-language-v1";

const isSupportedLanguage = (value: string | null | undefined): value is AppLanguage => {
  return value != null && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
};

const getInitialLanguage = (): AppLanguage => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (isSupportedLanguage(stored)) {
    return stored;
  }

  const browserLanguage = navigator.language?.split("-")[0];
  if (isSupportedLanguage(browserLanguage)) {
    return browserLanguage;
  }

  return DEFAULT_LANGUAGE;
};

void i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (language) => {
  if (!isSupportedLanguage(language)) {
    return;
  }

  localStorage.setItem(STORAGE_KEY, language);
  document.documentElement.lang = language;
});

document.documentElement.lang = i18n.language;

export const setAppLanguage = async (language: AppLanguage): Promise<void> => {
  if (language === i18n.language) {
    return;
  }

  await i18n.changeLanguage(language);
};

export const getAppLanguage = (): AppLanguage => {
  if (isSupportedLanguage(i18n.language)) {
    return i18n.language;
  }

  return DEFAULT_LANGUAGE;
};

export type { AppLanguage };
export default i18n;

