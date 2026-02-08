import { IonPage, IonContent, IonInput, IonButton, IonText, IonItem, IonLabel } from '@ionic/react';
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
        headers: {
          "Content-Type": "application/json",
        },
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
      <IonContent className="ion-padding">
        <div className="flex flex-col justify-center items-center h-full px-4">
          <IonText>
            <h1 className="text-3xl font-bold text-white mb-8 text-center">Восстановление пароля</h1>
          </IonText>

          {success ? (
            <div className="w-full max-w-md space-y-4">
              <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg text-center">
                Если пользователь с таким email существует, ссылка для восстановления пароля была отправлена на указанный адрес.
              </div>
              <IonButton
                fill="clear"
                onClick={() => history.push("/login")}
                className="text-indigo-400"
              >
                Вернуться к входу
              </IonButton>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
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
                  {loading ? "Отправка..." : "Отправить"}
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

export default ForgotPasswordScreen;
