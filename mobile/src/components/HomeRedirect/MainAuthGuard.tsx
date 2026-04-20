import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { API_PREFIX } from '../../constants/api';
import HomeScreen from '../../screens/HomeScreen/HomeScreen';

export const MainAuthGuard = () => {
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
          setIsAuthenticated(true);
        } else {
          history.replace('/');
        }
      } catch (err) {
        console.error('Auth check error:', err);
        history.replace('/');
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, [history]);

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

  if (!isAuthenticated) {
    return null;
  }

  return <HomeScreen />;
};
