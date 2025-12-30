import { useState, type FC } from "react";
import { MEM_AVATARS_GRID } from "../../constants/avatars";
import cn from 'classnames';

type MemAvatarSelectProps = {
    onSelectAvatar: (index: number) => void;
}

export const MemAvatarSelect: FC<MemAvatarSelectProps> = ({ onSelectAvatar }) => {
    const [selected, setSelected] = useState<number | undefined>(0);
    const [prevSelected, setPrevSelected] = useState<number>(0);

    const selectAvatar = (index: number) => {
        setPrevSelected(selected!);
        setSelected(undefined);

        setTimeout(() => {
            setSelected(index);
        }, 400);

        onSelectAvatar(index);
    }

    return (
        <div className="w-full flex flex-col gap-[24px]">
            {MEM_AVATARS_GRID.map((row, rowIndex) => (
                <div key={'row_' + rowIndex} className="flex justify-between">
                    {row.map((avatar, avatarIndex) =>
                        <div 
                            key={`avatar_${rowIndex}_${avatarIndex}`}
                            onClick={() => selectAvatar(((rowIndex * row.length) + avatarIndex))}
                            className="w-[64px] h-[64px] flex justify-center items-center relative"
                        >
                            <img
                                src={avatar}
                                alt={`Avatar ${avatarIndex + 1}`}
                                className={cn("rounded-full cursor-pointer transition-all duration-200 active:scale-95", {
                                    'w-[51px] h-[51px]': selected === ((rowIndex * row.length) + avatarIndex),
                                    'w-[64px] h-[64px]': selected !== ((rowIndex * row.length) + avatarIndex),
                                })}
                            />
                        
                            <div className="absolute w-[64px] h-[64px] rounded-full">
                                <svg className="w-full h-full" viewBox="0 0 112 112">
                                    <circle
                                        cx="56"
                                        cy="56"
                                        r="54"
                                        fill="none"
                                        stroke="url(#gradient)"
                                        strokeLinecap="round"
                                        strokeWidth="3"
                                        strokeDasharray="339.29"
                                        strokeDashoffset="0"
                                        className="transition-all duration-400"
                                        style={{
                                            transform: 'rotate(-90deg)',
                                            transformOrigin: 'center',
                                            strokeDashoffset: selected === ((rowIndex * row.length) + avatarIndex) ? "0" : "339.29"
                                        }}
                                    />
                                    <defs>
                                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#4F39F6" />
                                            <stop offset="100%" stopColor="#57C3FF" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
