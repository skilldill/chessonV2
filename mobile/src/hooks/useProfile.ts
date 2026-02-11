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
        setSuccess("Profile updated successfully!");
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError(data.error || "Error saving profile");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("An error occurred while saving");
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


        // TODO: подумать нужно ли показывать сохранение доски
        // setSuccess("Settings saved!");
        // setTimeout(() => {
        //   setSuccess('');
        // }, 3000);
      } else {
        setError(data.error || "Error saving");
      }
    } catch (err) {
      console.error("Error saving appearance:", err);
      setError("An error occurred while saving");
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
