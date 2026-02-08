import { useState, useEffect } from "react";
import { useHistory, useLocation, Link } from "react-router-dom";
import { API_PREFIX } from "../../constants/api";

export const ResetPasswordScreen = () => {
  const history = useHistory();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Получаем токен из query параметров
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get("token");
    
    if (!tokenParam) {
      setError("Токен восстановления не найден");
    } else {
      setToken(tokenParam);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Токен восстановления не найден");
      return;
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    if (password.length < 6) {
      setError("Пароль должен быть не менее 6 символов");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_PREFIX}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Перенаправляем на страницу входа через 2 секунды
        setTimeout(() => {
          history.push("/login");
        }, 2000);
      } else {
        setError(data.error || "Ошибка при сбросе пароля");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Произошла ошибка при сбросе пароля");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-[100vh] flex justify-center items-center">
      <div className="w-[432px] min-h-[500px] relative rounded-xl border-[1px] border-[#364153] rounded-3xl overflow-hidden select-none fadeIn">
        <div className="w-[348px] h-[348px] rounded-full absolute top-[-174px] left-[-104px] bg-[#155DFC] z-30 blur-[200px]" />
        
        <div className="w-full h-full flex flex-col items-center absolute top-0 left-0 gap-[32px] z-40 py-[32px]">
          <h3 className="text-white text-center text-3xl font-semibold">
            Сброс пароля
          </h3>

          {success ? (
            <div className="w-full flex flex-col items-center gap-[24px] px-[32px]">
              <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg text-sm w-full text-center">
                Пароль успешно изменен. Перенаправление на страницу входа...
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-[24px] px-[32px]">
                <div className="relative w-full">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Новый пароль (минимум 6 символов)"
                    className="bg-white/4 w-full h-[40px] px-[12px] py-[10px] border border-white/10 border-solid rounded-md focus:border-indigo-700 focus:outline-none transition-all duration-200 placeholder-[#99A1AF] text-white"
                  />
                </div>

                <div className="relative w-full">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Подтвердите пароль"
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
                  disabled={loading || !token}
                  className="rounded-md text-sm font-semibold px-4 py-2 bg-[#4F39F6] text-white min-w-[126px] cursor-pointer transition-all duration-300 active:scale-95 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Сброс..." : "Сбросить пароль"}
                </button>
              </form>

              <div className="flex flex-col items-center gap-2 text-sm">
                <Link
                  to="/login"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Вернуться к входу
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
