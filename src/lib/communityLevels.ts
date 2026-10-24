// Pseudo random number generator for seeded algorithms (Mulberry32)
export function cyrb128(str: string) {
    let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
}

export function mulberry32(a: number) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

const WORDS_DE = [
    "ich", "du", "er", "sie", "es", "wir", "ihr", "und", "oder", "aber", 
    "wenn", "weil", "dass", "sein", "haben", "werden", "können", "müssen", 
    "wollen", "sagen", "machen", "geben", "kommen", "gehen", "wissen", 
    "sehen", "lassen", "stehen", "finden", "bleiben", "liegen", "heißen", 
    "denken", "nehmen", "tun", "dürfen", "glauben", "halten", "nennen", 
    "mögen", "zeigen", "führen", "sprechen", "bringen", "leben", "fahren", 
    "meinen", "fragen", "kennen", "gelten", "stellen", "spielen", "arbeiten", 
    "brauchen", "folgen", "lernen", "bestehen", "verstehen", "setzen", 
    "bekommen", "beginnen", "erzählen", "versuchen", "schreiben", "laufen", 
    "erklären", "entsprechen", "sitzen", "ziehen", "scheinen", "fallen", 
    "gehören", "entstehen", "erhalten", "treffen", "suchen", "legen", 
    "vorstellen", "handeln", "erreichen", "tragen", "schaffen", "lesen",
    "verlieren", "darstellen", "erkennen", "entwickeln"
];

const WORDS_EN = [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", 
    "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", 
    "this", "but", "his", "by", "from", "they", "we", "say", "her", 
    "she", "or", "an", "will", "my", "one", "all", "would", "there", 
    "their", "what", "so", "up", "out", "if", "about", "who", "get", 
    "which", "go", "me", "when", "make", "can", "like", "time", "no", 
    "just", "him", "know", "take", "people", "into", "year", "your", 
    "good", "some", "could", "them", "see", "other", "than", "then", 
    "now", "look", "only", "come", "its", "over", "think", "also", 
    "back", "after", "use", "two", "how", "our", "work", "first", 
    "well", "way", "even", "new", "want", "because", "any", "these", 
    "give", "day", "most", "us"
];

export interface CommunityLevelDefinition {
    id: string; // uuid
    creator_uuid: string;
    creator_username: string;
    seed: string;
    title: string;
    wpm: number;
    length: number;
    language: string;
    play_count: number;
    created_at: string;
    theme_color?: string;
}

export function generateCommunityLevelText(seed: string, length: number, lang: string): string {
    const seed128 = cyrb128(seed);
    const rand = mulberry32(seed128[0]);
    const words = lang === 'de' ? WORDS_DE : WORDS_EN;
    
    let textNodes: string[] = [];
    for(let i=0; i<length; i++) {
        const word = words[Math.floor(rand() * words.length)];
        
        // Add random path directions with a small chance
        if (i > 0 && i < length) {
            const chance = rand();
            if (chance < 0.1) {
                textNodes.push("[LEFT]");
            } else if (chance < 0.2) {
                textNodes.push("[RIGHT]");
            } else {
                textNodes.push(" ");
            }
        }
        
        textNodes.push(word);
    }
    
    return textNodes.join('');
}
