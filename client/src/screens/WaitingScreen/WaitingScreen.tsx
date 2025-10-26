import { ShareLinkBlock } from "../../components/ShareLinkBlock/ShareLinkBlock";

type WaitingScreenProps = {
    roomId: string;
    isConnected: boolean;
    userName: string;
}

export const WaitingScreen = ({ roomId, isConnected, userName }: WaitingScreenProps) => {
return (
        <div className="container">
            <ShareLinkBlock link={window.location.toString()} />
            <div>Подключен: {isConnected ? 'Да' : 'Нет'}</div>
            <div>Имя пользователя: {userName}</div>
            <div>Ожидание начала игры...</div>
        </div>
    );
}
