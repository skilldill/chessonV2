import type { FC } from "react";
import { ShareLinkBlock } from "../../components/ShareLinkBlock/ShareLinkBlock";

export const WaitingScreen: FC = () => {
    const handleClose = () => {
        window.location.href = import.meta.env.VITE_MAIN_SITE;
    };

    return (
        <div className="w-full h-[100vh] flex justify-center items-center">
            <ShareLinkBlock onClose={handleClose} />
        </div>
    );
}
