import { type FC, useEffect, useState, useRef } from "react";
import { useHistory } from "react-router-dom";
import { API_PREFIX } from "../../constants/api";
import styles from "./ResultsActions.module.css";

type ResultsActionsProps = {
    message?: string;
    onClose: () => void;
}

export const ResultsActions: FC<ResultsActionsProps> = ({ 
    message,
    onClose
}) => {
    const history = useHistory();
    const [isClosing, setIsClosing] = useState(false);
    const [shouldRender, setShouldRender] = useState<boolean>(false);
    const [isDismissed, setIsDismissed] = useState<boolean>(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const previousMessageRef = useRef<string | undefined>(undefined);

    // Проверяем авторизацию при показе модального окна
    useEffect(() => {
        if (message && !isDismissed) {
            const checkAuth = async () => {
                try {
                    const response = await fetch(`${API_PREFIX}/auth/me`, {
                        credentials: "include",
                    });
                    const data = await response.json();
                    setIsAuthenticated(data.success && data.user);
                } catch (err) {
                    setIsAuthenticated(false);
                }
            };
            checkAuth();
        }
    }, [message, isDismissed]);

    useEffect(() => {
        if (message && !isDismissed) {
            setIsClosing(false);
            setShouldRender(true);
        } else if (shouldRender && (!message || isDismissed)) {
            setIsClosing(true);
            const timer = setTimeout(() => {
                setShouldRender(false);
                // Не сбрасываем isDismissed здесь - он будет сброшен только при новом сообщении
            }, 300); // Длительность анимации
            return () => clearTimeout(timer);
        }
    }, [message, shouldRender, isDismissed]);

    // Сбрасываем isDismissed только когда приходит новое сообщение (отличающееся от предыдущего) или когда message становится undefined
    useEffect(() => {
        if (message === undefined) {
            // Если сообщение стало undefined, сбрасываем isDismissed
            setIsDismissed(false);
            previousMessageRef.current = undefined;
        } else if (message !== previousMessageRef.current) {
            // Если пришло новое сообщение (отличающееся от предыдущего), сбрасываем isDismissed
            setIsDismissed(false);
            previousMessageRef.current = message;
        }
    }, [message]);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            setIsDismissed(true);
        }
    };

    const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
    };

    const handleCloseButton = () => {
        onClose();
        if (isAuthenticated) {
            history.push("/main");
        } else {
            window.location.href = import.meta.env.VITE_MAIN_SITE;
        }
    };

    const handleSignup = () => {
        onClose();
        history.push("/signup");
    };

    const handleLogin = () => {
        onClose();
        history.push("/login");
    };

    if (!shouldRender) {
        return null;
    }

    return (
        <div 
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm ${isClosing ? styles.overlayClosing : styles.overlay}`}
            onClick={handleOverlayClick}
        >
            <div 
                className={`w-[334px] bg-black/80 backdrop-blur-xl rounded-2xl p-8 border border-[#364153] flex flex-col items-center gap-4 ${isClosing ? styles.modalClosing : styles.modal}`}
                onClick={handleModalClick}
            >
                <h2 className="text-white text-xl font-semibold mb-2">
                    Game Result
                </h2>
                <p className="text-gray-300 text-sm mb-4 text-center">
                    {message || 'Game over'}
                </p>

                {/* Предложение регистрации для неавторизованных */}
                {isAuthenticated === false && (
                    <div className="w-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-lg p-4 mb-2">
                        <p className="text-white text-sm text-center mb-3">
                            Sign up to save game history and track your stats!
                        </p>
                        <div className="flex flex-col gap-2">
                            <button 
                                className="rounded-md text-sm font-semibold px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white cursor-pointer transition-all duration-300 active:scale-95 focus:outline-none hover:from-indigo-700 hover:to-purple-700"
                                onClick={handleSignup}
                            >
                                Sign up
                            </button>
                            <button 
                                className="rounded-md text-sm font-semibold px-4 py-2 bg-white/10 text-white border border-white/20 cursor-pointer transition-all duration-300 active:scale-95 focus:outline-none hover:bg-white/20"
                                onClick={handleLogin}
                            >
                                Sign in
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex gap-4 w-full">
                    <button 
                        className="flex-1 rounded-md text-sm font-semibold px-4 py-2 bg-[#4F39F6] text-white cursor-pointer transition-all duration-300 active:scale-95 focus:outline-none"
                        onClick={handleCloseButton}
                    >
                        {isAuthenticated === false ? "Continue without registration" : "Return to the main"}
                    </button>
                </div>
            </div>
        </div>
    );
};
