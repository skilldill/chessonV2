import { IonPage, IonContent } from '@ionic/react';
import { useState, useEffect } from 'react';
import { API_PREFIX } from '../../constants/api';
import { useTranslation } from 'react-i18next';

const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
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
          window.location.href = "/main";
        }
      } catch {
        // Не авторизован, продолжаем показывать форму
      }
    };
    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_PREFIX}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ login, password }),
      });
      const data = await response.json();

      if (data.success) {
        window.location.href = "/main";
      } else {
        setError(data.error || t("auth.loginErrorDefault"));
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(t("auth.loginErrorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" fullscreen>
        <div className="w-full min-h-full flex flex-col justify-center items-center py-6 px-4">
          <div className="auth-card relative flex flex-col items-center fadeIn" style={{ minHeight: 320 }}>
            <div className="auth-card-blur" />
            <div className="w-full flex flex-col items-center relative z-10 gap-6 py-8 px-5">
              <h3 className="text-white text-center text-2xl font-semibold">
                {t("auth.loginTitle")}
              </h3>

              <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">
                <div className="relative w-full">
                  <input
                    type="text"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    required
                    placeholder={t("auth.usernamePlaceholder")}
                    className="auth-input"
                    autoComplete="username"
                  />
                </div>
                <div className="relative w-full">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={t("auth.passwordPlaceholder")}
                    className="auth-input"
                    autoComplete="current-password"
                  />
                </div>

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
                  {loading ? t("auth.signingIn") : t("auth.signIn")}
                </button>

                <button
                  type="button"
                  onClick={() => window.location.href = "/"}
                  className="w-full rounded-md text-sm font-semibold px-4 py-2 border border-white/20 bg-transparent text-white/90 active:bg-white/5 transition-colors duration-200 touch-manipulation"
                >
                  {t("auth.continueGuest")}
                </button>
              </form>

              <div className="flex flex-col items-center gap-1 text-sm">
                <button
                  type="button"
                  onClick={() => window.location.href = "/signup"}
                  className="text-white/70 active:text-white py-2 touch-manipulation"
                >
                  {t("auth.noAccount")}
                </button>
                <button
                  type="button"
                  onClick={() => window.location.href = "/forgot-password"}
                  className="text-white/50 active:text-white/70 py-2 touch-manipulation"
                >
                  {t("auth.forgotPassword")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LoginScreen;
