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
        <div className={cn("w-full grid grid-cols-[32px_1fr_32px] items-center", { 'opacity-55': !active })}>
            <div className="relative">
                <div className="absolute top-0 left-0 bottom-0 flex items-center gap-[12px]">
                    <div 
                        className="rounded-full bg-black overflow-hidden flex justify-center items-center"
                        style={{
                            width: screenSize === 'L' ? '32px' : '24px',
                            height: screenSize === 'L' ? '32px' : '24px',
                        }}
                    >
                        {avatar && <IonImg src={avatar} className="h-full w-full object-cover" />}
                    </div>
                    <span className="text-sm font-medium" style={{ fontWeight: 500 }}>
                        {nickname}
                    </span>
                </div>
            </div>

            <div className="flex justify-center">
                <div 
                    className="font-semibold text-white fadeIn200ms"
                    style={{ 
                            lineHeight: screenSize === 'L' ? '36px' : '32px',
                            fontSize: screenSize === 'L' ? '30px' : '24px'
                        }}
                    >
                    <span>{minutesStr}</span>
                    <span>:</span>
                    <span>{secondsStr}</span>
                </div>
            </div>

            <div className="flex items-center">
                <CircleProgress progress={timeInPercent} size={screenSize === 'L' ? 32 : 24} strokeWidth={screenSize === 'L' ? 4 : 3} />
            </div>
        </div>
    )
}

{/*  */}