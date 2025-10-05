import { useState, useEffect } from "react";

type WaitingScreenProps = {
    onSetUserName: (userName: string) => void;
}

const USER_NAME_KEY = 'chess_user_name';

export const WaitingScreen = ({ onSetUserName }: WaitingScreenProps) => {
    const [userName, setUserName] = useState<string>("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Загружаем сохраненное имя при инициализации
    useEffect(() => {
        const savedUserName = localStorage.getItem(USER_NAME_KEY);
        if (savedUserName) {
            setUserName(savedUserName);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!userName) return;

        if (userName.trim()) {
            onSetUserName(userName.trim());
            setIsSubmitted(true);
        }
    };

    const handleClearName = () => {
        setUserName("");
        localStorage.removeItem(USER_NAME_KEY);
    };

    if (isSubmitted) {
        return (
            <div className="container">
                <h1>Ожидание подключения...</h1>
                <p>Имя: {userName}</p>
            </div>
        );
    }

    return (
        <div className="container">
            <h1>Введите ваше имя</h1>
            <form onSubmit={handleSubmit} style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '20px', 
                alignItems: 'center',
                marginTop: '40px'
            }}>
                <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Ваше имя"
                    required
                    style={{
                        padding: '15px 20px',
                        fontSize: '18px',
                        border: '2px solid #ffffffcc',
                        borderRadius: '8px',
                        backgroundColor: 'transparent',
                        color: '#ffffffcc',
                        minWidth: '300px',
                        textAlign: 'center'
                    }}
                />
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button
                        type="submit"
                        style={{
                            padding: '15px 40px',
                            fontSize: '18px',
                            backgroundColor: '#2b1565',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#3d1f8a';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#2b1565';
                        }}
                    >
                        Войти в игру
                    </button>
                    
                    {userName && (
                        <button
                            type="button"
                            onClick={handleClearName}
                            style={{
                                padding: '15px 20px',
                                fontSize: '18px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'background-color 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = '#c82333';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = '#dc3545';
                            }}
                        >
                            Очистить
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
