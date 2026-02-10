import { useEffect } from "react";
import { API_PREFIX } from "../constants/api";
import { setChessboardThemeToStorage } from "../utils/appearanceStorage";

/**
 * Загружает данные пользователя при заходе в приложение и сохраняет тему доски в localStorage.
 * Должен вызываться в App при монтировании.
 */
export const useUserAppearancePreload = () => {
  useEffect(() => {
    const loadAndSaveAppearance = async () => {
      try {
        const response = await fetch(`${API_PREFIX}/auth/me`, {
          credentials: "include",
        });
        const data = await response.json();
        if (data.success && data.user?.appearance?.chessboardTheme) {
          setChessboardThemeToStorage(data.user.appearance.chessboardTheme);
        }
      } catch {
        // Не авторизован — оставляем сохранённую тему или default
      }
    };

    loadAndSaveAppearance();
  }, []);
};
