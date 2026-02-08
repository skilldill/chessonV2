import { useVerifyEmail } from "../../hooks/useVerifyEmail";

export const VerifyEmailScreen = () => {
  const { status, message, goToProfile } = useVerifyEmail();

  return (
    <div className="w-full h-[100vh] flex justify-center items-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-md w-full mx-4 bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="mb-4">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Подтверждение email</h1>
            <p className="text-gray-600">Пожалуйста, подождите...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Успешно!</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Вы будете перенаправлены на страницу профиля...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Ошибка</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={goToProfile}
              className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Перейти в профиль
            </button>
          </>
        )}
      </div>
    </div>
  );
};
