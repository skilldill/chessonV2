import type { FC } from "react";
import { useHistory } from "react-router-dom";
import { ShareLinkBlock } from "../../components/ShareLinkBlock/ShareLinkBlock";

type WaitingScreenProps = {
    onLeave?: () => void;
};

export const WaitingScreen: FC<WaitingScreenProps> = ({ onLeave }) => {
    const history = useHistory();

    const handleLeave = () => {
        onLeave?.();
        history.push("/main");
    };

    return (
        <div className="w-full h-[100vh] flex flex-col justify-center items-center gap-4 px-4">
            <ShareLinkBlock onClose={handleLeave} />
            <button
                type="button"
                onClick={handleLeave}
                className="w-full max-w-[430px] rounded-xl px-6 py-2 bg-white/10 border border-white/15 text-white font-semibold hover:bg-white/15 transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer fadeIn"
            >
                Leave
            </button>
        </div>
    );
};
