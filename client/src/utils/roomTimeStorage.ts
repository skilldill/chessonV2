export const ROOM_TIME_MINUTES_KEY = 'chesson_room_time_minutes';
export const ROOM_TIME_INCREMENT_KEY = 'chesson_room_time_increment';

const DEFAULT_TIME_MINUTES = 10;
const DEFAULT_INCREMENT_SECONDS = 0;

const parsePositiveInt = (value: string | null, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

export const getRoomTimeSettingsFromStorage = () => {
  if (typeof window === 'undefined') {
    return {
      timeMinutes: DEFAULT_TIME_MINUTES,
      incrementSeconds: DEFAULT_INCREMENT_SECONDS,
    };
  }

  return {
    timeMinutes: parsePositiveInt(localStorage.getItem(ROOM_TIME_MINUTES_KEY), DEFAULT_TIME_MINUTES),
    incrementSeconds: parsePositiveInt(localStorage.getItem(ROOM_TIME_INCREMENT_KEY), DEFAULT_INCREMENT_SECONDS),
  };
};

export const setRoomTimeSettingsToStorage = (timeMinutes: number, incrementSeconds: number) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(ROOM_TIME_MINUTES_KEY, String(Math.max(0, Math.floor(timeMinutes))));
  localStorage.setItem(ROOM_TIME_INCREMENT_KEY, String(Math.max(0, Math.floor(incrementSeconds))));
};
