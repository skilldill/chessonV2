import { useState, useEffect } from "react";
import { useHistory, Link } from "react-router-dom";
import { API_PREFIX } from "../../constants/api";

export const LoginScreen = () => {
  const history = useHistory();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Проверка авторизации при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_PREFIX}/auth/me`, {
          credentials: "include",
        });
        const data = await response.json();
        if (data.success) {
          history.push("/main");
        }
      } catch (err) {
        // Не авторизован, продолжаем показывать форму
      }
    };
    checkAuth();
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_PREFIX}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ login, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Редирект на главную страницу
        history.push("/main");
      } else {
        setError(data.error || "Ошибка при входе");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Произошла ошибка при входе");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-[100vh] flex justify-center items-center">
      <div className="w-[432px] relative rounded-xl border-[1px] border-[#364153] rounded-3xl overflow-hidden select-none fadeIn">
        <div className="w-[348px] h-[348px] rounded-full absolute top-[-174px] left-[-104px] bg-[#155DFC] z-30 blur-[200px]" />
        
        <div className="w-full flex flex-col items-center relative gap-[32px] z-40 py-[32px]">
          <h3 className="text-white text-center text-3xl font-semibold">
            Вход
          </h3>

          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-[24px] px-[32px]">
            <div className="relative w-full">
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                placeholder="Логин"
                className="bg-white/4 w-full h-[40px] px-[12px] py-[10px] border border-white/10 border-solid rounded-md focus:border-indigo-700 focus:outline-none transition-all duration-200 placeholder-[#99A1AF] text-white"
              />
            </div>

            <div className="relative w-full">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Пароль"
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
              {loading ? "Вход..." : "Войти"}
            </button>
          </form>

          <div className="flex flex-col items-center gap-2 text-sm">
            <Link
              to="/signup"
              className="text-white/70 hover:text-white transition-colors"
            >
              Нет аккаунта? Зарегистрироваться
            </Link>
            <Link
              to="/forgot-password"
              className="text-white/50 hover:text-white/70 transition-colors"
            >
              Забыли пароль?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
