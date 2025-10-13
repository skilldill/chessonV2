type WaitingScreenProps = {
    roomId: string;
    isConnected: boolean;
    userName: string;
}

export const WaitingScreen = ({ roomId, isConnected, userName }: WaitingScreenProps) => {
return (
        <div className="container">
            <div>AppScreen {roomId}</div>
            <div>Подключен: {isConnected ? 'Да' : 'Нет'}</div>
            <div>Имя пользователя: {userName}</div>
            <div>Ожидание начала игры...</div>
        </div>
    );
}
