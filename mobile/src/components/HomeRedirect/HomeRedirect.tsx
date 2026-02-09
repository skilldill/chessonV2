import { IonPage, IonContent, IonSpinner } from '@ionic/react';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { API_PREFIX } from '../../constants/api';
import CreateRoomScreen from '../../screens/CreateRoomScreen/CreateRoomScreen';

export const HomeRedirect = () => {
  const history = useHistory();
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_PREFIX}/auth/me`, {
          credentials: "include",
        });

        const data = await response.json();

        if (data.success && data.user) {
          // Пользователь авторизован - редирект на главный экран
          setIsAuthenticated(true);
          history.replace("/main");
        } else {
          // Пользователь не авторизован - показываем CreateRoomScreen
          setIsAuthenticated(false);
        }
      } catch (err) {
        // Ошибка или не авторизован - показываем CreateRoomScreen
        setIsAuthenticated(false);
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, [history]);

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

  // Если пользователь не авторизован, показываем CreateRoomScreen
  if (!isAuthenticated) {
    return <CreateRoomScreen />;
  }

  // Если авторизован, редирект уже произошел, но на всякий случай показываем загрузку
  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="flex justify-center items-center h-full">
          <IonSpinner name="crescent" />
        </div>
      </IonContent>
    </IonPage>
  );
};
