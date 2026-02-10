import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { API_PREFIX } from '../constants/api';
import { setChessboardThemeToStorage } from '../utils/appearanceStorage';

export const useProfile = () => {
  const history = useHistory();
  const [name, setName] = useState("");
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [chessboardTheme, setChessboardTheme] = useState("default");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
          const theme = data.user.appearance?.chessboardTheme || "default";
          setChessboardTheme(theme);
          setChessboardThemeToStorage(theme);
        } else {
          history.push("/login");
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        history.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [history]);

  const saveProfile = async (newAvatar?: number) => {
    setError("");
    setSuccess("");
    setSaving(true);
    const avatarToSave = newAvatar !== undefined ? newAvatar : avatarIndex;

    try {
      const response = await fetch(`${API_PREFIX}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          avatar: avatarToSave.toString(),
          appearance: { chessboardTheme },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Профиль успешно обновлен!");
        setTimeout(() => {
          history.push("/main");
        }, 1500);
      } else {
        setError(data.error || "Ошибка при сохранении профиля");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Произошла ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  const saveAppearance = async (newChessboardTheme: string) => {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch(`${API_PREFIX}/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          avatar: avatarIndex.toString(),
          appearance: { chessboardTheme: newChessboardTheme },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setChessboardTheme(newChessboardTheme);
        setChessboardThemeToStorage(newChessboardTheme);
        setSuccess("Настройки сохранены!");
      } else {
        setError(data.error || "Ошибка при сохранении");
      }
    } catch (err) {
      console.error("Error saving appearance:", err);
      setError("Произошла ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_PREFIX}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      history.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return {
    name,
    setName,
    avatarIndex,
    setAvatarIndex,
    chessboardTheme,
    setChessboardTheme,
    loading,
    saving,
    error,
    success,
    saveProfile,
    saveAppearance,
    logout,
  };
};
