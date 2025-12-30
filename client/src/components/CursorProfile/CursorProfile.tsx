import type { FC } from 'react';

type CursorProfileProps = {
    nickname: string;
    color?: string;
    avatar?: string;
}

export const CursorProfile: FC<CursorProfileProps> = (props) => {
    const { nickname, color = '#155DFC', avatar } = props;

    return (
        <div className="relative p-[8px] rounded-full flex items-center gap-[8px] select-none" style={{ backgroundColor: color }}>
            <div className="absolute top-[-16px] left-[-8px] mask-[url('assets/cursor.svg')] mask-no-repeat mask-contain w-[20px] h-[23px]" style={{ backgroundColor: color }} />
            <div className="w-[28px] h-[28px] rounded-full bg-black overflow-hidden flex justify-center items-center">
                {avatar && <img src={avatar} className="h-full w-full object-cover" />}
            </div>
            <span className="text-[16px] pr-[2px]">
                {nickname}
            </span>
        </div>
    )
}