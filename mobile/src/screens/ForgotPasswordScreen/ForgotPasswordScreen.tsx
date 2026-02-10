import { IonPage, IonContent } from '@ionic/react';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { API_PREFIX } from '../../constants/api';

const ForgotPasswordScreen: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch(`${API_PREFIX}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || "Ошибка при отправке запроса");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Произошла ошибка при отправке запроса");
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
                Восстановление пароля
              </h3>

              {success ? (
                <div className="w-full flex flex-col items-center gap-4">
                  <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg text-sm w-full text-center">
                    Если пользователь с таким email существует, ссылка для восстановления пароля была отправлена на указанный адрес.
                  </div>
                  <button
                    type="button"
                    onClick={() => history.push("/login")}
                    className="text-white/70 active:text-white text-sm py-3 touch-manipulation"
                  >
                    Вернуться к входу
                  </button>
                </div>
              ) : (
                <>
                  <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Email"
                      className="auth-input"
                      autoComplete="email"
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
                      {loading ? "Отправка..." : "Отправить"}
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={() => history.push("/login")}
                    className="text-white/70 active:text-white text-sm py-2 touch-manipulation"
                  >
                    Вернуться к входу
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ForgotPasswordScreen;
