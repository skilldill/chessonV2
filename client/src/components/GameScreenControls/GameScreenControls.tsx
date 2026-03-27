import { useState, type FC, useEffect } from "react";
import { PlasmaButton } from "../PlasmaButton/PlasmaButton"
import WhiteFlagPNG from "../../assets/white-flag.png";
import CrossMarkRedPNG from "../../assets/cross-mark.png";
import HandShakePNG from "../../assets/handshake.png";
import LightBlubPNG from "../../assets/light_bulb.png";
import cn from "classnames";
import styles from "./GameScreenControls.module.css";
import { useScreenSize } from "../../hooks/useScreenSize";

type RoundedControlButtonProps = {
    icon: string;
    active: boolean;
    disabled?: boolean;
    className?: string;
    onClick: () => void;
    onActiveClick: () => void;
}

const RoundedControlButton = ({ icon, active, disabled, onClick, onActiveClick, className = '' }: RoundedControlButtonProps) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        if (disabled) return;
        active ? onActiveClick() : onClick();
    }

    return (
        <button 
            className={cn(
                'min-w-[52px] min-h-[52px] rounded-full bg-black/60 backdrop-blur-xl flex items-center justify-center cursor-pointer border border-[#364153] transition-all duration-300 hover:scale-105 active:scale-95',
                { 'w-[56px] min-w-[56px] h-[56px] border-indigo-700': active },
                { 'opacity-60 cursor-not-allowed hover:scale-100 active:scale-100': disabled },
                className,
            )}
            onClick={handleClick}
            disabled={disabled}
        >
            <img src={icon} alt="Control Button" height={18} width={18} />
        </button>
    )
}

type GameScreenControlsProps = {
    gameEnded: boolean;
    withAIhints: boolean;
    loading?: boolean;

    onDrawOffer: () => void;
    onResignation: () => void;
    onQuitGame: () => void;
    onAIhints: () => void;
}

export const GameScreenControls: FC<GameScreenControlsProps> = ({ 
    gameEnded,
    withAIhints,
    loading = false,

    onDrawOffer, 
    onResignation, 
    onQuitGame,
    onAIhints,
}) => {
    const screenSize = useScreenSize();
    const [showButtons, setShowButtons] = useState(false);
    const [activeActionIndex, setActiveActionIndex] = useState<number>();

    const handleClickPlasmaButton = (event?: React.MouseEvent<HTMLButtonElement>) => {
        setShowButtons(!showButtons);
        setActiveActionIndex(undefined);
        event?.stopPropagation()
    }

    const hideButtons = () => {
        setShowButtons(false);
        setActiveActionIndex(undefined);
    }

    const handleNotActiveClick = (index: number) => {
        setActiveActionIndex(index);

        // const timeout = setTimeout(() => {
        //     setActiveActionIndex(undefined);
        //     clearTimeout(timeout);
        // }, 5000)
    }

    const handleResignation = () => {
        onResignation();
        hideButtons();
    }

    const handleQuitGame = () => {
        onQuitGame();
        hideButtons();
    }

    const handleDrawOffer = () => {
        onDrawOffer();
        hideButtons();
    }

    const handleAIhints = () => {
        if (loading) {
            return;
        }
        onAIhints();
        hideButtons();
    }

    useEffect(() => {
        window.addEventListener("click", hideButtons);
        return () => {
            window.removeEventListener("click", hideButtons);
        };
    }, []);

    return (
        <div className={`flex justify-center ${screenSize === "L" ? "py-[36px]" : "py-[28px]"} relative`}>
            <div className={cn("absolute top-0 w-full z-10 flex items-center justify-center gap-[28px] scale-0 transition-all duration-300", {
                "scale-100": showButtons,
                "top-[-44px]": showButtons,
                [styles.bounce]: showButtons,
            })}>
                {!gameEnded && (
                    <>
                        {withAIhints && (
                            <RoundedControlButton
                                icon={LightBlubPNG} 
                                onClick={() => handleNotActiveClick(0)}
                                onActiveClick={handleAIhints}
                                active={activeActionIndex === 0 || loading}
                                disabled={loading}
                            />
                        )}
                        <RoundedControlButton
                            icon={HandShakePNG} 
                            onClick={() => handleNotActiveClick(1)}
                            onActiveClick={handleDrawOffer}
                            active={activeActionIndex === 1}
                        />
                        <RoundedControlButton
                            icon={WhiteFlagPNG} 
                            onClick={() => handleNotActiveClick(2)}
                            onActiveClick={handleResignation}
                            active={activeActionIndex === 2}
                        />
                    </>
                )}
                <RoundedControlButton
                    icon={CrossMarkRedPNG} 
                    onClick={() => handleNotActiveClick(3)}
                    onActiveClick={handleQuitGame}
                    active={activeActionIndex === 3}
                />
            </div>
            <PlasmaButton loading={loading} active={!gameEnded} onClick={handleClickPlasmaButton} />
        </div>
    )
}
