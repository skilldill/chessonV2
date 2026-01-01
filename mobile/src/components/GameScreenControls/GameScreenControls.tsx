import { useState, type FC, useEffect } from "react";
import { PlasmaButton } from "../PlasmaButton/PlasmaButton"
import WhiteFlagPNG from "../../assets/white-flag.png";
import CrossMarkRedPNG from "../../assets/cross-mark.png";
import HandShakePNG from "../../assets/handshake.png";
import cn from "classnames";
import styles from "./GameScreenControls.module.css";
import { useScreenSize } from "../../hooks/useScreenSize";

type RoundedControlButtonProps = {
    icon: string;
    active: boolean;
    onClick: () => void;
    onActiveClick: () => void;
}

const RoundedControlButton = ({ icon, active, onClick, onActiveClick }: RoundedControlButtonProps) => {
    const handleClick = (event: any) => {
        event.stopPropagation();
        active ? onActiveClick() : onClick();
    }

    return (
        <div
            className={cn(
                'min-w-[66px] min-h-[66px] bg-black/60 rounded-full backdrop-blur-xl flex items-center justify-center cursor-pointer border border-[#364153] transition-all duration-300 hover:scale-105 active:scale-95',
                { 'w-[70px] h-[70px] border-indigo-700': active }
            )}
            onClick={handleClick}
        >
            <img src={icon} alt="Control Button" height={22} width={22} />
        </div>
    );
}

type GameScreenControlsProps = {
    gameEnded: boolean;

    onDrawOffer: () => void;
    onResignation: () => void;
    onQuitGame: () => void;
}

export const GameScreenControls: FC<GameScreenControlsProps> = ({ 
    gameEnded,

    onDrawOffer, 
    onResignation, 
    onQuitGame, 
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
                        <RoundedControlButton
                            icon={HandShakePNG} 
                            onClick={() => handleNotActiveClick(0)}
                            onActiveClick={handleDrawOffer}
                            active={activeActionIndex === 0}
                        />
                        <RoundedControlButton
                            icon={WhiteFlagPNG} 
                            onClick={() => handleNotActiveClick(1)}
                            onActiveClick={handleResignation}
                            active={activeActionIndex === 1}
                        />
                    </>
                )}
                <RoundedControlButton
                    icon={CrossMarkRedPNG} 
                    onClick={() => handleNotActiveClick(2)}
                    onActiveClick={handleQuitGame}
                    active={activeActionIndex === 2}
                />
            </div>
            <PlasmaButton 
                active={!gameEnded} 
                onClick={handleClickPlasmaButton}
                size={screenSize}
            />
        </div>
    )
}