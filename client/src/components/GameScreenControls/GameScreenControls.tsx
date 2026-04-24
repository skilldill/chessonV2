import { useState, type FC, useEffect, type ReactNode } from "react";
import { PlasmaButton } from "../PlasmaButton/PlasmaButton"

import cn from "classnames";
import styles from "./GameScreenControls.module.css";
import { useScreenSize } from "../../hooks/useScreenSize";

type RoundedControlButtonProps = {
    children: ReactNode;
    active: boolean;
    disabled?: boolean;
    className?: string;
    iconSize?: number;
    tooltip?: string;

    onClick: () => void;
    onActiveClick: () => void;
}

const RoundedControlButton = ({ children, active, disabled, onClick, onActiveClick, className = '' }: RoundedControlButtonProps) => {
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
            {children}
        </button>
    )
}

type GameScreenControlsProps = {
    isNotActive?: boolean;
    loading?: boolean;
    notify?: { text: string };

    controls: { content: ReactNode, onClick?: () => void, tooltip?: string }[];
    highlightsControls: { content: ReactNode, onClick?: () => void, tooltip?: string }[];
    notActiveControls: { content: ReactNode, onClick?: () => void, tooltip?: string }[];
}

export const GameScreenControls: FC<GameScreenControlsProps> = ({ 
    isNotActive,
    loading = false,
    notify,

    controls,
    highlightsControls,
    notActiveControls,
}) => {
    const screenSize = useScreenSize();
    const [showButtons, setShowButtons] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [activeActionIndex, setActiveActionIndex] = useState<string>();
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

    const handleNotActiveClick = (index: string) => {
        setActiveActionIndex(index);
    }

    useEffect(() => {
        window.addEventListener("click", hideButtons);
        return () => {
            window.removeEventListener("click", hideButtons);
        };
    }, []);

    useEffect(() => {
        if (!isNotActive) {
            setTimeout(() => {
                setShowOnboarding(true);
            }, 1000)
            setTimeout(() => {
                setShowOnboarding(false);
            }, 3000)
        }
    }, [isNotActive])

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
                {highlightsControls.map(({ content, tooltip }, i) => 
                    <RoundedControlButton
                        key={`highlightControls_${i}`}
                        onClick={() => {}}
                        onActiveClick={() => {}}
                        active={false}
                        disabled={loading}
                        tooltip={tooltip}
                    >{content}</RoundedControlButton> 
                )}
            </div>

            <div className={cn("absolute top-0 w-full z-10 flex items-center justify-center gap-[28px] scale-0 transition-all duration-300", {
                "scale-100": showButtons,
                "top-[-44px]": showButtons,
                [styles.bounce]: showButtons,
            })}>
                {isNotActive && notActiveControls.map(({ content, onClick, tooltip }, i) => 
                    <RoundedControlButton
                        key={`notActoveControl_${i}`}
                        onClick={() => handleNotActiveClick(`notActoveControl_${i}`)}
                        onActiveClick={() => { onClick?.(); hideButtons(); }}
                        active={activeActionIndex === `notActoveControl_${i}`}
                        tooltip={tooltip}
                    >{content}</RoundedControlButton>
                )}

                {!isNotActive && controls.map(({ content, onClick, tooltip }, i) => 
                    <RoundedControlButton
                        key={`control_${i}`}
                        onClick={() => handleNotActiveClick(`control_${i}`)}
                        onActiveClick={() => { onClick?.(); hideButtons(); }}
                        active={activeActionIndex === `control_${i}`}
                        tooltip={tooltip}
                    >{content}</RoundedControlButton>
                )}
            </div>
            <PlasmaButton loading={loading} active={!isNotActive} onClick={handleClickPlasmaButton} />
        </div>
    )
}
