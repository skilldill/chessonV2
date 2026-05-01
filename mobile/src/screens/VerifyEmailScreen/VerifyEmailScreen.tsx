import { useVerifyEmail } from '../../hooks/useVerifyEmail';
import { useTranslation } from 'react-i18next';

const VerifyEmailScreen: React.FC = () => {
  const { t } = useTranslation();
  const { status, message, goToProfile } = useVerifyEmail();

  return (
    <div className="flex flex-col justify-center items-center" style={{ height: window.innerHeight }}>
      {status === 'loading' && (
        <>
          {/* Spinner here */}
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 text-center">{t("auth.verifyTitle")}</h1>
            <p className="text-gray-400 text-center">{t("auth.pleaseWait")}</p>
          </div>
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
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 text-center">{t("auth.success")}</h1>
            <p className="text-gray-300 mb-4 text-center">{message}</p>
            <p className="text-sm text-gray-400 text-center">{t("auth.redirectToProfile")}</p>
          </div>
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
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 text-center">{t("auth.error")}</h1>
            <p className="text-gray-300 mb-4 text-center">{message}</p>
          </div>
          <button
            onClick={goToProfile}
            className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {t("auth.goToProfile")}
          </button>
        </>
      )}
    </div>
  );
};

export default VerifyEmailScreen;
