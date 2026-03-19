import { useEffect, useMemo, useState } from "react";
import { useProfileData } from "../../hooks/useProfileData";
import { MEM_AVATARS } from "../../constants/avatars";
import { useUserGames } from "../../hooks/useUserGames";
import { CHESSBOARD_THEMES } from "../ChessBoardConfigs/ChessBoardConfigs";
import { ChessboardThemeModal } from "../ChessboardThemeModal/ChessboardThemeModal";
import { API_PREFIX } from "../../constants/api";
import { setChessboardThemeToStorage } from "../../utils/appearanceStorage";
import { useHistory } from "react-router";

export const ProfileCard = () => {
  const history = useHistory();
  const { name, avatarIndex, chessboardTheme, loading } = useProfileData();
  const {
    loadTotalGames,
    totalGames,
  } = useUserGames();
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState("default");
  const [selectedTheme, setSelectedTheme] = useState("default");
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [themeError, setThemeError] = useState("");

  const availableThemes = useMemo(() => Object.keys(CHESSBOARD_THEMES), []);

  useEffect(() => {
    loadTotalGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const nextTheme = chessboardTheme || "default";
    setActiveTheme(nextTheme);
    setSelectedTheme(nextTheme);
  }, [chessboardTheme]);

  const handleSaveTheme = async () => {
    setThemeError("");
    setIsSavingTheme(true);

    try {
      const response = await fetch(`${API_PREFIX}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          avatar: avatarIndex.toString(),
          appearance: { chessboardTheme: selectedTheme },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to save theme");
      }

      setChessboardThemeToStorage(selectedTheme);
      setActiveTheme(selectedTheme);
      setIsThemeModalOpen(false);
    } catch (error) {
      setThemeError(error instanceof Error ? error.message : "Failed to save theme");
    } finally {
      setIsSavingTheme(false);
    }
  };

  const activeThemeLabel = activeTheme === "magic" ? "Magic" : "Default";

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center px-4 py-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#4F39F6] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <h2 className="text-white text-lg font-semibold text-center cursor-pointer" onClick={() => history.push('/profile')}>@{name}</h2>
      <img
        src={MEM_AVATARS[avatarIndex]}
        alt="Avatar"
        className="relative w-[64px] h-[64px] rounded-full"
      />

      <div className="w-full flex gap-3">
        <div className="flex-1 rounded-xl border border-white/10 bg-white/4 px-4 py-3">
          <div className="text-white/50 text-xs">Games played</div>
          <div className="text-white/90 text-xl font-semibold mt-1">
            {totalGames}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedTheme(activeTheme);
            setThemeError("");
            setIsThemeModalOpen(true);
          }}
          className="flex-1 rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-left hover:bg-white/8 transition-all duration-200 active:scale-[0.98]"
        >
          <div className="text-white/50 text-xs">Chessboard theme</div>
          <div className="text-white/80 text-sm font-medium mt-1">
            {activeThemeLabel}
          </div>
        </button>
      </div>

      <ChessboardThemeModal
        isOpen={isThemeModalOpen}
        isSaving={isSavingTheme}
        selectedTheme={selectedTheme}
        availableThemes={availableThemes}
        onSelectTheme={setSelectedTheme}
        onClose={() => setIsThemeModalOpen(false)}
        onConfirm={handleSaveTheme}
        error={themeError}
      />
    </div>
  )
};
