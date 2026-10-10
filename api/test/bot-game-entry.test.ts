import { describe, expect, it } from 'bun:test';
import { isBotGameEntry as desktopEntry, parseBotGameSettings as desktopSettings } from '../../client/src/utils/botGameEntry';
import { isBotGameEntry as mobileEntry, parseBotGameSettings as mobileSettings } from '../../mobile/src/utils/botGameEntry';
import { FRIEND_GAME_MINUTES, FRIEND_GAME_INCREMENTS } from '../../site/src/data/friendGame';
import { BOT_GAME_DIFFICULTIES, BOT_GAME_RU_SLUGS, BOT_GAME_EN_SLUGS, BOT_GAME_TRANSLATIONS } from '../../site/src/data/botGame';

for (const [name, isEntry, parse] of [
    ['desktop', desktopEntry, desktopSettings],
    ['mobile', mobileEntry, mobileSettings],
] as const) {
    describe(name + ' bot landing contract', () => {
        const search = '?mode=bot&autoStart=1&gameMode=standard&timeMinutes=30&incrementSeconds=0';

        it('only creates a bot for explicit automatic entry', () => {
            expect(isEntry(search)).toBe(true);
            for (const other of ['', '?mode=bot', '?autoStart=1', '?mode=friend&autoStart=1']) {
                expect(isEntry(other)).toBe(false);
                expect(parse(other)).toBeNull();
            }
        });

        it('defaults to medium, white and the existing bot engine settings', () => {
            const requestId = crypto.randomUUID();
            expect(parse(search + '&requestId=' + requestId)).toEqual({
                timeMinutes: 30, incrementSeconds: 0, vsBot: true, withAIhints: true,
                gameMode: 'standard', requestId, botDifficulty: 'medium', botMoveTimeMs: 800, color: 'white',
            });
        });

        it('accepts all offered timers, difficulties and both colors', () => {
            for (const timeMinutes of FRIEND_GAME_MINUTES) {
                for (const incrementSeconds of FRIEND_GAME_INCREMENTS) {
                    expect(parse(`?mode=bot&autoStart=1&timeMinutes=${timeMinutes}&incrementSeconds=${incrementSeconds}`))
                        .toMatchObject({ timeMinutes, incrementSeconds, vsBot: true });
                }
            }
            for (const botDifficulty of BOT_GAME_DIFFICULTIES) {
                for (const color of ['white', 'black']) {
                    expect(parse(search + `&botDifficulty=${botDifficulty}&color=${color}`))
                        .toMatchObject({ botDifficulty, color });
                }
            }
        });

        it('rejects malformed settings and ambiguous duplicate parameters', () => {
            for (const extra of [
                '&botDifficulty=invalid', '&botDifficulty=', '&color=red', '&color=',
                '&botDifficulty=hard&botDifficulty=easy', '&color=white&color=black',
                '&mode=friend', '&autoStart=0', '&timeMinutes=3', '&incrementSeconds=2',
                '&gameMode=twoQueens', '&requestId=../unsafe', '&withAIhints=1',
            ]) expect(parse(search + extra)).toBeNull();
            expect(parse('?mode=bot&autoStart=1&timeMinutes=-1&incrementSeconds=0')).toBeNull();
        });

        it('cannot inject a custom position or disable the bot using extra parameters', () => {
            const settings = parse(search + '&currentFEN=invalid&vsBot=false&withAIhints=false');
            expect(settings).toMatchObject({ vsBot: true, withAIhints: true });
            expect(settings).not.toHaveProperty('currentFEN');
        });
    });
}

it('offers five unique Latin aliases per language with localized canonical pages', () => {
    expect(BOT_GAME_RU_SLUGS).toHaveLength(5);
    expect(BOT_GAME_EN_SLUGS).toHaveLength(5);
    const aliases = [...BOT_GAME_RU_SLUGS, ...BOT_GAME_EN_SLUGS];
    expect(new Set(aliases).size).toBe(10);
    for (const alias of aliases) expect(alias).toMatch(/^[a-z_]+$/);
    expect(BOT_GAME_TRANSLATIONS.ru.canonical).toBe('https://chesson.me/ru/play-chess-with-bot/');
    expect(BOT_GAME_TRANSLATIONS.en.canonical).toBe('https://chesson.me/play-chess-with-bot/');
    expect(JSON.stringify(BOT_GAME_TRANSLATIONS.en)).not.toMatch(/[а-яё]/i);
});
