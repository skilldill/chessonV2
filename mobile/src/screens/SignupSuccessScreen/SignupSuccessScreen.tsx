import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';

const SignupSuccessScreen: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent className="ion-padding auth-screen-bg" fullscreen>
        <div className="w-full min-h-full flex flex-col justify-center items-center py-6 px-4">
          <div className="auth-card relative flex flex-col items-center fadeIn" style={{ minHeight: 280 }}>
            <div className="auth-card-blur" />
            <div className="w-full flex flex-col items-center relative z-10 gap-6 py-8 px-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white text-center">
                Регистрация успешна!
              </h1>
              <p className="text-white/70 text-center text-sm leading-relaxed">
                Мы отправили письмо с подтверждением на ваш email. Пожалуйста, проверьте почту и перейдите по ссылке для активации аккаунта.
              </p>
              <button
                type="button"
                onClick={() => history.push("/login")}
                className="auth-btn-primary w-full"
              >
                Перейти к входу
              </button>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SignupSuccessScreen;
