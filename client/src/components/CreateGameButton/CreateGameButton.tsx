import type { FC } from "react";

type CreateGameButtonProps = {
    title: string;
    subtitle: string;
    onClick: () => void;
}

export const CreateGameButton: FC<CreateGameButtonProps> = (props) => {
    const { title, subtitle, onClick } = props;

    return (
        <button 
            type="button"
            onClick={onClick}
            className="w-full flex justify-between p-[16px] rounded-xl text-white/90 border border-[#2D7A4F]/60 bg-[#2D7A4F]/20 hover:bg-[#2D7A4F]/30 transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer touch-manipulation"
        >
            <div>
                <p className="text-[22px] font-bold m-[0px] p-[0] text-left mb-[6px]">{title}</p>
                <p>{subtitle}</p>
            </div>
        </button>
    )
}
