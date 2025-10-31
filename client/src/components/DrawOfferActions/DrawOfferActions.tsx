import { type FC, useEffect, useState } from "react";
import { PlasmaButton } from "../PlasmaButton/PlasmaButton";
import styles from "./DrawOfferActions.module.css";

type DrawOfferActionsProps = {
    offeredDraw?: boolean;
    onAcceptDraw: () => void;
    onDeclineDraw: () => void;
}

export const DrawOfferActions: FC<DrawOfferActionsProps> = ({ 
    offeredDraw,
    onAcceptDraw,
    onDeclineDraw 
}) => {
    const [isClosing, setIsClosing] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        if (offeredDraw) {
            setIsClosing(false);
            setShouldRender(true);
        } else if (shouldRender) {
            setIsClosing(true);
            const timer = setTimeout(() => {
                setShouldRender(false);
            }, 300); // Длительность анимации
            return () => clearTimeout(timer);
        }
    }, [offeredDraw, shouldRender]);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onDeclineDraw();
        }
    };

    const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
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
                className={`bg-black/80 backdrop-blur-xl rounded-2xl p-8 border border-[#364153] flex flex-col items-center gap-4 ${isClosing ? styles.modalClosing : styles.modal}`}
                onClick={handleModalClick}
            >
                <h2 className="text-white text-xl font-semibold mb-2">
                    Предложение ничьей
                </h2>
                <p className="text-gray-300 text-sm mb-4">
                    Соперник предлагает ничью
                </p>
                <div className="flex gap-4">
                    <PlasmaButton onClick={onAcceptDraw}>
                        Принять
                    </PlasmaButton>
                    <PlasmaButton onClick={onDeclineDraw}>
                        Отклонить
                    </PlasmaButton>
                </div>
            </div>
        </div>
    );
};

