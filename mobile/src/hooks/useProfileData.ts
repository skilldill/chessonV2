import { useState, useEffect } from 'react';
import { API_PREFIX } from '../constants/api';
import { setChessboardThemeToStorage } from '../utils/appearanceStorage';

export const useProfileData = () => {
  const [name, setName] = useState("");
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch(`${API_PREFIX}/auth/me`, {
          credentials: "include",
        });

        const data = await response.json();

        if (data.success && data.user) {
          setName(data.user.name || data.user.login);
          setAvatarIndex(parseInt(data.user.avatar || "0"));
          const theme = data.user.appearance?.chessboardTheme;
          if (theme) setChessboardThemeToStorage(theme);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  return {
    name,
    avatarIndex,
    loading,
  };
};
