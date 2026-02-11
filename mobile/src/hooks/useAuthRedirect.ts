import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { API_PREFIX } from '../constants/api';

export const useAuthRedirect = () => {
  const history = useHistory();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_PREFIX}/auth/me`, {
          credentials: "include",
        });

        const data = await response.json();

        if (data.success && data.user) {
          // Пользователь авторизован - редирект на профиль
          history.replace("/profile");
        } else {
          // Пользователь не авторизован - остаемся на текущей странице
          setChecking(false);
        }
      } catch (err) {
        // Error или не авторизован - остаемся на текущей странице
        console.error("Auth check error:", err);
        setChecking(false);
      }
    };

    checkAuth();
  }, [history]);

  return { checking };
};
