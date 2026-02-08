import { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { API_PREFIX } from "../constants/api";

export type VerifyEmailStatus = 'loading' | 'success' | 'error';

export const useVerifyEmail = () => {
  const history = useHistory();
  const location = useLocation();
  const [status, setStatus] = useState<VerifyEmailStatus>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      // Получаем токен из query параметров
      const searchParams = new URLSearchParams(location.search);
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Токен подтверждения не найден');
        return;
      }

      try {
        const response = await fetch(`${API_PREFIX}/auth/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Email успешно подтвержден!');
          
          // Редирект на экран профиля через 3 секунды
          setTimeout(() => {
            history.push('/profile');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Ошибка при подтверждении email');
        }
      } catch (error) {
        console.error('Error verifying email:', error);
        setStatus('error');
        setMessage('Произошла ошибка при подтверждении email');
      }
    };

    verifyEmail();
  }, [location.search, history]);

  const goToProfile = () => {
    history.push('/profile');
  };

  return {
    status,
    message,
    goToProfile,
  };
};
