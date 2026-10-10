import { describe, expect, it } from 'bun:test';
import { isFriendGameEntry as desktopEntry, parseFriendGameSettings as desktopSettings } from '../../client/src/utils/friendGameEntry';
import { isFriendGameEntry as mobileEntry, parseFriendGameSettings as mobileSettings } from '../../mobile/src/utils/friendGameEntry';
import { FRIEND_GAME_MINUTES, FRIEND_GAME_INCREMENTS } from '../../site/src/data/friendGame';

for (const [name, isEntry, parse] of [
    ['desktop', desktopEntry, desktopSettings],
    ['mobile', mobileEntry, mobileSettings],
] as const) {
    describe(name + ' friend landing contract', () => {
        const search = '?mode=friend&autoStart=1&gameMode=standard&timeMinutes=3&incrementSeconds=2';

        it('only starts automatically for an explicit friend entry', () => {
            expect(isEntry(search)).toBe(true);
            for (const other of ['', '?mode=friend', '?autoStart=1', '?mode=bot&autoStart=1']) {
                expect(isEntry(other)).toBe(false);
            }
        });

        it('preserves timers, hints and attempt id without enabling bots', () => {
            const requestId = crypto.randomUUID();
            expect(parse(search + '&withAIhints=true&vsBot=true&requestId=' + requestId)).toEqual({
                timeMinutes: 3, incrementSeconds: 2, withAIhints: true,
                vsBot: false, gameMode: 'standard', requestId,
            });
            expect(parse(search)?.withAIhints).toBe(false);
            expect(parse(search + '&withAIhints=false')?.withAIhints).toBe(false);
            expect(parse(search)?.requestId.length).toBe(36);
        });

        it('accepts every setting offered by the landing', () => {
            for (const timeMinutes of FRIEND_GAME_MINUTES) {
                for (const incrementSeconds of FRIEND_GAME_INCREMENTS) {
                    expect(parse(`?timeMinutes=${timeMinutes}&incrementSeconds=${incrementSeconds}`))
                        .toMatchObject({ timeMinutes, incrementSeconds });
                }
            }
        });

        it('rejects missing, malformed and unsupported values', () => {
            for (const invalid of [
                '?timeMinutes=3', '?incrementSeconds=2', '?timeMinutes=&incrementSeconds=',
                '?timeMinutes=0&incrementSeconds=2', '?timeMinutes=7&incrementSeconds=2',
                '?timeMinutes=3.5&incrementSeconds=2', '?timeMinutes=NaN&incrementSeconds=2',
                '?timeMinutes=3&incrementSeconds=-1', '?timeMinutes=3&incrementSeconds=2.5',
                search + '&withAIhints=1', search + '&gameMode=twoQueens',
                search + '&requestId=', search + '&requestId=../invalid-id-path',
            ]) {
                expect(parse(invalid)).toBeNull();
            }
        });
    });
}
