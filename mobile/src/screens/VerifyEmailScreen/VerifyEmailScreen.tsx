import { IonPage, IonContent, IonText, IonSpinner } from '@ionic/react';
import { useVerifyEmail } from '../../hooks/useVerifyEmail';

const VerifyEmailScreen: React.FC = () => {
  const { status, message, goToProfile } = useVerifyEmail();

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="flex flex-col justify-center items-center h-full">
          {status === 'loading' && (
            <>
              <IonSpinner name="crescent" className="mb-4" style={{ width: '48px', height: '48px' }} />
              <IonText>
                <h1 className="text-2xl font-bold text-white mb-2 text-center">Подтверждение email</h1>
                <p className="text-gray-400 text-center">Пожалуйста, подождите...</p>
              </IonText>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <IonText>
                <h1 className="text-2xl font-bold text-white mb-2 text-center">Успешно!</h1>
                <p className="text-gray-300 mb-4 text-center">{message}</p>
                <p className="text-sm text-gray-400 text-center">Вы будете перенаправлены на страницу профиля...</p>
              </IonText>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <IonText>
                <h1 className="text-2xl font-bold text-white mb-2 text-center">Ошибка</h1>
                <p className="text-gray-300 mb-4 text-center">{message}</p>
              </IonText>
              <button
                onClick={goToProfile}
                className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Перейти в профиль
              </button>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default VerifyEmailScreen;
