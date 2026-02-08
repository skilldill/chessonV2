import { IonPage, IonContent, IonInput, IonButton, IonText, IonItem, IonLabel, IonSpinner } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useEffect } from 'react';
import { MemAvatarSelect } from '../../components/MemAvatarSelect/MemAvatarSelect';
import { MEM_AVATARS } from '../../constants/avatars';
import { useProfile } from '../../hooks/useProfile';
import { useUserGames } from '../../hooks/useUserGames';

const ProfileScreen: React.FC = () => {
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
      <IonPage>
        <IonContent className="ion-padding">
          <div className="flex justify-center items-center h-full">
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent className="ion-padding" style={{ '--background': '#0a0a0f' } as any}>
        <div className="flex flex-col items-center min-h-full px-4 py-6">
          {/* Заголовок */}
          <div className="w-full mb-6">
            <IonText>
              <h1 className="text-3xl font-bold text-white text-center mb-2">Профиль</h1>
            </IonText>
          </div>

          <div className="w-full max-w-md space-y-5">
            {/* Аватар с градиентным фоном */}
            <div className="flex flex-col items-center relative">
              <div className="relative mb-4">
                {/* Градиентный круг за аватаром */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/30 via-purple-500/30 to-pink-500/30 blur-xl scale-110"></div>
                <img
                  src={MEM_AVATARS[avatarIndex]}
                  alt="Avatar"
                  className="relative w-28 h-28 rounded-full shadow-lg shadow-indigo-500/20"
                />
              </div>
            </div>

            {/* Имя пользователя */}
            <div className="text-center mb-4">
              <h2 className="text-2xl font-semibold text-white">{name}</h2>
            </div>

            {/* Статистика - улучшенная карточка */}
            <div className="w-full flex justify-center mb-4">
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-xl px-8 py-4 w-full shadow-lg shadow-indigo-500/10">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5"></div>
                <div className="relative">
                  <div className="text-white/70 text-xs text-center mb-2 uppercase tracking-wider">Сыграно игр</div>
                  <div className="text-white text-3xl font-bold text-center bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    {totalGames}
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl backdrop-blur-sm shadow-lg shadow-red-500/10">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-500/50 text-green-300 px-4 py-3 rounded-xl backdrop-blur-sm shadow-lg shadow-green-500/10">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {success}
                </div>
              </div>
            )}

            {/* Кнопки */}
            <div className="space-y-3 pt-2">
              <IonButton
                expand="block"
                fill="clear"
                onClick={logout}
                className="--color: rgba(239, 68, 68, 0.9); --background: rgba(239, 68, 68, 0.1); --background-activated: rgba(239, 68, 68, 0.2); height: 44px;"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Выйти
                </div>
              </IonButton>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ProfileScreen;
