import { useState, useEffect, type FC } from "react";
import { MEM_AVATARS } from "../../constants/avatars";

type MemAvatarSelectProps = {
    onSelectAvatar: (index: number) => void;
    initialSelected?: number;
}

export const MemAvatarSelect: FC<MemAvatarSelectProps> = ({ onSelectAvatar, initialSelected = 0 }) => {
    const [selected, setSelected] = useState<number>(initialSelected);
    const [_, setPrevSelected] = useState<number>(initialSelected);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        setSelected(initialSelected);
        setPrevSelected(initialSelected);
        setIsAnimating(false);
    }, [initialSelected]);

    const selectAvatar = (index: number) => {
        if (index === selected) return;
        
        const currentSelected = selected;
        setPrevSelected(currentSelected);
        setIsAnimating(true);
        setSelected(index);

        setTimeout(() => {
            setIsAnimating(false);
        }, 400);

        onSelectAvatar(index);
    }

    return (
        <div className="grid grid-cols-[repeat(4,_64px)] grid-rows-2 gap-[24px] relative">
            <div
                className="absolute w-[80px] h-[80px] rounded-full transition-transform duration-400"
                style={{
                    transform: `translate(${(selected % 4) * (64 + 24) - 8}px, ${Math.floor(selected / 4) * (64 + 24) - 8}px)`,
                }}
            >
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
                            strokeDashoffset: isAnimating ? "339.29" : "0"
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

            {MEM_AVATARS.map((src, index) => (
                <img
                    key={index}
                    onClick={() => selectAvatar(index)}
                    src={src}
                    alt={`Avatar ${index + 1}`}
                    className="w-[64px] h-[64px] rounded-full  cursor-pointer transition-all duration-200 active:scale-95"
                />
            ))}
        </div>
    )
}
