import { IonPage, IonContent, IonButton, IonText } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useProfileData } from '../../hooks/useProfileData';
import { MEM_AVATARS } from '../../constants/avatars';
import { useCreateRoom } from '../../hooks/useCreateRoom';

const HomeScreen: React.FC = () => {
  const history = useHistory();
  const { name, avatarIndex, loading } = useProfileData();
  const { createRoom } = useCreateRoom();

  const handleCreateRoom = (timeMinutes: number, incrementSeconds: number) => {
    createRoom({
      timeMinutes,
      incrementSeconds,
    });
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="flex justify-center items-center h-full">
            {/* <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div> */}
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent className="ion-padding" style={{ '--background': '#0a0a0f' } as any}>
        <div className="flex flex-col items-center min-h-full px-4 py-6">
          {/* Профиль - кликабельный */}
          <div 
            className="w-full flex items-center justify-between mb-8 px-2"
            onClick={() => history.push('/profile')}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/30 via-purple-500/30 to-pink-500/30 blur-xl scale-110"></div>
                <img
                  src={MEM_AVATARS[avatarIndex]}
                  alt="Avatar"
                  className="relative w-16 h-16 rounded-full border-2 border-indigo-500/50 shadow-lg shadow-indigo-500/20"
                />
              </div>
              <div>
                <h2 className="text-white text-lg font-semibold">{name}</h2>
                <p className="text-white/60 text-sm">Нажмите для профиля</p>
              </div>
            </div>
            <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Заголовок */}
          <div className="w-full mb-8 text-center">
            <IonText>
              <h1 className="text-3xl font-bold text-white mb-2">Создать комнату</h1>
              <p className="text-white/60 text-sm">Выберите настройки времени</p>
            </IonText>
          </div>

          {/* Быстрые кнопки создания комнаты */}
          <div className="w-full max-w-md space-y-3 mb-6">
            <IonButton
              expand="block"
              onClick={() => handleCreateRoom(5, 0)}
              className="--background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); --background-activated: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); --color: white; font-weight: 600; height: 56px;"
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg font-bold">Блиц</span>
                <span className="text-xs opacity-80">5 минут</span>
              </div>
            </IonButton>

            <IonButton
              expand="block"
              onClick={() => handleCreateRoom(10, 0)}
              className="--background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); --background-activated: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); --color: white; font-weight: 600; height: 56px;"
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg font-bold">Рапид</span>
                <span className="text-xs opacity-80">10 минут</span>
              </div>
            </IonButton>

            <IonButton
              expand="block"
              onClick={() => handleCreateRoom(15, 10)}
              className="--background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); --background-activated: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); --color: white; font-weight: 600; height: 56px;"
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg font-bold">Стандарт</span>
                <span className="text-xs opacity-80">15 минут + 10 сек</span>
              </div>
            </IonButton>

            <IonButton
              expand="block"
              onClick={() => history.push('/create-room')}
              fill="outline"
              className="--border-color: rgba(99, 102, 241, 0.5); --color: white; --background: rgba(99, 102, 241, 0.1); height: 48px;"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Настроить время
              </div>
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default HomeScreen;
