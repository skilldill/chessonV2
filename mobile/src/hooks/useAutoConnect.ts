import { useEffect, useState } from "react";
import { API_PREFIX } from "../constants/api";
import { setChessboardThemeToStorage } from "../utils/appearanceStorage";

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
    const QUICK_PLAY_PROFILE_KEY = "quickPlayProfile";
    const BOT_GUEST_PROFILE_KEY = "botGuestProfile";
    const GUEST_CAT_WORDS = [
        "Mad",
        "Fury",
        "Good",
        "Big",
        "Small",
        "Swift",
        "Lucky",
        "Brave",
        "Calm",
        "Wild",
        "Sharp",
        "Rapid",
        "Bold",
        "Mighty",
        "Sneaky",
        "Quiet",
        "Storm",
        "Silver",
        "Golden",
        "Cosmic",
    ];

    const createRandomGuestProfile = () => {
        const randomWord = GUEST_CAT_WORDS[Math.floor(Math.random() * GUEST_CAT_WORDS.length)] || "Guest";
        const randomAvatar = Math.floor(Math.random() * 8);
        return {
            playerName: `${randomWord} cat`,
            avatar: randomAvatar,
        };
    };

    const handleSetUserName = async (userName: string, avatarIndex: number) => {
        setUserName(userName);
        await connectToRoom({
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
        if (userName) {
            setCheckingAuth(false);
            return;
        }

        if (!storageGameData) return;

        // Проверим, если игрок пытается открыть
        // новую ссессию, то удалим старые данные
        if (storageGameData.gameId !== roomId) {
            removeGameData();
            return;
        }

        handleSetUserName(storageGameData.playerName, parseInt(storageGameData.avatar));
        setCheckingAuth(false);
    }, [storageGameData, roomId, userName]);

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
                try {
                    const response = await fetch(`${API_PREFIX}/auth/me`, {
                        credentials: "include",
                    });

                    const data = await response.json();

                    if (data.success && data.user) {
                        // Пользователь авторизован - используем данные из профиля
                        const profileName = data.user.name || data.user.login;
                        const profileAvatar = parseInt(data.user.avatar || "0");
                        const theme = data.user.appearance?.chessboardTheme;
                        if (theme) setChessboardThemeToStorage(theme);
                        localStorage.removeItem(BOT_GUEST_PROFILE_KEY);
                        await handleSetUserName(profileName, profileAvatar);
                        return;
                    }
                } catch (err) {
                    // Не авторизован или ошибка - пробуем гостевые профили
                    console.error("Auth check error:", err);
                }

                const quickPlayProfileRaw = localStorage.getItem(QUICK_PLAY_PROFILE_KEY);
                if (quickPlayProfileRaw) {
                    try {
                        const quickPlayProfile = JSON.parse(quickPlayProfileRaw) as { playerName?: string; avatar?: string };
                        const playerName = quickPlayProfile.playerName || "Anonymous Cat";
                        const avatarIndex = parseInt(quickPlayProfile.avatar || "0");
                        localStorage.removeItem(QUICK_PLAY_PROFILE_KEY);
                        await handleSetUserName(playerName, Number.isNaN(avatarIndex) ? 0 : avatarIndex);
                        return;
                    } catch (error) {
                        console.error("Failed to parse quick play profile:", error);
                        localStorage.removeItem(QUICK_PLAY_PROFILE_KEY);
                    }
                }

                const botGuestProfileRaw = localStorage.getItem(BOT_GUEST_PROFILE_KEY);
                if (botGuestProfileRaw) {
                    try {
                        const botGuestProfile = JSON.parse(botGuestProfileRaw) as { roomId?: string; playerName?: string; avatar?: string };
                        if (botGuestProfile.roomId === roomId) {
                            const playerName = botGuestProfile.playerName || "Guest Cat";
                            const avatarIndex = parseInt(botGuestProfile.avatar || "0");
                            localStorage.removeItem(BOT_GUEST_PROFILE_KEY);
                            await handleSetUserName(playerName, Number.isNaN(avatarIndex) ? 0 : avatarIndex);
                            return;
                        }
                    } catch (error) {
                        console.error("Failed to parse bot guest profile:", error);
                    } finally {
                        localStorage.removeItem(BOT_GUEST_PROFILE_KEY);
                    }
                }

                const randomGuestProfile = createRandomGuestProfile();
                await handleSetUserName(randomGuestProfile.playerName, randomGuestProfile.avatar);
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
