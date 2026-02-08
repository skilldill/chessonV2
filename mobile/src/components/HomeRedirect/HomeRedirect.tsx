import { IonPage, IonContent, IonSpinner } from '@ionic/react';
import { useAuthRedirect } from '../../hooks/useAuthRedirect';
import CreateRoomScreen from '../../screens/CreateRoomScreen/CreateRoomScreen';

export const HomeRedirect = () => {
  const { checking } = useAuthRedirect();

  // Показываем загрузку во время проверки авторизации
  if (checking) {
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

  // Если проверка завершена и пользователь не авторизован, показываем CreateRoomScreen
  // Если авторизован, useAuthRedirect уже сделает редирект на /profile
  return <CreateRoomScreen />;
};
