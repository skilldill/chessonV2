import { useEffect, useState } from "react";
import { API_PREFIX } from "../constants/api";

type UseAutoConnectParams = {
    roomId: string;
    userName: string | undefined;
    storageGameData: { playerName: string; avatar: string; gameId: string } | undefined;
    connectToRoom: (data: { userName: string; avatar: string }) => void;
    setUserName: (name: string) => void;
    saveGameData: (data: { playerName: string; avatar: string; gameId: string }) => void;
    removeGameData: () => void;
};

export const useAutoConnect = ({
    roomId,
    userName,
    storageGameData,
    connectToRoom,
    setUserName,
    saveGameData,
    removeGameData,
}: UseAutoConnectParams) => {
    const [checkingAuth, setCheckingAuth] = useState(true);

    const handleSetUserName = (userName: string, avatarIndex: number) => {
        setUserName(userName);
        connectToRoom({
            userName,
            avatar: `${avatarIndex}`,
        });

        saveGameData({
            playerName: userName,
            avatar: `${avatarIndex}`,
            gameId: roomId,
        });
    };

    // Обработка сохраненных данных игры
    useEffect(() => {
        if (!storageGameData) return;

        // Проверим, если игрок пытается открыть
        // новую ссессию, то удалим старые данные
        if (storageGameData.gameId !== roomId) {
            removeGameData();
            return;
        }

        handleSetUserName(storageGameData.playerName, parseInt(storageGameData.avatar));
        setCheckingAuth(false);
    }, [storageGameData, roomId]);

    // Проверка авторизации и автоматическая подстановка данных
    useEffect(() => {
        // Если уже есть userName или storageGameData обрабатывается, пропускаем
        if (userName || storageGameData) {
            if (!storageGameData) {
                setCheckingAuth(false);
            }
            return;
        }

        const checkAuthAndAutoConnect = async () => {
            try {
                const response = await fetch(`${API_PREFIX}/auth/me`, {
                    credentials: "include",
                });

                const data = await response.json();

                if (data.success && data.user) {
                    // Пользователь авторизован - используем данные из профиля
                    const profileName = data.user.name || data.user.login;
                    const profileAvatar = parseInt(data.user.avatar || "0");
                    
                    handleSetUserName(profileName, profileAvatar);
                }
            } catch (err) {
                // Не авторизован или ошибка - покажем форму
                console.error("Auth check error:", err);
            } finally {
                setCheckingAuth(false);
            }
        };

        checkAuthAndAutoConnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    return {
        checkingAuth,
        handleSetUserName,
    };
};
