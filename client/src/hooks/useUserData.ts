import { useState, useEffect } from "react";

const USER_NAME_KEY = 'chess_user_name';

export const useUserData = () => {
    const [userName, setUserName] = useState<string>();

    // Загружаем сохраненное имя при инициализации
    useEffect(() => {
        const savedUserName = localStorage.getItem(USER_NAME_KEY);
        if (savedUserName) {
            setUserName(savedUserName);
        }
    }, []);

    // Сохраняем имя в localStorage при изменении
    const updateUserName = (newUserName: string) => {
        setUserName(newUserName);
        localStorage.setItem(USER_NAME_KEY, newUserName);
    };

    // Очищаем сохраненное имя
    const clearUserName = () => {
        setUserName(undefined);
        localStorage.removeItem(USER_NAME_KEY);
    };

    return { 
        userName, 
        setUserName: updateUserName,
        clearUserName
    };
}
