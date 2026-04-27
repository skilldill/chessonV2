import { useState, type FC, useEffect, type ReactNode } from "react";
import { PlasmaButton } from "../PlasmaButton/PlasmaButton"

import cn from "classnames";
import styles from "./GameScreenControls.module.css";
import { useScreenSize } from "../../hooks/useScreenSize";

type RoundedControlButtonProps = {
    children: ReactNode;
    disabled?: boolean;
    className?: string;
    iconSize?: number;
    tooltip?: string;
    onClick: () => void;

    // TODO: deprecated
    active?: boolean;
    onActiveClick?: () => void;
}

const RoundedControlButton = ({ children, disabled, onClick, className = '', tooltip }: RoundedControlButtonProps) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        if (disabled) return;
        onClick();
    }

    return (
        <div className="relative">
            <button
                className={cn(
                    'min-w-[52px] min-h-[52px] rounded-full bg-black/60 backdrop-blur-xl flex items-center justify-center cursor-pointer border border-[#364153] transition-all duration-300 hover:scale-105 active:scale-95',
                    { 'opacity-60 cursor-not-allowed hover:scale-100 active:scale-100': disabled },
                    className,
                )}
                onClick={handleClick}
                disabled={disabled}
            >
                {children}
            </button>
            <div className="absolute flex justify-center items-center w-full pt-[4px]">
                <span className="text-xs text-center text-white/50">
                    {tooltip}
                </span>
            </div>
        </div>
    )
}

type ControlProps = {
    content: ReactNode;
    onClick?: () => void;
    tooltip?: string;
    withoutApprove?: boolean;
    approveText?: string;
}

type GameScreenControlsProps = {
    isNotActive?: boolean;
    loading?: boolean;
    notify?: { text: string };

    controls: ControlProps[];
    highlightsControls: ControlProps[];
    notActiveControls: ControlProps[];

    // ПОка что так
    offeredDraw?: boolean;
    onAcceptDraw: () => void;
    onDeclineDraw: () => void;
}

