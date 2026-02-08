import { IonPage, IonContent, IonInput, IonButton, IonText, IonItem, IonLabel } from '@ionic/react';
import { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { API_PREFIX } from '../../constants/api';

const ResetPasswordScreen: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Получаем токен из query параметров
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get("token");
    
    if (!tokenParam) {
      setError("Токен восстановления не найден");
    } else {
      setToken(tokenParam);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Токен восстановления не найден");
      return;
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    if (password.length < 6) {
      setError("Пароль должен быть не менее 6 символов");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_PREFIX}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Перенаправляем на страницу входа через 2 секунды
        setTimeout(() => {
          history.push("/login");
        }, 2000);
      } else {
        setError(data.error || "Ошибка при сбросе пароля");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Произошла ошибка при сбросе пароля");
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="flex flex-col justify-center items-center h-full px-4">
          <IonText>
            <h1 className="text-3xl font-bold text-white mb-8 text-center">Сброс пароля</h1>
          </IonText>

          {success ? (
            <div className="w-full max-w-md space-y-4">
              <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg text-center">
                Пароль успешно изменен. Перенаправление на страницу входа...
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
                <IonItem>
                  <IonLabel position="stacked">Новый пароль</IonLabel>
                  <IonInput
                    type="password"
                    value={password}
                    onIonInput={(e) => setPassword(e.detail.value!)}
                    required
                    minlength={6}
                    placeholder="Введите новый пароль (минимум 6 символов)"
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Подтвердите пароль</IonLabel>
                  <IonInput
                    type="password"
                    value={confirmPassword}
                    onIonInput={(e) => setConfirmPassword(e.detail.value!)}
                    required
                    placeholder="Повторите пароль"
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
                  disabled={loading || !token}
                  className="mt-4"
                >
                  {loading ? "Сброс..." : "Сбросить пароль"}
                </IonButton>
              </form>

              <div className="mt-6 text-center w-full max-w-md">
                <IonButton
                  fill="clear"
                  onClick={() => history.push("/login")}
                  className="text-indigo-400"
                >
                  Вернуться к входу
                </IonButton>
              </div>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ResetPasswordScreen;
