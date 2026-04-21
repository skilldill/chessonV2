import { IonPage, IonContent } from '@ionic/react';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { API_PREFIX } from '../../constants/api';
import { useTranslation } from 'react-i18next';

const ResetPasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get("token");
    if (!tokenParam) {
      setError(t("auth.resetTokenNotFound"));
    } else {
      setToken(tokenParam);
    }
  }, [location, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError(t("auth.resetTokenNotFound"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.passwordsDontMatch"));
      return;
    }
    if (password.length < 6) {
      setError(t("auth.passwordMinLength"));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_PREFIX}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => window.location.href = "/login", 2000);
      } else {
        setError(data.error || t("auth.resetErrorDefault"));
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError(t("auth.resetErrorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" fullscreen>
        <div className="w-full min-h-full flex flex-col justify-center items-center py-6 px-4">
          <div className="auth-card relative flex flex-col items-center fadeIn" style={{ minHeight: 360 }}>
            <div className="auth-card-blur" />
            <div className="w-full flex flex-col items-center relative z-10 gap-6 py-8 px-5">
              <h3 className="text-white text-center text-2xl font-semibold">
                {t("auth.resetTitle")}
              </h3>

              {success ? (
                <div className="w-full flex flex-col items-center gap-4">
                  <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg text-sm w-full text-center">
                    {t("auth.resetSuccessMessage")}
                  </div>
                </div>
              ) : (
                <>
                  <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder={t("auth.newPasswordPlaceholder")}
                      className="auth-input"
                      autoComplete="new-password"
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder={t("auth.confirmPasswordPlaceholder")}
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
                      disabled={loading || !token}
                      className="auth-btn-primary w-full"
                    >
                      {loading ? t("auth.resetting") : t("auth.resetPassword")}
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={() => window.location.href = "/login"}
                    className="text-white/70 active:text-white text-sm py-2 touch-manipulation"
                  >
                    {t("auth.backToSignIn")}
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

export default ResetPasswordScreen;
