import { ShareLinkBlock } from "../../components/ShareLinkBlock/ShareLinkBlock";

type WaitingScreenProps = {
    roomId: string;
    isConnected: boolean;
    userName: string;
}

export const WaitingScreen = ({ roomId, isConnected, userName }: WaitingScreenProps) => {
    const handleClose = () => {
        window.location.href = 'https://chesson.me/';
    };

return (
    <div className="w-full h-[100vh] flex justify-center items-center">
        <ShareLinkBlock link={window.location.toString()} onClose={handleClose} />
    </div>
    );
}
