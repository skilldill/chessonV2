import { type FC, useEffect, useState } from "react";
import styles from "./DrawOfferActions.module.css";
import { ChessButton } from "../ChessButton/ChessButton";

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

    if (!shouldRender) {
        return null;
    }

    return (
        <div className="fixed bottom-14 left-0 right-0 z-50 flex items-center justify-center pb-8 pointer-events-none">
            <div 
                className={`w-[90%] bg-black/80 backdrop-blur-xl rounded-2xl p-[16px] border border-[#364153] flex flex-col items-center gap-4 pointer-events-auto ${isClosing ? styles.modalClosing : styles.modal}`}
            >
                <h2 className="text-white text-xl font-semibold mb-2">
                    Draw Offer
                </h2>
                <p className="text-gray-300 text-[16px] mb-4">
                    Your opponent offers a draw
                </p>
                <div className="w-full flex jsutify-center gap-4">
                    <ChessButton 
                        className="rounded-md text-sm font-semibold px-4 py-2 bg-[#4F39F6] text-white min-w-[126px] cursor-pointer transition-all duration-300 active:scale-95 focus:outline-none"
                        onClick={onAcceptDraw}
                    >
                        Accept
                    </ChessButton>
                    <ChessButton 
                        className="rounded-md text-sm font-semibold px-4 py-2 bg-gray-800 text-white min-w-[126px] cursor-pointer transition-all duration-300 active:scale-95 focus:outline-none"
                        onClick={onDeclineDraw}
                    >
                        Decline
                    </ChessButton>
                </div>
            </div>
        </div>
    );
};

