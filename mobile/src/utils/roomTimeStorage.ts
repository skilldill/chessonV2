export const ROOM_TIME_MINUTES_KEY = 'chesson_room_time_minutes';
export const ROOM_TIME_INCREMENT_KEY = 'chesson_room_time_increment';
export const ROOM_TIME_CUSTOMIZED_KEY = 'chesson_room_time_customized';

const DEFAULT_TIME_MINUTES = 10;
const DEFAULT_INCREMENT_SECONDS = 0;

const parseNonNegativeInt = (value: string | null, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

const parseMinutesInt = (value: string | null, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
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

  const isCustomized = localStorage.getItem(ROOM_TIME_CUSTOMIZED_KEY) === '1';
  const storedMinutes = localStorage.getItem(ROOM_TIME_MINUTES_KEY);
  const storedIncrement = localStorage.getItem(ROOM_TIME_INCREMENT_KEY);

  // Migration for legacy state where 1+0 could be persisted implicitly.
  if (!isCustomized && storedMinutes === '1' && (storedIncrement === null || storedIncrement === '0')) {
    return {
      timeMinutes: DEFAULT_TIME_MINUTES,
      incrementSeconds: DEFAULT_INCREMENT_SECONDS,
    };
  }

  return {
    timeMinutes: parseMinutesInt(storedMinutes, DEFAULT_TIME_MINUTES),
    incrementSeconds: parseNonNegativeInt(storedIncrement, DEFAULT_INCREMENT_SECONDS),
  };
};

export const setRoomTimeSettingsToStorage = (timeMinutes: number, incrementSeconds: number) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(ROOM_TIME_MINUTES_KEY, String(Math.max(1, Math.floor(timeMinutes))));
  localStorage.setItem(ROOM_TIME_INCREMENT_KEY, String(Math.max(0, Math.floor(incrementSeconds))));
  localStorage.setItem(ROOM_TIME_CUSTOMIZED_KEY, '1');
};
