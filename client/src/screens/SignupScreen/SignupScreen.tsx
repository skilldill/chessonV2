import { useState, useEffect } from "react";
import { useHistory, Link } from "react-router-dom";
import { API_PREFIX } from "../../constants/api";

export const SignupScreen = () => {
  const history = useHistory();
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
          history.push("/");
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
      const response = await fetch(`${API_PREFIX}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ login, email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Редирект на страницу с сообщением о подтверждении email
        history.push("/signup-success");
      } else {
        setError(data.error || "Ошибка при регистрации");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Произошла ошибка при регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-[100vh] flex justify-center items-center">
      <div className="w-[432px] relative rounded-xl border-[1px] border-[#364153] rounded-3xl overflow-hidden select-none fadeIn">
        <div className="w-[348px] h-[348px] rounded-full absolute top-[-174px] left-[-104px] bg-[#155DFC] z-30 blur-[200px]" />
        
        <div className="w-full flex flex-col items-center relative gap-[24px] z-40 py-[32px]">
          <h3 className="text-white text-center text-3xl font-semibold">
            Регистрация
          </h3>

          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-[20px] px-[32px]">
            <div className="relative w-full">
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                minLength={3}
                maxLength={20}
                placeholder="Логин (3-20 символов)"
                className="bg-white/4 w-full h-[40px] px-[12px] py-[10px] border border-white/10 border-solid rounded-md focus:border-indigo-700 focus:outline-none transition-all duration-200 placeholder-[#99A1AF] text-white"
              />
            </div>

            <div className="relative w-full">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email"
                className="bg-white/4 w-full h-[40px] px-[12px] py-[10px] border border-white/10 border-solid rounded-md focus:border-indigo-700 focus:outline-none transition-all duration-200 placeholder-[#99A1AF] text-white"
              />
            </div>

            <div className="relative w-full">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Пароль (минимум 6 символов)"
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
              disabled={loading}
              className="rounded-md text-sm font-semibold px-4 py-2 bg-[#4F39F6] text-white min-w-[126px] cursor-pointer transition-all duration-300 active:scale-95 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Регистрация..." : "Зарегистрироваться"}
            </button>
          </form>

          <div className="text-center">
            <Link
              to="/login"
              className="text-white/70 hover:text-white transition-colors text-sm"
            >
              Уже есть аккаунт? Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
