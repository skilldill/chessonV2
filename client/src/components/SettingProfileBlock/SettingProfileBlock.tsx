import { useState, type FC } from "react";
import { MemAvatarSelect } from "../MemAvatarSelect/MemAvatarSelect";
import cn from 'classnames';
import styles from './SettingProfileBlock.module.css';

const MAX_NICKNAME_LENGTH = 10;

type SettingProfileBlockProps = {
    onToPlay: (profileData: { nickname: string, avatarIndex: number }) => void;
    onClose: () => void;
}

export const SettingProfileBlock: FC<SettingProfileBlockProps> = ({ onToPlay, onClose }) => {
    const [nickname, setNickname] = useState("");
    const [avatarIndex, setSelectedAvatarIndex] = useState(0);

    const handleSelectAvatar = (index: number) => {
        setSelectedAvatarIndex(index);
    };

    const handleChangeNickname = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (value.length <= MAX_NICKNAME_LENGTH) {
            setNickname(value);
        }
    }

    const hanleToPlay = () => {
        if (!nickname) {
            return;
        }
        onToPlay({ nickname, avatarIndex });
    }

    const handleClose = () => {
        onClose();
    }

    return (
        <div className="w-[432px] h-[580px] relative rounded-xl border-[1px] border-[#364153] rounded-3xl overflow-hidden">
            <div 
                className={cn("w-[348px] h-[348px] rounded-full absolute top-[-174px] left-[-104px] bg-[#155DFC] z-30 blur-[200px]", styles.glowIn)} 
            />
            
            
            <div className="w-full h-full flex flex-col items-center absolute top-0 left-0 gap-[48px] z-40 py-[32px]">

                <div className="w-full flex justify-end px-[32px]">
                    <button 
                        type="button"
                        aria-label="Close"
                        className="w-[24px] h-[24px] flex items-center justify-center bg-transparent border-none p-0 m-0 cursor-pointer active:scale-95 active:opacity-80 transition-all duration-300"
                        style={{ outline: "none" }}
                        onClick={handleClose}
                    >
                        <svg 
                            width="16" 
                            height="16" 
                            viewBox="0 0 13.5 13.5" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <line 
                                x1="2" y1="2" x2="11.5" y2="11.5" 
                                stroke="white" 
                                strokeWidth="2"
                                strokeLinecap="round" 
                            />
                            <line 
                                x1="2" y1="11.5" x2="11.5" y2="2" 
                                stroke="white" 
                                strokeWidth="2"
                                strokeLinecap="round" 
                            />
                        </svg>
                    </button>
                </div>

                <h3 className="text-white text-center text-3xl font-semibold">
                    Input your name <br/> and choice avatar
                </h3>
                <form onSubmit={(event) => event.preventDefault()}>
                    <div className="relative w-[328px]">
                        <input
                            type="text"
                            value={nickname}
                            onChange={handleChangeNickname}
                            placeholder="Your name"
                            className="bg-white/4 w-full h-[40px] px-[12px] py-[10px] border border-white/10 border-solid rounded-md focus:border-indigo-700 focus:outline-none transition-all duration-200 pr-10 placeholder-[#99A1AF]"
                        />
                        {nickname && (
                            <button
                                type="button"
                                aria-label="Clear"
                                onClick={() => handleChangeNickname({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
                                className="absolute top-1/2 right-3 transform -translate-y-1/2 w-4 h-4 flex items-center justify-center bg-transparent border-none p-0 m-0 cursor-pointer active:scale-95 active:opacity-80 transition-all duration-300"
                                tabIndex={-1}
                            >
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                    <line x1="2" y1="2" x2="10" y2="10" stroke="#B0B7C3" strokeWidth="2" strokeLinecap="round"/>
                                    <line x1="2" y1="10" x2="10" y2="2" stroke="#B0B7C3" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </button>
                        )}
                    </div>
                </form>

                <MemAvatarSelect onSelectAvatar={handleSelectAvatar} />

                <button 
                    className="rounded-md text-sm font-semibold px-4 py-2 bg-[#4F39F6] text-white min-w-[126px] cursor-pointer transition-all duration-300 active:scale-95 focus:outline-none"
                    onClick={hanleToPlay}
                >
                    To play
                </button>
            </div>
        </div>
    )
};
