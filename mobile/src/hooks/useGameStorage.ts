import { useEffect, useState } from "react";

type StorageGameData = {
    playerName: string;
    avatar: string;
    gameId: string;
}

export const useGameStorage = () => {
    const [storageGameData, setStorageGameData] = useState<StorageGameData>();

    const saveGameData = (data: StorageGameData) => {
        localStorage.setItem('gameData', JSON.stringify(data));
    }

    const removeGameData = () => localStorage.removeItem('gameData');

    const fetchGameData = () => {
        const gameData = localStorage.getItem('gameData');

        if (!gameData) return;
        
        const parsedData = JSON.parse(gameData);

        setStorageGameData(parsedData);
    }

    useEffect(() => {
        fetchGameData();
    }, []);

    return { storageGameData, saveGameData, fetchGameData, removeGameData };
}
