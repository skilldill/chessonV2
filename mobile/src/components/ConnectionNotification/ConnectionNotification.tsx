import { useEffect, useState } from "react";
import styles from "./ConnectionNotification.module.css";
import NonConnectionSVG from '../../assets/non-connection.svg';

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
            className={`fixed top-[16px] right-[16px] z-50 bg-back-secondary backdrop-blur-xl rounded-lg px-[16px] py-[18px] border border-gray-200/20 shadow-lg ${
                isAnimating ? styles.slideIn : styles.slideOut
            }`}
        >
            <div className="flex gap-[12px]">
                <img src={NonConnectionSVG} alt="non connection" />
                <p className="text-[16px] font-medium">
                    {message}
                </p>
            </div>
        </div>
    );
};

