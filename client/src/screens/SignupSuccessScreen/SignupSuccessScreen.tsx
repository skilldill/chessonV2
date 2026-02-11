import { Link } from "react-router-dom";

export const SignupSuccessScreen = () => {
  return (
    <div className="w-full h-[100vh] flex justify-center items-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-md w-full mx-4 bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Registration successful!</h1>
        <p className="text-gray-600 mb-6">
          We sent a confirmation email to your address. Please check your inbox and follow the link to activate your account.
        </p>
        <Link
          to="/login"
          className="inline-block bg-green-500 text-white py-2 px-6 rounded-lg hover:bg-green-600 transition-colors"
        >
          Go to sign in
        </Link>
      </div>
    </div>
  );
};
