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
      <IonContent className="ion-padding">
        <div className="flex flex-col items-center h-full px-4">
          <IonText>
            <h1 className="text-3xl font-bold text-white mb-6 text-center">Профиль</h1>
          </IonText>

          <div className="w-full max-w-md space-y-6">
            {/* Аватар */}
            <div className="flex flex-col items-center">
              <div className="mb-4">
                <img
                  src={MEM_AVATARS[avatarIndex]}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full border-4 border-indigo-500"
                />
              </div>
              <MemAvatarSelect onSelectAvatar={setAvatarIndex} />
            </div>

            {/* Статистика */}
            <div className="w-full flex justify-center">
              <div className="bg-white/5 border border-white/10 rounded-lg px-6 py-3 w-full max-w-xs">
                <div className="text-white/60 text-sm text-center mb-1">Сыграно игр</div>
                <div className="text-white text-2xl font-bold text-center">{totalGames}</div>
              </div>
            </div>

            {/* Имя */}
            <IonItem>
              <IonLabel position="stacked">Имя</IonLabel>
              <IonInput
                type="text"
                value={name}
                onIonInput={(e) => setName(e.detail.value!)}
                maxlength={50}
                placeholder="Введите имя"
              />
            </IonItem>

            {/* Список игр */}
            {!showGames ? (
              <IonButton
                expand="block"
                fill="outline"
                onClick={() => loadGames(10)}
                disabled={loadingGames}
              >
                {loadingGames ? "Загрузка..." : "Показать мои игры"}
              </IonButton>
            ) : (
              <div className="w-full flex flex-col gap-2">
                <IonText>
                  <h2 className="text-white text-sm font-semibold mb-2">Мои игры</h2>
                </IonText>
                {loadingGames ? (
                  <div className="flex justify-center py-4">
                    <IonSpinner name="crescent" />
                  </div>
                ) : games.length === 0 ? (
                  <div className="text-white/50 text-sm text-center py-4">
                    У вас пока нет завершенных игр
                  </div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {games.map((game) => (
                      <div
                        key={game.id}
                        className="bg-white/5 border border-white/10 rounded-md p-3 hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => history.push(`/game/${game.roomId}`)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={MEM_AVATARS[parseInt(game.opponent.avatar || "0")]}
                              alt={game.opponent.userName}
                              className="w-8 h-8 rounded-full"
                            />
                            <span className="text-white text-sm">{game.opponent.userName}</span>
                          </div>
                          <span className={`text-xs font-semibold ${getResultColor(game.result)}`}>
                            {getResultText(game.result)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-white/60">
                          <span>{game.userColor === 'white' ? 'Белые' : 'Черные'}</span>
                          <span>{game.moveCount} ходов</span>
                          <span>{formatDate(game.endedAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <IonButton
                  expand="block"
                  fill="clear"
                  onClick={() => setShowGames(false)}
                  className="mt-2"
                >
                  Скрыть игры
                </IonButton>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {/* Кнопки */}
            <div className="space-y-3">
              <IonButton
                expand="block"
                onClick={saveProfile}
                disabled={saving}
              >
                {saving ? "Сохранение..." : "Сохранить"}
              </IonButton>

              <IonButton
                expand="block"
                fill="outline"
                onClick={() => history.push("/")}
              >
                Отмена
              </IonButton>

              <IonButton
                expand="block"
                color="danger"
                onClick={logout}
              >
                Выйти
              </IonButton>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ProfileScreen;
