import { IonPage, IonContent } from '@ionic/react';
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
      } catch {
        // Не авторизован
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
        headers: { "Content-Type": "application/json" },
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
      <IonContent className="ion-padding auth-screen-bg" fullscreen>
        <div className="w-full min-h-full flex flex-col justify-center items-center py-6 px-4 overflow-y-auto">
          <div className="auth-card relative flex flex-col items-center fadeIn" style={{ minHeight: 400 }}>
            <div className="auth-card-blur" />
            <div className="w-full flex flex-col items-center relative z-10 gap-5 py-8 px-5">
              <h3 className="text-white text-center text-2xl font-semibold">
                Регистрация
              </h3>

              <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">
                <input
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  required
                  minLength={3}
                  maxLength={20}
                  placeholder="Логин (3-20 символов)"
                  className="auth-input"
                  autoComplete="username"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Email"
                  className="auth-input"
                  autoComplete="email"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Пароль (минимум 6 символов)"
                  className="auth-input"
                  autoComplete="new-password"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Подтвердите пароль"
                  className="auth-input"
                  autoComplete="new-password"
                />

                {error && (
                  <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm w-full">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="auth-btn-primary w-full"
                >
                  {loading ? "Регистрация..." : "Зарегистрироваться"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => history.push("/login")}
                className="text-white/70 active:text-white text-sm py-2 touch-manipulation"
              >
                Уже есть аккаунт? Войти
              </button>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SignupScreen;
