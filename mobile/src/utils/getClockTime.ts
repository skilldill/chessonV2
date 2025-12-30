/**
 * Возвращает время в формате 10:00
 * @param time время в секундах
 */
export const getClockTime = (time: number): string[] => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;

    const strMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const strSeconds = seconds < 10 ? `0${seconds}` : seconds;

    return [strMinutes.toString(), strSeconds.toString()];
};