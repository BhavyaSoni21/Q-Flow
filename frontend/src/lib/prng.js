// Deterministic seeded PRNG (mulberry32) — same seed + inputs => same output.
export function createRng(seed) {
    let s = (seed >>> 0) || 1;
    return function next() {
        s |= 0;
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Standard normal via Box-Muller, seeded.
export function gaussian(rng) {
    let u = 0, v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function randInt(rng, min, max) {
    return Math.floor(rng() * (max - min + 1)) + min;
}

export function randRange(rng, min, max) {
    return rng() * (max - min) + min;
}

export function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
}