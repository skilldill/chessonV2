import { useState } from "react";

export const useUserData = () => {
    const [userName, setUserName] = useState<string>();
    const [avatarSrc, setAvatatSrc] = useState<string>();

    const clearUserData = () => {
        setUserName(undefined);
        setAvatatSrc(undefined);
    };

    return { 
        userName, 
        avatarSrc,

        setUserName,
        setAvatatSrc,
        clearUserData
    };
}
