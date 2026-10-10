export class RoomCreationRequestError extends Error {
    constructor(public readonly status: number, message: string) {
        super(message);
    }
}

// Rooms are in-memory too; keeping attempts alongside them protects lost-response retries.
export class RoomCreationRequests<T> {
    private readonly entries = new Map<string, { signature: string; value: T; expiresAt: number }>();

    constructor(private readonly ttlMs = 10 * 60 * 1000, private readonly now = Date.now) {}

    run(requestId: unknown, signature: string, create: () => T): T {
        if (requestId === undefined) return create();
        if (typeof requestId !== 'string' || !/^[a-zA-Z0-9_-]{16,128}$/.test(requestId)) {
            throw new RoomCreationRequestError(400, 'Invalid room creation requestId');
        }
        this.cleanup();
        const previous = this.entries.get(requestId);
        if (previous) {
            if (previous.signature !== signature) {
                throw new RoomCreationRequestError(409, 'Room creation settings changed for this requestId');
            }
            return previous.value;
        }
        const value = create();
        this.entries.set(requestId, { signature, value, expiresAt: this.now() + this.ttlMs });
        return value;
    }

    cleanup() {
        const now = this.now();
        for (const [key, entry] of this.entries) {
            if (entry.expiresAt <= now) this.entries.delete(key);
        }
    }
}
