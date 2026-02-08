import { IonPage, IonContent, IonButton, IonText } from '@ionic/react';
import { useHistory } from 'react-router-dom';

const SignupSuccessScreen: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="flex flex-col justify-center items-center h-full px-4">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <IonText>
            <h1 className="text-2xl font-bold text-white mb-4 text-center">Регистрация успешна!</h1>
            <p className="text-gray-300 mb-6 text-center">
              Мы отправили письмо с подтверждением на ваш email. Пожалуйста, проверьте почту и перейдите по ссылке для активации аккаунта.
            </p>
          </IonText>
          <IonButton
            expand="block"
            onClick={() => history.push("/login")}
          >
            Перейти к входу
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SignupSuccessScreen;
