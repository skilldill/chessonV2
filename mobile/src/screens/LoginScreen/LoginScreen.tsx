import { IonPage, IonContent, IonInput, IonButton, IonText, IonItem, IonLabel } from '@ionic/react';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { API_PREFIX } from '../../constants/api';

const LoginScreen: React.FC = () => {
  const history = useHistory();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Проверка авторизации при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_PREFIX}/auth/me`, {
          credentials: "include",
        });
        const data = await response.json();
        if (data.success) {
          history.push("/main");
        }
      } catch (err) {
        // Не авторизован, продолжаем показывать форму
      }
    };
    checkAuth();
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_PREFIX}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ login, password }),
      });

      const data = await response.json();

      if (data.success) {
        history.push("/main");
      } else {
        setError(data.error || "Ошибка при входе");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Произошла ошибка при входе");
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="flex flex-col justify-center items-center h-full px-4">
          <IonText>
            <h1 className="text-3xl font-bold text-white mb-8 text-center">Вход</h1>
          </IonText>

          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
            <IonItem>
              <IonLabel position="stacked">Логин</IonLabel>
              <IonInput
                type="text"
                value={login}
                onIonInput={(e) => setLogin(e.detail.value!)}
                required
                placeholder="Введите логин"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Пароль</IonLabel>
              <IonInput
                type="password"
                value={password}
                onIonInput={(e) => setPassword(e.detail.value!)}
                required
                placeholder="Введите пароль"
              />
            </IonItem>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <IonButton
              type="submit"
              expand="block"
              disabled={loading}
              className="mt-4"
            >
              {loading ? "Вход..." : "Войти"}
            </IonButton>
          </form>

          <div className="mt-6 text-center space-y-2 w-full max-w-md">
            <IonButton
              fill="clear"
              onClick={() => history.push("/signup")}
              className="text-indigo-400"
            >
              Нет аккаунта? Зарегистрироваться
            </IonButton>
            <br />
            <IonButton
              fill="clear"
              onClick={() => history.push("/forgot-password")}
              className="text-gray-400"
            >
              Забыли пароль?
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LoginScreen;
