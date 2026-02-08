import { IonPage, IonContent, IonInput, IonButton, IonText, IonItem, IonLabel } from '@ionic/react';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { API_PREFIX } from '../../constants/api';

const SignupScreen: React.FC = () => {
  const history = useHistory();
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
          history.push("/");
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
      const response = await fetch(`${API_PREFIX}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ login, email, password }),
      });

      const data = await response.json();

      if (data.success) {
        history.push("/signup-success");
      } else {
        setError(data.error || "Ошибка при регистрации");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Произошла ошибка при регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="flex flex-col justify-center items-center h-full px-4">
          <IonText>
            <h1 className="text-3xl font-bold text-white mb-8 text-center">Регистрация</h1>
          </IonText>

          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
            <IonItem>
              <IonLabel position="stacked">Логин</IonLabel>
              <IonInput
                type="text"
                value={login}
                onIonInput={(e) => setLogin(e.detail.value!)}
                required
                minlength={3}
                maxlength={20}
                placeholder="Введите логин (3-20 символов)"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput
                type="email"
                value={email}
                onIonInput={(e) => setEmail(e.detail.value!)}
                required
                placeholder="Введите email"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Пароль</IonLabel>
              <IonInput
                type="password"
                value={password}
                onIonInput={(e) => setPassword(e.detail.value!)}
                required
                minlength={6}
                placeholder="Введите пароль (минимум 6 символов)"
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
              disabled={loading}
              className="mt-4"
            >
              {loading ? "Регистрация..." : "Зарегистрироваться"}
            </IonButton>
          </form>

          <div className="mt-6 text-center w-full max-w-md">
            <IonButton
              fill="clear"
              onClick={() => history.push("/login")}
              className="text-indigo-400"
            >
              Уже есть аккаунт? Войти
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SignupScreen;
