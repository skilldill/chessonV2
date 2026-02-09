import { useEffect, useState } from "react";
import { MemAvatarSelect } from "../../components/MemAvatarSelect/MemAvatarSelect";
import { BackButton } from "../../components/BackButton/BackButton";
import { MEM_AVATARS } from "../../constants/avatars";
import { useProfile } from "../../hooks/useProfile";
import { useUserGames } from "../../hooks/useUserGames";

export const ProfileScreen = () => {
  const {
    name,
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
    loadTotalGames,
    totalGames,
  } = useUserGames();
  const [showAvatarSelect, setShowAvatarSelect] = useState(false);
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(avatarIndex);

  // Загружаем общее количество игр при монтировании компонента
  useEffect(() => {
    loadTotalGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Синхронизируем выбранный аватар с текущим при открытии селектора
  useEffect(() => {
    if (showAvatarSelect) {
      setSelectedAvatarIndex(avatarIndex);
    }
  }, [showAvatarSelect, avatarIndex]);

  if (loading) {
    return (
      <div className="w-full h-[100vh] flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4F39F6] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[100vh] flex justify-center items-center overflow-y-auto px-4 py-8 relative">
      <div className="max-w-[420px] w-full">
        <div className="py-[20px]">
          <BackButton to="/main" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-[6px] p-6 shadow-[0_12px_40px_-24px_rgba(79,57,246,0.6)]">
          <div className="flex items-center gap-4 mb-6">
            <button
              type="button"
              onClick={() => setShowAvatarSelect((prev) => !prev)}
              disabled={saving}
              className="relative rounded-full focus:outline-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 rounded-full bg-[#4F39F6]/20 blur-lg"></div>
              <img
                src={MEM_AVATARS[avatarIndex]}
                alt="Avatar"
                className="relative w-16 h-16 rounded-full border border-white/15"
              />
            </button>
            <div>
              <div className="text-white/50 text-xs uppercase tracking-[0.2em]">
                Профиль
              </div>
              <h3 className="text-white/90 text-2xl font-semibold mt-1">
                {name}
              </h3>
            </div>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-xl border border-white/10 bg-white/4 px-4 py-3">
              <div className="text-white/50 text-xs">Сыграно игр</div>
              <div className="text-white/90 text-xl font-semibold mt-1">
                {totalGames}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/4 px-4 py-3">
              <div className="text-white/50 text-xs">Статус</div>
              <div className="text-white/80 text-sm font-medium mt-1">
                Активен
              </div>
            </div>
          </div>

          {showAvatarSelect && (
            <div className="rounded-xl border border-white/10 bg-white/4 px-4 py-4 mb-6">
              <div className="text-white/70 text-sm mb-4">
                Выберите аватар
              </div>
              <MemAvatarSelect
                initialSelected={selectedAvatarIndex}
                onSelectAvatar={(index) => {
                  setSelectedAvatarIndex(index);
                }}
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowAvatarSelect(false);
                    setSelectedAvatarIndex(avatarIndex);
                  }}
                  className="flex-1 rounded-lg text-sm font-semibold px-4 py-2 bg-white/5 text-white/80 cursor-pointer transition-all duration-200 active:scale-[0.98] focus:outline-none hover:bg-white/8 border border-white/10"
                >
                  Отмена
                </button>
                <button
                  onClick={async () => {
                    if (selectedAvatarIndex === avatarIndex) {
                      setShowAvatarSelect(false);
                      return;
                    }
                    setAvatarIndex(selectedAvatarIndex);
                    await saveProfile(selectedAvatarIndex);
                    setShowAvatarSelect(false);
                  }}
                  disabled={saving || selectedAvatarIndex === avatarIndex}
                  className="flex-1 rounded-lg text-sm font-semibold px-4 py-2 bg-[#4F39F6] text-white cursor-pointer transition-all duration-200 active:scale-[0.98] focus:outline-none hover:bg-[#4332D7] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-3 rounded-lg text-sm w-full mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/40 text-green-300 px-4 py-3 rounded-lg text-sm w-full mb-4">
              {success}
            </div>
          )}

          {/* Кнопки */}
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={logout}
              className="rounded-lg text-sm font-semibold px-4 py-2 bg-white/5 text-white/80 cursor-pointer transition-all duration-200 active:scale-[0.98] focus:outline-none hover:bg-white/8 border border-white/10 hover:border-red-500/40 hover:text-red-300"
            >
              Выйти из аккаунта
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
