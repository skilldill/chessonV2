import { useState, type FC, useEffect } from "react";
import { PlasmaButton } from "../PlasmaButton/PlasmaButton"
import WhiteFlagPNG from "../../assets/white-flag.png";
import CrossMarkRedPNG from "../../assets/cross-mark.png";
import HandShakePNG from "../../assets/handshake.png";
import RobotEmojiWebp from "../../assets/robot-emoji.webp";
import AiIconPNG from "../../assets/ai-icon.png";
import cn from "classnames";
import styles from "./GameScreenControls.module.css";
import { useScreenSize } from "../../hooks/useScreenSize";

type RoundedControlButtonProps = {
    icon: string;
    active: boolean;
    disabled?: boolean;
    onClick: () => void;
    onActiveClick: () => void;
}

const RoundedControlButton = ({ icon, active, disabled, onClick, onActiveClick }: RoundedControlButtonProps) => {
    const handleClick = (event: any) => {
        event.stopPropagation();
        if (disabled) return;
        active ? onActiveClick() : onClick();
    }

    return (
        <div
            className={cn(
                'min-w-[66px] min-h-[66px] bg-black/60 rounded-full backdrop-blur-xl flex items-center justify-center cursor-pointer border border-[#364153] transition-all duration-300 hover:scale-105 active:scale-95',
                { 'w-[70px] h-[70px] border-indigo-700': active },
                { 'opacity-60 cursor-not-allowed hover:scale-100 active:scale-100': disabled }
            )}
            onClick={handleClick}
        >
            <img src={icon} alt="Control Button" height={22} width={22} />
        </div>
    );
}

type GameScreenControlsProps = {
    gameEnded: boolean;
    withAIhints: boolean;
    loadingAIhint?: boolean;

    onDrawOffer: () => void;
    onResignation: () => void;
    onQuitGame: () => void;
    onAIhints: () => void;
}

export const GameScreenControls: FC<GameScreenControlsProps> = ({ 
    gameEnded,
    withAIhints,
    loadingAIhint = false,

    onDrawOffer, 
    onResignation, 
    onQuitGame, 
    onAIhints,
}) => {
    const [showButtons, setShowButtons] = useState(false);
    const [activeActionIndex, setActiveActionIndex] = useState<number>();

    const screenSize = useScreenSize();

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
        if (loadingAIhint) {
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
        <div className={`w-full flex justify-center relative`}>
            <div className={cn("absolute top-0 w-full z-10 flex items-center justify-center gap-[28px] scale-0 transition-all duration-300", {
                "scale-100": showButtons,
                "top-[-100px]": showButtons,
                [styles.bounce]: showButtons,
            })}>
                {!gameEnded && (
                    <>
                        {withAIhints && (
                            <RoundedControlButton
                                icon={AiIconPNG}
                                onClick={() => handleNotActiveClick(0)}
                                onActiveClick={handleAIhints}
                                active={activeActionIndex === 0 || loadingAIhint}
                                disabled={loadingAIhint}
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
            <PlasmaButton 
                active={!gameEnded} 
                onClick={handleClickPlasmaButton}
                loading={loadingAIhint}
                size={screenSize}
            />
        </div>
    )
}
