import { IonPage, IonContent } from '@ionic/react';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { API_PREFIX } from '../../constants/api';

const LoginScreen: React.FC = () => {
  const history = useHistory();
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
          history.push("/main");
        }
      } catch {
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
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ login, password }),
      });
      const data = await response.json();

      if (data.success) {
        history.push("/main");
      } else {
        setError(data.error || "Login error");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred while signing in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding auth-screen-bg" fullscreen>
        <div className="w-full min-h-full flex flex-col justify-center items-center py-6 px-4">
          <div className="auth-card relative flex flex-col items-center fadeIn" style={{ minHeight: 320 }}>
            <div className="auth-card-blur" />
            <div className="w-full flex flex-col items-center relative z-10 gap-6 py-8 px-5">
              <h3 className="text-white text-center text-2xl font-semibold">
                Login
              </h3>

              <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">
                <div className="relative w-full">
                  <input
                    type="text"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    required
                    placeholder="Username"
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
                    placeholder="Password"
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
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>

              <div className="flex flex-col items-center gap-1 text-sm">
                <button
                  type="button"
                  onClick={() => history.push("/signup")}
                  className="text-white/70 active:text-white py-2 touch-manipulation"
                >
                  Don't have an account? Sign up
                </button>
                <button
                  type="button"
                  onClick={() => history.push("/forgot-password")}
                  className="text-white/50 active:text-white/70 py-2 touch-manipulation"
                >
                  Forgot password?
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
