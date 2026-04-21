import { useState } from "react";
import { Link } from "react-router-dom";
import { API_PREFIX } from "../../constants/api";
import { useTranslation } from "react-i18next";

export const ForgotPasswordScreen = () => {
  const { t } = useTranslation();
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
        setError(data.error || t("auth.forgotErrorDefault"));
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(t("auth.forgotErrorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-[100vh] flex justify-center items-center">
      <div className="w-[432px] min-h-[400px] relative rounded-xl border-[1px] border-[#364153] rounded-3xl overflow-hidden select-none fadeIn">
        <div className="w-[348px] h-[348px] rounded-full absolute top-[-174px] left-[-104px] bg-[#155DFC] z-30 blur-[200px]" />
        
        <div className="w-full h-full flex flex-col items-center absolute top-0 left-0 gap-[32px] z-40 py-[32px]">
          <h3 className="text-white text-center text-3xl font-semibold">
            {t("auth.passwordRecoveryTitle")}
          </h3>

          {success ? (
            <div className="w-full flex flex-col items-center gap-[24px] px-[32px]">
              <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg text-sm w-full text-center">
                {t("auth.forgotSuccessMessage")}
              </div>
              <Link
                to="/login"
                className="text-white/70 hover:text-white transition-colors text-sm"
              >
                {t("auth.backToSignIn")}
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-[24px] px-[32px]">
                <div className="relative w-full">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={t("auth.emailPlaceholder")}
                    className="bg-white/4 w-full h-[40px] px-[12px] py-[10px] border border-white/10 border-solid rounded-md focus:border-indigo-700 focus:outline-none transition-all duration-200 placeholder-[#99A1AF] text-white"
                  />
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm w-full">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md text-sm font-semibold px-4 py-2 bg-[#4F39F6] text-white min-w-[126px] cursor-pointer transition-all duration-300 active:scale-95 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t("auth.sending") : t("auth.send")}
                </button>
              </form>

              <div className="flex flex-col items-center gap-2 text-sm">
                <Link
                  to="/login"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  {t("auth.backToSignIn")}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
