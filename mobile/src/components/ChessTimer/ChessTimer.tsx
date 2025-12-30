import { type FC, useMemo } from 'react';
import { getClockTime } from '../../utils/getClockTime';
import cn from 'classnames';

interface ChessTimerProps {
    initSeconds: number;
    seconds: number;
    timeLineBottom?: boolean;
}

export const ChessTimer: FC<ChessTimerProps> = (props) => {
    const { seconds, initSeconds, timeLineBottom = false } = props;

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
        <div className="w-[128px] h-[68px] bg-back-secondary flex items-center justify-center rounded-lg overflow-hidden relative transition-all duration-200 active:scale-95 cursor-pointer">
            <div className={cn('absolute right-0 left-0 h-[6px] bg-indigo-400/20', {
                'bottom-0': timeLineBottom,
                'top-0': !timeLineBottom,
            })}>
                <div className="w-full h-full bg-gradient-to-r from-[#4F39F6] to-[#57C3FF] rounded-r-full transition delay-150 duration-300 ease-in-out" style={{ width: `${timeInPercent}%` }} />
            </div>
            <div className="font-semibold text-[28px] text-white">
                <span>{minutesStr}</span>
                <span>:</span>
                <span>{secondsStr}</span>
            </div>
        </div>
    );
};