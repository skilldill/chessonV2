import { useEffect, useState } from "react";
import styles from "./ConnectionNotification.module.css";

type ConnectionNotificationProps = {
    message: string;
    show: boolean;
};

export const ConnectionNotification: React.FC<ConnectionNotificationProps> = ({ 
    message, 
    show 
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (show) {
            setIsVisible(true);
            // Небольшая задержка для плавной анимации появления
            setTimeout(() => setIsAnimating(true), 10);
        } else {
            setIsAnimating(false);
            // Ждем окончания анимации перед скрытием
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [show]);

    if (!isVisible) {
        return null;
    }

    return (
        <div 
            className={`fixed top-[40px] right-[40px] z-50 bg-black/80 backdrop-blur-xl rounded-lg px-4 py-3 border border-red-500/50 shadow-lg min-w-[200px] ${
                isAnimating ? styles.slideIn : styles.slideOut
            }`}
            style={{ marginTop: '60px' }}
        >
            <p className="text-red-400 text-sm font-medium">
                {message}
            </p>
        </div>
    );
};

