import type { FC } from "react";

export const SettingProfileBlock: FC = () => {
    return (
        <div className="w-[456px] h-[452px] flex flex-col items-center py-12 gap-12">
            <h3 className="text-3xl font-semibold">Choose you're avatar</h3>
            
            <button className="rounded-md text-sm font-semibold px-4 py-2 bg-[#4F39F6] text-white min-w-[126px] cursor-pointer transition-all duration-300 active:scale-95">
                To play
            </button>
        </div>
    )
};
