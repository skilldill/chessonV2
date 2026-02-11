import { IonPage, IonContent } from '@ionic/react';
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
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get("token");
    if (!tokenParam) {
      setError("Reset token not found");
    } else {
      setToken(tokenParam);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Reset token not found");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
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
        setTimeout(() => history.push("/login"), 2000);
      } else {
        setError(data.error || "Error resetting password");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError("An error occurred while resetting password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding auth-screen-bg" fullscreen>
        <div className="w-full min-h-full flex flex-col justify-center items-center py-6 px-4">
          <div className="auth-card relative flex flex-col items-center fadeIn" style={{ minHeight: 360 }}>
            <div className="auth-card-blur" />
            <div className="w-full flex flex-col items-center relative z-10 gap-6 py-8 px-5">
              <h3 className="text-white text-center text-2xl font-semibold">
                Password reset
              </h3>

              {success ? (
                <div className="w-full flex flex-col items-center gap-4">
                  <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg text-sm w-full text-center">
                    Password changed successfully. Redirecting to sign-in page...
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
                      placeholder="New password (minimum 6 characters)"
                      className="auth-input"
                      autoComplete="new-password"
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Confirm password"
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
                      {loading ? "Resetting..." : "Reset password"}
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={() => history.push("/login")}
                    className="text-white/70 active:text-white text-sm py-2 touch-manipulation"
                  >
                    Back to sign in
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
