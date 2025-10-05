import { useState } from "react";

export const useUserData = () => {
    const [userName, setUserName] = useState<string>();

    return { userName, setUserName };
}
