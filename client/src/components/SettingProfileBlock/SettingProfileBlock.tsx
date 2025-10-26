import { useState, type FC } from "react";
import { MemAvatarSelect } from "../MemAvatarSelect/MemAvatarSelect";
import cn from 'classnames';

const MAX_NICKNAME_LENGTH = 10;

type SettingProfileBlockProps = {
    onToPlay: (profileData: { nickname: string, avatarIndex: number }) => void;
}

export const SettingProfileBlock: FC<SettingProfileBlockProps> = ({ onToPlay }) => {
    const [nickname, setNickname] = useState("");
    const [avatarIndex, setSelectedAvatarIndex] = useState(0);

    const [showAvatarSelect, setShowAvatarSelect] = useState(false);
    const [showNameInput, setShowNameInput] = useState(true);

    const handleNext = () => {
        if (nickname.trim()) {
            setShowNameInput(false);
            // Wait for fade-out animation to complete, then show avatar select
            setTimeout(() => {
                setShowAvatarSelect(true);
            }, 400);
        }
    };

    const handleSubmitForm = (event: React.FormEvent) => {
        event.preventDefault();
        handleNext();
    }

    const handleSelectAvatar = (index: number) => {
        setSelectedAvatarIndex(index);
    };

    const handleBackToNickname = () => {
        setShowAvatarSelect(false);
        // Wait for fade-out animation to complete, then show name input
        setTimeout(() => {
            setShowNameInput(true);
        }, 400);
    };

    const handleChangeNickname = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (value.length <= MAX_NICKNAME_LENGTH) {
            setNickname(value);
        }
    }

    const hanleToPlay = () => {
        onToPlay({ nickname, avatarIndex });
    }

    return (
        <div className="w-[472px] h-[452px] flex flex-col items-center py-12 gap-12 relative overflow-hidden">
            {/* Name Input Step */}
            <div 
                className={cn(
                    'absolute inset-0 flex flex-col items-center gap-12 py-12 transition-all duration-400 ease-in-out',
                    {
                        'opacity-100 translate-x-0 scale-100': showNameInput,
                        'opacity-0 -translate-x-[100px] scale-95 pointer-events-none': !showNameInput,
                    }
                )}
            >
                <h3 
                    className="text-3xl font-semibold transition-all duration-400"
                    style={{ opacity: showNameInput ? 1 : 0 }}
                >
                    Enter your name
                </h3>
                
                <form onSubmit={handleSubmitForm}>
                    <input
                        type="text"
                        value={nickname}
                        onChange={handleChangeNickname}
                        placeholder="Your name"
                        className="w-[300px] h-[40px] px-[12px] py-[10px] rounded-md focus:outline-none transition-all duration-200"
                        style={{
                            opacity: showNameInput ? 1 : 0,
                            transitionDelay: showNameInput ? '100ms' : '0ms',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            background: 'rgba(255, 255, 255, 0.08)'
                        }}
                    />
                </form>
                
                <button 
                    onClick={handleNext}
                    className="rounded-md text-sm font-semibold px-4 py-2 bg-[#4F39F6] text-white min-w-[126px] cursor-pointer transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ opacity: showNameInput ? 1 : 0 }}
                >
                    Next
                </button>
            </div>

            {/* Avatar Selection Step */}
            <div 
                className={cn(
                    'absolute inset-0 flex flex-col items-center gap-12 py-12 transition-all duration-400 ease-in-out',
                    {
                        'opacity-100 translate-x-0 scale-100': showAvatarSelect,
                        'opacity-0 translate-x-[100px] scale-95 pointer-events-none': !showAvatarSelect,
                    }
                )}
            >
                {/* Back Button */}
                <button
                    onClick={handleBackToNickname}
                    className="absolute left-0 top-0 mt-12 ml-8 w-10 h-10 flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-95"
                    style={{ opacity: showAvatarSelect ? 1 : 0 }}
                >
                    <svg
                        width="38" 
                        height="38" 
                        viewBox="0 0 28 28" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        className="transition-all duration-200 hover:opacity-70"
                    >
                        <path
                            d="M16 8L10 14L16 20" 
                            stroke="#fff" 
                            strokeWidth="2.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>

                <h3 
                    className="text-3xl font-semibold transition-all duration-400"
                    style={{ opacity: showAvatarSelect ? 1 : 0 }}
                >
                    Choose your avatar
                </h3>
                
                <div style={{ opacity: showAvatarSelect ? 1 : 0 }}>
                    <MemAvatarSelect onSelectAvatar={handleSelectAvatar} />
                </div>

                <button 
                    className="rounded-md text-sm font-semibold px-4 py-2 bg-[#4F39F6] text-white min-w-[126px] cursor-pointer transition-all duration-300 active:scale-95"
                    style={{ opacity: showAvatarSelect ? 1 : 0 }}
                    onClick={hanleToPlay}
                >
                    To play
                </button>
            </div>
        </div>
    )
};
