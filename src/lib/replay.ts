// Replay format: one number per keystroke, the milliseconds since the previous keystroke.
// The sign carries the result: positive = correct key, negative = mistake.

export interface ReplayEvent {
    delta: number;
    isMistake: boolean;
}

// A mistake with delta 0 would encode as -0, which reads back as correct
// (-0 < 0 is false, and JSON stores it as 0). Mistakes are therefore at least 1 ms.
export function encodeEvent(delta: number, isMistake: boolean): number {
    return isMistake ? -Math.max(delta, 1) : delta;
}

export function decodeEvent(value: number): ReplayEvent {
    return { delta: Math.abs(value), isMistake: value < 0 };
}
