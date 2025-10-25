import { useState, type FC } from "react";
// Импорт аватаров
import Cat1PNG from "../../assets/avatars/cat_1.png";
import Cat2PNG from "../../assets/avatars/cat_2.png";
import Cat3PNG from "../../assets/avatars/cat_3.png";
import Cat4PNG from "../../assets/avatars/cat_4.png";
import Cat5PNG from "../../assets/avatars/cat_5.png";
import Cat6PNG from "../../assets/avatars/cat_6.png";
import Cat7PNG from "../../assets/avatars/cat_7.png";
import Cat8PNG from "../../assets/avatars/cat_8.png";

// Все изображения для предзагрузки (вынесено за пределы компонента)
const ALL_IMAGES = [
  // Аватары
  Cat1PNG,
  Cat2PNG,
  Cat3PNG,
  Cat4PNG,
  Cat5PNG,
  Cat6PNG,
  Cat7PNG,
  Cat8PNG,
];

export const MemAvatarSelect: FC = () => {
    const [selected, setSelected] = useState<number | undefined>(0);
    const [prevSelected, setPrevSelected] = useState<number>(0);

    const selectAvatar = (index: number) => {
        setPrevSelected(selected!);
        setSelected(undefined);

        setTimeout(() => {
            setSelected(index);
        }, 400)
    }

    return (
        <div className="w-[456px] h-[452px] flex flex-col items-center py-12 gap-12">
            <h3 className="text-3xl font-semibold">Choose you're avatar</h3>
            <div className="grid grid-cols-4 grid-rows-2 gap-[24px] relative">
                <div 
                    className="absolute w-[112px] h-[112px] rounded-full"
                    style={{
                        transform: selected !== undefined ? `translate(${(selected % 4) * (96 + 24) - 8}px, ${Math.floor(selected / 4) * (96 + 24) - 8}px)` : `translate(${(prevSelected % 4) * (96 + 24) - 8}px, ${Math.floor(prevSelected / 4) * (96 + 24) - 8}px)`,
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
                                strokeWidth="2"
                                strokeDasharray="339.29"
                                strokeDashoffset="0"
                                className="transition-all duration-400"
                                style={{
                                    transform: 'rotate(-90deg)',
                                    transformOrigin: 'center',
                                    strokeDashoffset: selected !== undefined ? "0" : "339.29"
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

                {ALL_IMAGES.map((src, index) => (
                    <img 
                        key={index}
                        onClick={() => selectAvatar(index)}
                        src={src}
                        alt={`Avatar ${index + 1}`}
                        className="w-[96px] h-[96px] rounded-full  cursor-pointer transition-all duration-200 active:scale-95"
                    />
                ))}
            </div>
            <button className="rounded-md text-sm font-semibold px-4 py-2 bg-[#4F39F6] text-white min-w-[126px] cursor-pointer transition-all duration-200 active:scale-95">
                To play
            </button>
        </div>
    )
}