export const GameScreenControls: FC<GameScreenControlsProps> = ({
    isNotActive,
    loading = false,
    notify,

    controls,
    highlightsControls,
    notActiveControls,

    //
    offeredDraw,
    onAcceptDraw,
    onDeclineDraw,
}) => {
    const screenSize = useScreenSize();
    const [showButtons, setShowButtons] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showNotify, setShowNotify] = useState(false);

    const [activeAction, setActiveAction] = useState<ControlProps>();
    const [showConfirm, setShowConfirm] = useState(false);
    const [showDrawOffer, setShowDrawOffer] = useState(false);

    const handleClickPlasmaButton = (event?: React.MouseEvent<HTMLButtonElement>) => {
        if (showOnboarding) {
            setShowOnboarding(false);
        };

        if (showConfirm) {
            setShowConfirm(false);
            event?.stopPropagation();
            return;
        }

        if (showDrawOffer) {
            onDeclineDraw();
            setShowDrawOffer(false);
            event?.stopPropagation();
            return;
        }

        setShowButtons(!showButtons);
        event?.stopPropagation()
    }

    const hideButtons = () => {
        setShowButtons(false);
    }

    const handleClick = (control: ControlProps) => {
        if (control.withoutApprove) {
            control.onClick?.();
            hideButtons();
            return;
        }

        setActiveAction(control);
        setShowConfirm(true);
        hideButtons();
    }

    const handleCancel = () => {
        setShowConfirm(false);
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

    useEffect(() => {
        if (offeredDraw) {
            setShowDrawOffer(true);
            setShowButtons(false);
            setShowConfirm(false);
            setActiveAction(undefined);
        } else {
            setShowDrawOffer(false);
        }
    }, [offeredDraw])

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
                "scale-120": showConfirm,
                "top-[-84px]": showConfirm,
                [styles.bounce]: showConfirm,
            })}>
                <div
                    className={cn(
                        'min-h-[52px] py-[12px] px-[12px] whitespace-nowrap rounded-[26px] bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center gap-[20px] cursor-pointer border border-[#364153] transition-all duration-200 hover:scale-105 active:scale-100',
                    )}
                >
                    <span className="text-sm">
                        {activeAction && activeAction?.approveText}
                    </span>
                    <div className="flex gap-4">
                        <button
                            className="rounded-full text-xs font-semibold px-2 py-1 bg-[#4F39F6] text-white min-w-[100px] cursor-pointer transition-all duration-300 active:scale-95 focus:outline-none"
                            onClick={() => activeAction?.onClick?.()}
                        >
                            Ок
                        </button>
                        <button
                            className="rounded-full text-xs font-semibold px-2 py-1 bg-gray-800 text-white min-w-[100px] cursor-pointer transition-all duration-300 active:scale-95 focus:outline-none"
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>

            {/* ЭТО КОСТЫЛЬ, ПОЗЖЕ ПЕРЕДЕЛАТЬ НА ОБЩИЙ CONFIRM */}
            <div className={cn("absolute top-0 w-full z-10 flex items-center justify-center gap-[28px] scale-0 transition-all duration-300", {
                "scale-120": offeredDraw,
                "top-[-124px]": offeredDraw,
                [styles.bounce]: offeredDraw,
            })}>
                <div
                    className={cn(
                        'min-h-[52px] py-[12px] px-[12px] whitespace-nowrap rounded-[26px] bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center gap-[10px] cursor-pointer border border-[#364153] transition-all duration-200 hover:scale-105 active:scale-100',
                    )}
                >
                    <h2 className="text-white text-xl font-semibold mb-[0px]">
                        Draw Offer
                    </h2>
                    <p className="text-gray-300 text-sm mb-[10px] mt-[0px]">
                        Your opponent offers a draw
                    </p>
                    <div className="flex gap-4">
                        <button
                            className="rounded-full text-xs font-semibold px-2 py-1 bg-[#4F39F6] text-white min-w-[100px] cursor-pointer transition-all duration-300 active:scale-95 focus:outline-none"
                            onClick={onAcceptDraw}
                        >
                            Accept
                        </button>
                        <button
                            className="rounded-full text-xs font-semibold px-2 py-1 bg-gray-800 text-white min-w-[100px] cursor-pointer transition-all duration-300 active:scale-95 focus:outline-none"
                            onClick={onDeclineDraw}
                        >
                            Decline
                        </button>
                    </div>
                </div>
            </div>

            <div className={cn("absolute top-0 w-full z-10 flex items-center justify-center gap-[36px] scale-0 transition-all duration-300", {
                "scale-120": showOnboarding,
                "top-[-54px]": showOnboarding,
                [styles.bounce]: showOnboarding,
            })}>
                {highlightsControls.map(({ content, tooltip }, i) =>
                    <RoundedControlButton
                        key={`highlightControls_${i}`}
                        onClick={() => { }}
                        onActiveClick={() => { }}
                        disabled={loading}
                        tooltip={tooltip}
                    >{content}</RoundedControlButton>
                )}
            </div>

            <div className={cn("absolute top-0 w-full z-10 flex items-center justify-center gap-[36px] scale-0 transition-all duration-300", {
                "scale-100": showButtons,
                "top-[-54px]": showButtons,
                [styles.bounce]: showButtons,
            })}>
                {isNotActive && notActiveControls.map((control, i) =>
                    <RoundedControlButton
                        key={`notActoveControl_${i}`}
                        onClick={() => handleClick(control)}
                        tooltip={control.tooltip}
                    >{control.content}</RoundedControlButton>
                )}

                {!isNotActive && controls.map((control, i) =>
                    <RoundedControlButton
                        key={`control_${i}`}
                        onClick={() => handleClick(control)}
                        tooltip={control.tooltip}
                    >{control.content}</RoundedControlButton>
                )}
            </div>
            <PlasmaButton loading={loading} active={!isNotActive} onClick={handleClickPlasmaButton} />
        </div>
    )
}
