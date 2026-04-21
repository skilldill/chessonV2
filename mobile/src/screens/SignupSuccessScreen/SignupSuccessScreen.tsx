import { IonPage, IonContent } from '@ionic/react';
import { useTranslation } from 'react-i18next';

const SignupSuccessScreen: React.FC = () => {
  const { t } = useTranslation();
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
                {t("auth.signupSuccessTitle")}
              </h1>
              <p className="text-white/70 text-center text-sm leading-relaxed">
                {t("auth.signupSuccessDescription")}
              </p>
              <button
                type="button"
                onClick={() => window.location.href = "/login"}
                className="auth-btn-primary w-full"
              >
                {t("auth.goToSignIn")}
              </button>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SignupSuccessScreen;
