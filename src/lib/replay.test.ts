import { describe, expect, it } from 'vitest';
import { decodeEvent, encodeEvent, ReplayEvent } from './replay';

describe('replay encoding', () => {
    it('decodes to the same deltas that were encoded', () => {
        const events: ReplayEvent[] = [
            { delta: 100, isMistake: false },
            { delta: 87, isMistake: false },
            { delta: 1, isMistake: false },
            { delta: 342, isMistake: true },
            { delta: 3150, isMistake: false },
            { delta: 59, isMistake: true },
        ];

        const encoded = events.map(e => encodeEvent(e.delta, e.isMistake));
        expect(encoded.map(decodeEvent)).toEqual(events);
    });

    it('round-trips many random sequences', () => {
        for (let run = 0; run < 100; run++) {
            const events: ReplayEvent[] = Array.from({ length: 200 }, () => ({
                delta: 1 + Math.floor(Math.random() * 5000),
                isMistake: Math.random() < 0.1,
            }));
            const encoded = events.map(e => encodeEvent(e.delta, e.isMistake));
            expect(encoded.map(decodeEvent)).toEqual(events);
        }
    });

    // Replays already stored in the database use this format and must keep working
    it('reads the stored format: positive = correct, negative = mistake', () => {
        expect([120, -340, 95].map(decodeEvent)).toEqual([
            { delta: 120, isMistake: false },
            { delta: 340, isMistake: true },
            { delta: 95, isMistake: false },
        ]);
    });

    it('still marks a mistake typed in the same millisecond as a mistake', () => {
        const encoded = encodeEvent(0, true);
        expect(decodeEvent(encoded).isMistake).toBe(true);
        // also after the round trip through the database (JSON)
        expect(decodeEvent(JSON.parse(JSON.stringify(encoded))).isMistake).toBe(true);
    });

    it('keeps a correct key typed in the same millisecond as correct', () => {
        expect(decodeEvent(encodeEvent(0, false))).toEqual({ delta: 0, isMistake: false });
    });

    it('keeps the encoded data a plain integer array', () => {
        const encoded = [encodeEvent(250, false), encodeEvent(80, true)];
        expect(encoded).toEqual([250, -80]);
        expect(JSON.parse(JSON.stringify(encoded))).toEqual(encoded);
    });
});
