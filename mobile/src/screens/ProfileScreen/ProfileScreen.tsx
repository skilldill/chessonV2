import { IonPage, IonContent, IonButton } from '@ionic/react';
import { useEffect, useState } from 'react';
import { MemAvatarSelect } from '../../components/MemAvatarSelect/MemAvatarSelect';
import { BackButton } from '../../components/BackButton/BackButton';
import { MEM_AVATARS } from '../../constants/avatars';
import { useProfile } from '../../hooks/useProfile';
import { useUserGames } from '../../hooks/useUserGames';
import { CHESSBOARD_THEMES } from '../../components/ChessBoardConfigs/ChessBoardConfigs';

const ProfileScreen: React.FC = () => {
  const {
    name,
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
  } = useProfile();

  const { loadTotalGames, totalGames } = useUserGames();
  const [showAvatarSelect, setShowAvatarSelect] = useState(false);
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(avatarIndex);

  useEffect(() => {
    loadTotalGames();
  }, [loadTotalGames]);

  useEffect(() => {
    if (showAvatarSelect) {
      setSelectedAvatarIndex(avatarIndex);
    }
  }, [showAvatarSelect, avatarIndex]);

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding" style={{ '--background': 'linear-gradient(150deg, #282828 0%, #000 50%, #2b1565 100%)' } as React.CSSProperties}>
          <div className="flex justify-center items-center min-h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4F39F6] border-t-transparent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent
        className="ion-padding"
        style={{ '--background': 'linear-gradient(150deg, #282828 0%, #000 50%, #2b1565 100%)' } as React.CSSProperties}
      >
        <div className="w-full min-h-full flex justify-center overflow-y-auto px-4 py-6">
          <div className="max-w-[420px] w-full">
            <div className="py-2 -ml-1">
              <BackButton to="/main" />
            </div>

            {/* Client-style card */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-[6px] p-6 shadow-[0_12px_40px_-24px_rgba(79,57,246,0.6)]">
              <div className="flex items-center gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setShowAvatarSelect((prev) => !prev)}
                  disabled={saving}
                  className="relative rounded-full focus:outline-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation"
                >
                  <div className="absolute inset-0 rounded-full bg-[#4F39F6]/20 blur-lg" />
                  <img
                    src={MEM_AVATARS[avatarIndex]}
                    alt="Avatar"
                    className="relative w-16 h-16 rounded-full border border-white/15"
                  />
                </button>
                <div>
                  <div className="text-white/50 text-xs uppercase tracking-[0.2em]">
                    Profile
                  </div>
                  <h3 className="text-white/90 text-2xl font-semibold mt-1">
                    {name}
                  </h3>
                </div>
              </div>

              {/* Статистика */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div className="text-white/50 text-xs">Games played</div>
                  <div className="text-white/90 text-xl font-semibold mt-1">
                    {totalGames}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div className="text-white/50 text-xs">Status</div>
                  <div className="text-white/80 text-sm font-medium mt-1">
                    Active
                  </div>
                </div>
              </div>

              {/* Тема доски */}
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 mb-6">
                <div className="text-white/70 text-sm mb-3">Chessboard theme</div>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(CHESSBOARD_THEMES).map((themeKey) => (
                    <IonButton
                      key={themeKey}
                      type="button"
                      fill="clear"
                      onClick={() => {
                        setChessboardTheme(themeKey);
                        saveAppearance(themeKey);
                      }}
                      disabled={saving}
                      className={`rounded-lg  text-sm font-medium transition-all focus:outline-none touch-manipulation disabled:opacity-60 min-h-[44px] ${
                        chessboardTheme === themeKey
                          ? "bg-[#4F39F6]/20 text-white border border-[#4F39F6]/60"
                          : "bg-white/5 text-white/80 border border-white/10"
                      }`}
                    >
                      {themeKey === "default" ? "Default" : themeKey === "green" ? "Green" : themeKey === "brown" ? "Wood" : themeKey === "blue" ? "Blue" : themeKey}
                    </IonButton>
                  ))}
                </div>
              </div>

              {showAvatarSelect && (
                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 mb-6">
                  <div className="text-white/70 text-sm mb-4">
                    Choose avatar
                  </div>
                  <MemAvatarSelect
                    initialSelected={selectedAvatarIndex}
                    onSelectAvatar={(index) => setSelectedAvatarIndex(index)}
                  />
                  <div className="flex gap-3 mt-4">
                    <IonButton
                      type="button"
                      fill="clear"
                      onClick={() => {
                        setShowAvatarSelect(false);
                        setSelectedAvatarIndex(avatarIndex);
                      }}
                      className="flex-1 rounded-lg text-sm font-semibold bg-white/5 text-white/80 cursor-pointer transition-all duration-200 active:scale-[0.98] focus:outline-none border border-white/10 touch-manipulation min-h-[44px]"
                    >
                      Cancel
                    </IonButton>
                    <IonButton
                      type="button"
                      fill="clear"
                      onClick={async () => {
                        if (selectedAvatarIndex === avatarIndex) {
                          setShowAvatarSelect(false);
                          return;
                        }
                        setAvatarIndex(selectedAvatarIndex);
                        await saveProfile(selectedAvatarIndex);
                        setShowAvatarSelect(false);
                      }}
                      className="flex-1 rounded-lg text-sm font-semibold bg-[#4F39F6] text-white cursor-pointer transition-all duration-200 active:scale-[0.98] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
                    >
                      {saving ? "Saving..." : "Save"}
                    </IonButton>
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

              <div className="flex flex-col gap-3 w-full">
                <IonButton
                  type="button"
                  onClick={logout}
                  fill="clear"
                  color="danger"
                  className="flex-1 rounded-lg text-sm font-semibold bg-white/5 text-white/80 cursor-pointer transition-all duration-200 active:scale-[0.98] focus:outline-none border border-white/10 touch-manipulation min-h-[44px]"
                >
                  Sign out
                </IonButton>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ProfileScreen;
