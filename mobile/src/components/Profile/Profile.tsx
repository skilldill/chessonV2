import type { FC } from 'react';

type ProfileProps = {
    nickname: string;
    color?: string;
    avatar?: string;
}

export const Profile: FC<ProfileProps> = (props) => {
    const { nickname, color = '#155DFC', avatar } = props;

    return (
        <div className="flex flex-col justify-cnter items-center gap-[4px]">
            <div className="w-[58px] h-[58px] border-[2px] bg-black rounded-full flex justify-center items-center transition-all duration-200 active:scale-95" style={{ borderColor: color }}>
                <div className="w-[48px] h-[48px] rounded-full bg-black overflow-hidden flex justify-center items-center">
                    {avatar && <img src={avatar} className="h-full w-full object-cover" />}
                </div>
            </div>
            <span className="text-sm font-medium">
                {nickname}
            </span>
        </div>
    )
}

