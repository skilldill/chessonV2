import { describe, expect, it } from 'bun:test';
import { RoomCreationRequests } from '../utils/roomCreationRequests';

describe('room creation attempts', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';

    it('creates one room for retries and separate rooms for new attempts', () => {
        const requests = new RoomCreationRequests<string>();
        let calls = 0;
        const create = () => 'room-' + ++calls;
        expect(requests.run(id, '10+0', create)).toBe('room-1');
        expect(requests.run(id, '10+0', create)).toBe('room-1');
        expect(requests.run(id + '-next', '10+0', create)).toBe('room-2');
        expect(calls).toBe(2);
    });

    it('does not reuse an attempt with different settings', () => {
        const requests = new RoomCreationRequests<string>();
        requests.run(id, '10+0', () => 'room-1');
        expect(() => requests.run(id, '3+2', () => 'room-2')).toThrow('settings changed');
    });

    it('expires old attempts and preserves calls without an id', () => {
        let now = 0;
        let calls = 0;
        const requests = new RoomCreationRequests<number>(100, () => now);
        const create = () => ++calls;
        expect(requests.run(id, '', create)).toBe(1);
        now = 100;
        expect(requests.run(id, '', create)).toBe(2);
        expect(requests.run(undefined, '', create)).toBe(3);
        expect(requests.run(undefined, '', create)).toBe(4);
    });

    it('rejects invalid ids without creating rooms', () => {
        const requests = new RoomCreationRequests<string>();
        for (const invalid of ['', 'too-short', 'a'.repeat(129), {}, null, '../invalid-id-path']) {
            expect(() => requests.run(invalid, '', () => { throw new Error('must not create'); }))
                .toThrow('Invalid room creation requestId');
        }
    });

    it('does not cache failed creation', () => {
        const requests = new RoomCreationRequests<string>();
        expect(() => requests.run(id, '', () => { throw new Error('network'); })).toThrow('network');
        expect(requests.run(id, '', () => 'room-1')).toBe('room-1');
    });
});
