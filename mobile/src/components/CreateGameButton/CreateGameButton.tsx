import type { FC } from "react";

type CreateGameButtonTheme = "success" | "primary" | "neutral";

type CreateGameButtonProps = {
    title: string;
    subtitle: string;
    onClick: () => void;
    theme?: CreateGameButtonTheme;
    disabled?: boolean;
    className?: string;
}

export const CreateGameButton: FC<CreateGameButtonProps> = (props) => {
    const {
        title,
        subtitle,
        onClick,
        theme = "primary",
        disabled = false,
        className = "",
    } = props;

    const themeClasses = theme === "success"
        ? "border-white/10 bg-[linear-gradient(135deg,rgba(45,122,79,0.32)_0%,rgba(45,122,79,0.06)_100%)] hover:bg-[linear-gradient(135deg,rgba(45,122,79,0.22)_0%,rgba(45,122,79,0.10)_100%)]"
        : theme === "primary"
            ? "border-white/10 bg-[linear-gradient(135deg,rgba(79,57,246,0.32)_0%,rgba(79,57,246,0.06)_100%)] hover:bg-[linear-gradient(135deg,rgba(79,57,246,0.22)_0%,rgba(79,57,246,0.10)_100%)]"
            : "border-white/10 bg-white/4 hover:bg-white/8";

    return (
        <div 
            onClick={onClick}
            className={`w-full flex justify-between p-[16px] rounded-xl text-white/90 border transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed [border-top-color:rgba(255,255,255,0.1)] [border-left-color:rgba(255,255,255,0.1)] [border-right-color:rgba(255,255,255,0.03)] [border-bottom-color:rgba(255,255,255,0.03)] ${themeClasses} ${className}`}
        >
            <div>
                <p className="text-[18px] font-bold m-[0px] p-[0] text-left mb-[6px]">{title}</p>
                <p className="text-left">{subtitle}</p>
            </div>
        </div>
    )
}
