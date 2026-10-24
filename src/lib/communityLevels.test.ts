import { describe, expect, it } from 'vitest';
import { cyrb128, generateCommunityLevelText, mulberry32 } from './communityLevels';

// Splits a generated level into its words, dropping the separators (" ", "[LEFT]", "[RIGHT]")
const words = (text: string) => text.split(/ |\[LEFT\]|\[RIGHT\]/).filter(Boolean);

describe('cyrb128', () => {
    it('returns the same hash for the same string', () => {
        expect(cyrb128('typerr')).toEqual(cyrb128('typerr'));
    });

    it('returns four unsigned 32-bit integers', () => {
        const hash = cyrb128('typerr');
        expect(hash).toHaveLength(4);
        for (const part of hash) {
            expect(Number.isInteger(part)).toBe(true);
            expect(part).toBeGreaterThanOrEqual(0);
            expect(part).toBeLessThan(2 ** 32);
        }
    });

    it('returns different hashes for similar strings', () => {
        expect(cyrb128('seed-1')).not.toEqual(cyrb128('seed-2'));
    });
});

describe('mulberry32', () => {
    it('produces the same sequence for the same seed', () => {
        const a = mulberry32(42);
        const b = mulberry32(42);
        const seqA = Array.from({ length: 100 }, () => a());
        const seqB = Array.from({ length: 100 }, () => b());
        expect(seqA).toEqual(seqB);
    });

    it('produces values in [0, 1)', () => {
        const rand = mulberry32(12345);
        for (let i = 0; i < 10_000; i++) {
            const value = rand();
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(1);
        }
    });

    it('produces different sequences for different seeds', () => {
        expect(mulberry32(1)()).not.toBe(mulberry32(2)());
    });
});

describe('generateCommunityLevelText', () => {
    it('generates an identical level for the same seed', () => {
        const first = generateCommunityLevelText('my-level', 50, 'de');
        const second = generateCommunityLevelText('my-level', 50, 'de');
        expect(first).toBe(second);
    });

    it('generates different levels for different seeds', () => {
        expect(generateCommunityLevelText('seed-a', 50, 'en'))
            .not.toBe(generateCommunityLevelText('seed-b', 50, 'en'));
    });

    it('generates different levels for different languages', () => {
        expect(generateCommunityLevelText('seed', 50, 'de'))
            .not.toBe(generateCommunityLevelText('seed', 50, 'en'));
    });

    it('contains exactly `length` words', () => {
        for (const length of [1, 10, 100]) {
            expect(words(generateCommunityLevelText('count', length, 'en'))).toHaveLength(length);
        }
    });

    it('does not start with a separator', () => {
        const text = generateCommunityLevelText('start', 20, 'en');
        expect(text).not.toMatch(/^( |\[LEFT\]|\[RIGHT\])/);
    });

    // Community levels are stored only as their seed. If the generator changes,
    // every existing level changes and its leaderboard becomes meaningless.
    // This snapshot fails on any such change.
    it('stays stable across code changes', () => {
        expect(generateCommunityLevelText('typerr', 12, 'en')).toMatchInlineSnapshot(`"a first[RIGHT]will for just[LEFT]would like[RIGHT]back[LEFT]know as this[LEFT]up"`);
    });
});
