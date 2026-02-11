import { useState, useEffect } from "react";
import { API_PREFIX } from "../constants/api";
import { getChessboardThemeFromStorage, setChessboardThemeToStorage } from "../utils/appearanceStorage";

/**
 * Возвращает тему доски: сразу из localStorage (мгновенно), затем обновляет с сервера.
 */
export const useAppearance = () => {
  const [chessboardTheme, setChessboardTheme] = useState(() =>
    getChessboardThemeFromStorage()
  );

  useEffect(() => {
    const loadAppearance = async () => {
      try {
        const response = await fetch(`${API_PREFIX}/auth/me`, {
          credentials: "include",
        });
        const data = await response.json();
        if (data.success && data.user?.appearance?.chessboardTheme) {
          const theme = data.user.appearance.chessboardTheme;
          setChessboardThemeToStorage(theme);
          setChessboardTheme(theme);
        }
      } catch {
        // Не авторизован — используем значение из localStorage
      }
    };

    loadAppearance();
  }, []);

  return { chessboardTheme, setChessboardTheme };
};
