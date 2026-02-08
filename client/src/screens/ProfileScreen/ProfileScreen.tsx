import { useHistory } from "react-router-dom";
import { useEffect } from "react";
import { MemAvatarSelect } from "../../components/MemAvatarSelect/MemAvatarSelect";
import { MEM_AVATARS } from "../../constants/avatars";
import { useProfile } from "../../hooks/useProfile";
import { useUserGames } from "../../hooks/useUserGames";

export const ProfileScreen = () => {
  const history = useHistory();
  
  const {
    name,
    setName,
    avatarIndex,
    setAvatarIndex,
    loading,
    saving,
    error,
    success,
    saveProfile,
    logout,
  } = useProfile();

  const {
    games,
    loading: loadingGames,
    showGames,
    setShowGames,
    loadGames,
    loadTotalGames,
    totalGames,
    formatDate,
    getResultText,
    getResultColor,
  } = useUserGames();

  // Загружаем общее количество игр при монтировании компонента
  useEffect(() => {
    loadTotalGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[100vh] flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4F39F6] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-[100vh] flex justify-center items-center overflow-y-auto py-4">
      <div className="max-w-[375px] w-full h-full flex flex-col items-center">
          <div className="w-full flex flex-col items-center gap-[20px] px-[32px]">
            {/* Аватар */}
            <div className="flex flex-col items-center gap-4">
              <div>
                <img
                  src={MEM_AVATARS[avatarIndex]}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full"
                />
              </div>
            </div>

            <h3 className="text-white text-center text-3xl font-semibold">
              {name}
            </h3>

            {/* Статистика */}
            <div className="w-full flex justify-center">
              <div className="bg-white/5 border border-white/10 rounded-lg px-6 py-3">
                <div className="text-white/60 text-sm text-center mb-1">Сыграно игр</div>
                <div className="text-white text-2xl font-bold text-center">{totalGames}</div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm w-full">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg text-sm w-full">
                {success}
              </div>
            )}

            {/* Кнопки */}
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={logout}
                className="rounded-md text-sm font-semibold px-4 py-2 bg-red-500/20 text-red-300 min-w-[126px] cursor-pointer transition-all duration-300 active:scale-95 focus:outline-none hover:bg-red-500/30 border border-red-500/50"
              >
                Выйти
              </button>
            </div>
          </div>
          </div>
    </div>
  );
};
