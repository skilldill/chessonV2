import { parseFriendGameSettings } from './friendGameEntry';

const DIFFICULTIES = ['super_easy', 'easy', 'medium', 'hard'] as const;
type BotDifficulty = (typeof DIFFICULTIES)[number];

export const isBotGameEntry = (search: string) => {
    const params = new URLSearchParams(search);
    return params.get('mode') === 'bot' && params.get('autoStart') === '1';
};

export const parseBotGameSettings = (search: string) => {
    if (!isBotGameEntry(search)) return null;
    const params = new URLSearchParams(search);
    const settings = parseFriendGameSettings(search);
    const difficulty = params.get('botDifficulty') ?? 'medium';
    const color = params.get('color') ?? 'white';
    if (!settings
        || ['mode', 'autoStart', 'botDifficulty', 'color'].some((key) => params.getAll(key).length > 1)
        || !DIFFICULTIES.includes(difficulty as BotDifficulty)
        || (color !== 'white' && color !== 'black')) return null;

    return {
        ...settings,
        vsBot: true,
        withAIhints: true,
        botDifficulty: difficulty as BotDifficulty,
        botMoveTimeMs: 800,
        color: color as 'white' | 'black',
    };
};
