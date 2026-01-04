import { FC, useMemo } from "react";
import { getClockTime } from "../../utils/getClockTime";
import cn from 'classnames';
import { CircleProgress } from "../CircleProgress/CircleProgress";
import { useScreenSize } from "../../hooks/useScreenSize";
import { IonImg } from "@ionic/react";

type ChessTimerWithProfileProps = {
    initSeconds: number;
    seconds: number;
    nickname: string;
    avatar?: string;
    rating?: string;
    active?: boolean;
}

export const ChessTimerWithProfile: FC<ChessTimerWithProfileProps> = (props) => {
    const {
        initSeconds,
        seconds,
        nickname,
        avatar,
        active,
    } = props;

    const screenSize = useScreenSize();

    const [minutesStr, secondsStr] = useMemo(
        () => getClockTime(seconds),
        [seconds]
    );

    const timeInPercent = useMemo(
        () => seconds / (initSeconds / 100),
        [seconds, initSeconds]
    );
    // const isDangerTime = useMemo(() => timeInPercent < 20, [timeInPercent]);

    return (
        <div className={cn("w-full grid grid-cols-[minmax(32px,_1fr)_minmax(84px,_1fr)_minmax(32px,_1fr)] items-center", { 'opacity-55': !active })}>
            <div className="w-full flex items-center gap-[12px] min-w-0 overflow-hidden">
                <div 
                    className="rounded-full bg-black overflow-hidden flex justify-center items-center flex-shrink-0"
                    style={{
                        width: '32px', // 24
                        height: '32px', // 24
                    }}
                >
                    {avatar && <IonImg src={avatar} className="h-full w-full object-cover" />}
                </div>
                <span 
                    className="text-sm font-medium truncate min-w-0" 
                    style={{ 
                        fontWeight: 500, 
                        maxWidth:  screenSize === 'S' ? '60px' : '76px', 
                        fontSize: '16px',
                    }}
                >
                    {nickname}
                </span>
            </div>

            <div className="flex justify-center">
                <div 
                    className="font-semibold text-white fadeIn200ms"
                    style={{ 
                            lineHeight: '36px', // 32
                            fontSize: '30px' // 24
                        }}
                    >
                    <span>{minutesStr}</span>
                    <span>:</span>
                    <span>{secondsStr}</span>
                </div>
            </div>

            <div className="flex justify-end items-center">
                <CircleProgress progress={timeInPercent} size={32} strokeWidth={4} />
            </div>
        </div>
    )
}

{/*  */}