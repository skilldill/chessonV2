import { useState, type FC, useEffect } from "react";
import { PlasmaButton } from "../PlasmaButton/PlasmaButton"
import WhiteFlagPNG from "../../assets/white-flag.png";
import CrossMarkRedPNG from "../../assets/cross-mark.png";
import HandShakePNG from "../../assets/handshake.png";
import cn from "classnames";
import styles from "./GameScreenControls.module.css";

const RoundedControlButton = ({ icon, onClick }: { icon: string, onClick: () => void }) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        onClick();
    }
    return (
        <button 
            className="w-[52px] h-[52px] rounded-full bg-black/60 backdrop-blur-xl flex items-center justify-center cursor-pointer border border-[#364153] transition-all duration-300 hover:scale-105 active:scale-95" 
            onClick={handleClick}
        >
            <img src={icon} alt="Control Button" height={18} width={18} />
        </button>
    )
}

type GameScreenControlsProps = {
    onDrawOffer: () => void;
    onResignation: () => void;
    onQuitGame: () => void;
}

export const GameScreenControls: FC<GameScreenControlsProps> = ({ onDrawOffer, onResignation, onQuitGame }) => {
    const [showButtons, setShowButtons] = useState(false);

    const handleClickPlasmaButton = (event?: React.MouseEvent<HTMLButtonElement>) => {
        setShowButtons(!showButtons);
        event?.stopPropagation()
    }

    const hideButtons = () => {
        setShowButtons(false);
    }

    useEffect(() => {
        window.addEventListener("click", hideButtons);
        return () => {
            window.removeEventListener("click", hideButtons);
        };
    }, []);
    return (
        <div className="flex justify-center py-[28px] relative">
            <div className={cn("absolute top-0 w-full z-10 flex items-center justify-center gap-[28px] scale-0 transition-all duration-300", {
                "scale-100": showButtons,
                "top-[-44px]": showButtons,
                [styles.bounce]: showButtons,
            })}>
                <RoundedControlButton icon={HandShakePNG} onClick={onDrawOffer} />
                <RoundedControlButton icon={WhiteFlagPNG} onClick={onResignation} />
                <RoundedControlButton icon={CrossMarkRedPNG} onClick={onQuitGame} />
            </div>
            <PlasmaButton onClick={handleClickPlasmaButton} />
        </div>
    )
}