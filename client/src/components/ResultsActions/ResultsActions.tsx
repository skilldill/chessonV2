import { type FC, useEffect, useState, useRef } from "react";
import styles from "./ResultsActions.module.css";

type ResultsActionsProps = {
    message?: string;
    onClose: () => void;
}

export const ResultsActions: FC<ResultsActionsProps> = ({ 
    message,
    onClose
}) => {
    const [isClosing, setIsClosing] = useState(false);
    const [shouldRender, setShouldRender] = useState<boolean>(false);
    const [isDismissed, setIsDismissed] = useState<boolean>(false);
    const previousMessageRef = useRef<string | undefined>(undefined);

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
                    {message || 'Игра завершена'}
                </p>
                <div className="flex gap-4">
                    <button 
                        className="rounded-md text-sm font-semibold px-4 py-2 bg-[#4F39F6] text-white min-w-[126px] cursor-pointer transition-all duration-300 active:scale-95 focus:outline-none"
                        onClick={handleCloseButton}
                    >
                        Return to the main
                    </button>
                </div>
            </div>
        </div>
    );
};
