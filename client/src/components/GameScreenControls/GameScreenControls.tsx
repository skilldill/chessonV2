import { useState, type FC, useEffect } from "react";
import { PlasmaButton } from "../PlasmaButton/PlasmaButton"
import WhiteFlagPNG from "../../assets/white-flag.png";
import CrossMarkRedPNG from "../../assets/cross-mark.png";
import HandShakePNG from "../../assets/handshake.png";
import AiIconPNG from "../../assets/ai-icon.png";
import cn from "classnames";
import styles from "./GameScreenControls.module.css";
import { useScreenSize } from "../../hooks/useScreenSize";

type RoundedControlButtonProps = {
    icon?: string;
    emoji?: string;
    active: boolean;
    disabled?: boolean;
    className?: string;
    iconSize?: number;

    onClick: () => void;
    onActiveClick: () => void;
}

const RoundedControlButton = ({ icon, emoji, active, disabled, onClick, onActiveClick, className = '', iconSize = 18 }: RoundedControlButtonProps) => {
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
            {icon ? (
                <img src={icon} alt="Control Button" height={iconSize} width={iconSize} />
            ) : (
                <span className="text-[22px] leading-none select-none">{emoji || '⬅️'}</span>
            )}
        </button>
    )
}

type GameScreenControlsProps = {
    gameEnded: boolean;
    withAIhints: boolean;
    rollbackInsteadOfDraw?: boolean;
    loading?: boolean;
    showOnboardingAIhint: boolean;
    notify?: { text: string };

    onDrawOffer: () => void;
    onRollbackPlayerMove?: () => void;
    onResignation: () => void;
    onQuitGame: () => void;
    onAIhints: () => void;
}

export const GameScreenControls: FC<GameScreenControlsProps> = ({ 
    gameEnded,
    withAIhints,
    rollbackInsteadOfDraw = false,
    loading = false,
    showOnboardingAIhint = false,
    notify,

    onDrawOffer, 
    onRollbackPlayerMove,
    onResignation, 
    onQuitGame,
    onAIhints,
}) => {
    const screenSize = useScreenSize();
    const [showButtons, setShowButtons] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [activeActionIndex, setActiveActionIndex] = useState<number>();
    const [showNotify, setShowNotify] = useState(false);

    const handleClickPlasmaButton = (event?: React.MouseEvent<HTMLButtonElement>) => {
        if (showOnboarding) {
            setShowOnboarding(false);
        };

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

    const handleRollbackPlayerMove = () => {
        console.log('ROLLBACK');

        onRollbackPlayerMove?.();
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

    useEffect(() => {
        if (!gameEnded && showOnboardingAIhint) {
            setTimeout(() => {
                setShowOnboarding(true);
            }, 1000)
            setTimeout(() => {
                setShowOnboarding(false);
            }, 3000)
        }
    }, [showOnboardingAIhint, gameEnded])

    useEffect(() => {
        if (!notify || notify.text.length === 0) return;

        setShowNotify(true);

        setTimeout(() => {
            setShowNotify(false);
        }, 3000)
    }, [notify])

    return (
        <div className={`flex justify-center ${screenSize === "L" ? "py-[36px]" : "py-[28px]"} relative`}>
            
            <div className={cn("absolute top-0 w-full z-10 flex items-center justify-center gap-[28px] scale-0 transition-all duration-300", {
                "scale-120": showNotify,
                "top-[-44px]": showNotify,
                [styles.bounce]: showNotify,
            })}>
                <div 
                    className={cn(
                        'min-h-[52px] px-[12px] whitespace-nowrap rounded-[26px] bg-black/60 backdrop-blur-xl flex items-center justify-center cursor-pointer border border-[#364153] transition-all duration-300 hover:scale-105 active:scale-95',
                        // { 'w-[56px] min-w-[56px] h-[56px] border-indigo-700': active },
                        // { 'opacity-60 cursor-not-allowed hover:scale-100 active:scale-100': disabled },
                        // className,
                    )}
                >
                    <span className="text-sm">
                        {notify && notify.text}
                    </span>
                </div>
            </div>

            <div className={cn("absolute top-0 w-full z-10 flex items-center justify-center gap-[28px] scale-0 transition-all duration-300", {
                "scale-120": showOnboarding,
                "top-[-54px]": showOnboarding,
                [styles.bounce]: showOnboarding,
            })}>
                <RoundedControlButton
                    icon={AiIconPNG}
                    onClick={() => {}}
                    onActiveClick={() => {}}
                    active={false}
                    iconSize={22}
                    disabled={loading}
                />
            </div>

            <div className={cn("absolute top-0 w-full z-10 flex items-center justify-center gap-[28px] scale-0 transition-all duration-300", {
                "scale-100": showButtons,
                "top-[-44px]": showButtons,
                [styles.bounce]: showButtons,
            })}>
                {!gameEnded && (
                    <>
                        {withAIhints && (
                            <RoundedControlButton
                                icon={AiIconPNG} 
                                onClick={() => handleNotActiveClick(0)}
                                onActiveClick={handleAIhints}
                                active={activeActionIndex === 0 || loading}
                                iconSize={22}
                                disabled={loading}
                            />
                        )}
                        {!rollbackInsteadOfDraw && (
                            <RoundedControlButton
                                icon={HandShakePNG} 
                                onClick={() => handleNotActiveClick(1)}
                                onActiveClick={handleDrawOffer}
                                active={activeActionIndex === 1}
                                iconSize={20}
                            />
                        )}
                        {rollbackInsteadOfDraw && (
                            <RoundedControlButton
                                emoji="⬅️"
                                onClick={() => handleNotActiveClick(1)}
                                onActiveClick={handleRollbackPlayerMove}
                                active={activeActionIndex === 1}
                            />
                        )}
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
                    iconSize={16}
                />
            </div>
            <PlasmaButton loading={loading} active={!gameEnded} onClick={handleClickPlasmaButton} />
        </div>
    )
}
