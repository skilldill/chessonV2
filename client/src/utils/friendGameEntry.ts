const MINUTES = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50, 60, 120];
const INCREMENTS = [0, 1, 2, 3, 4, 5, 10, 15, 20, 30, 40, 50, 60, 100];

export const isFriendGameEntry = (search: string) => {
    const params = new URLSearchParams(search);
    return params.get('mode') === 'friend' && params.get('autoStart') === '1';
};

export const parseFriendGameSettings = (search: string) => {
    const params = new URLSearchParams(search);
    const minutes = params.get('timeMinutes');
    const increment = params.get('incrementSeconds');
    const hints = params.get('withAIhints');
    const requestId = params.get('requestId');

    if (['timeMinutes', 'incrementSeconds', 'withAIhints', 'gameMode', 'requestId']
        .some((key) => params.getAll(key).length > 1)
        || !minutes || !/^\d+$/.test(minutes) || !MINUTES.includes(Number(minutes))
        || increment === null || !/^\d+$/.test(increment) || !INCREMENTS.includes(Number(increment))
        || (hints !== null && hints !== 'true' && hints !== 'false')
        || (params.has('gameMode') && params.get('gameMode') !== 'standard')
        || (requestId !== null && !/^[a-zA-Z0-9_-]{16,128}$/.test(requestId))) {
        return null;
    }

    return {
        timeMinutes: Number(minutes),
        incrementSeconds: Number(increment),
        withAIhints: hints === 'true',
        vsBot: false,
        gameMode: 'standard' as const,
        requestId: requestId ?? crypto.randomUUID(),
    };
};
