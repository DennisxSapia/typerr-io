import { Language } from './i18n';

export const getAppEventCycleIndex = (): number => {
  const defaultTarget = new Date("2026-05-27T18:00:00Z").getTime();
  const now = Date.now();
  if (now < defaultTarget) {
    return 0;
  }
  const diff = now - defaultTarget;
  // Each cycle is exactly 7 days
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
};

const WEEKLY_EVENTS = {
  de: [
    { text: "du musst hier extrem schnell sein", diff: "Spezial-Event: Blackout", time: 40, theme: 0 },
    { text: "schnell, schneller, am schnellsten.", diff: "Spezial-Event: Sprinter", time: 200, theme: 1 },
    { text: "Wie schnell kannst du wirklich tippen", diff: "Spezial-Event: Redline", time: 120, theme: 2 },
    { text: "alles um dich herum wird ruhig.[LEFT]nur die nächsten buchstaben zählen.[RIGHT]du kommst immer tiefer in den rhythmus.[LEFT][LEFT]jede taste fühlt sich schneller an.[RIGHT]nicht den fokus verlieren.[LEFT]einfach weitermachen.[RIGHT][RIGHT]taste für taste bis zum ende.", diff: "Spezial-Event: Void", time: 520, theme: 3 },
    { text: "dieser lauf muss sitzen.[LEFT]keine einfachen fehler mehr.[RIGHT][RIGHT]das tempo gibt keine pause.[LEFT]du musst aufmerksam bleiben.[RIGHT]jede eingabe zählt jetzt.[LEFT][LEFT]ruhig bleiben und weitermachen.[RIGHT]noch ein letzter abschnitt.[LEFT]dann hast du es geschafft.", diff: "Spezial-Event: Execution", time: 140, theme: 4 },
    { text: "warnung.[RIGHT]das tempo wird instabil.[LEFT][LEFT]die zeilen fliegen vorbei.[RIGHT]deine reaktion muss perfekt sein.[LEFT]nicht verkrampfen.[RIGHT][RIGHT]halte den rhythmus solange du kannst.[LEFT]ein fehler brings alles durcheinander.[RIGHT]konzentrier dich.", diff: "Spezial-Event: System Failure", time: 95, theme: 5 },
    { text: "letzte runde.[LEFT]jetzt zählt jede sekunde.[RIGHT][RIGHT]du bist fast am ende.[LEFT]der schwierigste teil kommt erst jetzt.[RIGHT]bleib fokussiert.[LEFT][LEFT]nicht aufgeben kurz vor dem ziel.[RIGHT]zieh durch bis zum letzten buchstaben.", diff: "Spezial-Event: Final Run", time: 220, theme: 6 },
  ],
  en: [
    { text: "you must be extremely fast here", diff: "Special Event: Blackout", time: 40, theme: 0 },
    { text: "fast, faster, fastest.", diff: "Special Event: Sprinter", time: 200, theme: 1 },
    { text: "How fast can you really type", diff: "Special Event: Redline", time: 120, theme: 2 },
    { text: "everything around you goes quiet.[LEFT]only the next letters matter.[RIGHT]you fall deeper into the rhythm.[LEFT][LEFT]every key feels faster.[RIGHT]do not lose focus.[LEFT]just keep going.[RIGHT][RIGHT]key by key until the end.", diff: "Special Event: Void", time: 520, theme: 3 },
    { text: "this run has to be perfect.[LEFT]no more simple mistakes.[RIGHT][RIGHT]the pace gives no rest.[LEFT]you must stay alert.[RIGHT]every input matters now.[LEFT][LEFT]stay calm and carry on.[RIGHT]one last section.[LEFT]then you have made it.", diff: "Special Event: Execution", time: 140, theme: 4 },
    { text: "warning.[RIGHT]the tempo becomes unstable.[LEFT][LEFT]the lines fly by.[RIGHT]your reaction must be flawless.[LEFT]do not tense up.[RIGHT][RIGHT]keep the rhythm as long as you can.[LEFT]one mistake ruins everything.[RIGHT]concentrate.", diff: "Special Event: System Failure", time: 95, theme: 5 },
    { text: "final round.[LEFT]every second counts now.[RIGHT][RIGHT]you are almost at the end.[LEFT]the hardest part comes now.[RIGHT]stay focused.[LEFT][LEFT]do not give up right before the goal.[RIGHT]push through to the last letter.", diff: "Special Event: Final Run", time: 220, theme: 6 },
  ]
};

export const THEMES = [
  // 0: Dark Gray (default/white)
  {
    bg: "radial-gradient(circle at 50% 30%, #000000 0%, #050505 80%, #222222 100%)",
    block: { "--block-color": "#111111", "--block-shadow": "#000000", "--block-stripe": "rgba(255,255,255,0.03)" },
    blockActive: { "--block-color": "#444444", "--block-shadow": "#111111", "--block-stripe": "rgba(255,255,255,0.08)" },
    playerColor: "#d4d4d4", playerGlow: "0 0 25px rgba(255,255,255,0.3)", hudColor: "text-neutral-400",
  },
  // 1: Dark Indigo
  {
    bg: "radial-gradient(circle at 50% 30%, #000000 0%, #0c0a20 80%, #1e1b4b 100%)",
    block: { "--block-color": "#0f172a", "--block-shadow": "#020617", "--block-stripe": "rgba(255,255,255,0.03)" },
    blockActive: { "--block-color": "#312e81", "--block-shadow": "#0f172a", "--block-stripe": "rgba(255,255,255,0.08)" },
    playerColor: "#818cf8", playerGlow: "0 0 25px rgba(129,140,248,0.3)", hudColor: "text-indigo-400",
  },
  // 2: Dark Red
  {
    bg: "radial-gradient(circle at 50% 30%, #000000 0%, #200505 80%, #450a0a 100%)",
    block: { "--block-color": "#1a0505", "--block-shadow": "#000000", "--block-stripe": "rgba(255,255,255,0.03)" },
    blockActive: { "--block-color": "#7f1d1d", "--block-shadow": "#1a0505", "--block-stripe": "rgba(255,255,255,0.08)" },
    playerColor: "#f87171", playerGlow: "0 0 25px rgba(248,113,113,0.3)", hudColor: "text-red-400",
  },
  // 3: Dark Neutral/Greenish (Original Blitzschnell style)
  {
    bg: "radial-gradient(circle at 50% 30%, #000000 0%, #021a11 80%, #064e3b 100%)",
    block: { "--block-color": "#010e09", "--block-shadow": "#000000", "--block-stripe": "rgba(255,255,255,0.03)" },
    blockActive: { "--block-color": "#065f46", "--block-shadow": "#010e09", "--block-stripe": "rgba(255,255,255,0.08)" },
    playerColor: "#10b981", playerGlow: "0 0 25px rgba(16,185,129,0.3)", hudColor: "text-emerald-500",
  },
  // 4: Dark Amber
  {
    bg: "radial-gradient(circle at 50% 30%, #000000 0%, #1f1505 80%, #422006 100%)",
    block: { "--block-color": "#1a1005", "--block-shadow": "#000000", "--block-stripe": "rgba(255,255,255,0.03)" },
    blockActive: { "--block-color": "#854d0e", "--block-shadow": "#1a1005", "--block-stripe": "rgba(255,255,255,0.08)" },
    playerColor: "#facc15", playerGlow: "0 0 25px rgba(250,204,21,0.3)", hudColor: "text-yellow-500",
  },
  // 5: Dark Cyan
  {
    bg: "radial-gradient(circle at 50% 30%, #000000 0%, #041414 80%, #083344 100%)",
    block: { "--block-color": "#020f0f", "--block-shadow": "#000000", "--block-stripe": "rgba(255,255,255,0.03)" },
    blockActive: { "--block-color": "#155e75", "--block-shadow": "#020f0f", "--block-stripe": "rgba(255,255,255,0.08)" },
    playerColor: "#22d3ee", playerGlow: "0 0 25px rgba(34,211,238,0.3)", hudColor: "text-cyan-500",
  },
  // 6: Dark Blue
  {
    bg: "radial-gradient(circle at 50% 30%, #000000 0%, #0a1128 80%, #172554 100%)",
    block: { "--block-color": "#030712", "--block-shadow": "#000000", "--block-stripe": "rgba(255,255,255,0.03)" },
    blockActive: { "--block-color": "#1e3a8a", "--block-shadow": "#030712", "--block-stripe": "rgba(255,255,255,0.08)" },
    playerColor: "#38bdf8", playerGlow: "0 0 25px rgba(56,189,248,0.3)", hudColor: "text-sky-500",
  },
  // 7: Dark Purple
  {
    bg: "radial-gradient(circle at 50% 30%, #000000 0%, #150a28 80%, #2e1065 100%)",
    block: { "--block-color": "#0b0515", "--block-shadow": "#000000", "--block-stripe": "rgba(255,255,255,0.03)" },
    blockActive: { "--block-color": "#4c1d95", "--block-shadow": "#0b0515", "--block-stripe": "rgba(255,255,255,0.08)" },
    playerColor: "#8b5cf6", playerGlow: "0 0 25px rgba(139,92,246,0.3)", hudColor: "text-purple-500",
  },
  // 8: Dark Pink
  {
    bg: "radial-gradient(circle at 50% 30%, #000000 0%, #170725 80%, #3b0764 100%)",
    block: { "--block-color": "#0d051a", "--block-shadow": "#000000", "--block-stripe": "rgba(255,255,255,0.03)" },
    blockActive: { "--block-color": "#6b21a8", "--block-shadow": "#0d051a", "--block-stripe": "rgba(255,255,255,0.08)" },
    playerColor: "#f472b6", playerGlow: "0 0 25px rgba(244,114,182,0.3)", hudColor: "text-pink-500",
  }
];

export const getActiveWeeklyEvent = (lang: Language) => {
  const cycleIndex = getAppEventCycleIndex();
  const list = WEEKLY_EVENTS[lang];
  const eventDef = list[cycleIndex % list.length];
  return {
    level: 7,
    difficultyName: eventDef.diff,
    timePerKey: eventDef.time,
    text: eventDef.text,
    theme: THEMES[eventDef.theme] || THEMES[0],
    isSpecialEvent: true,
  };
};

export interface LevelSettings {
  level: number;
  difficultyName: string;
  timePerKey: number;
  text: string;
  theme: any;
  isSpecialEvent?: boolean;
  category?: 'classic' | 'event' | 'words' | 'unlockable';
  unlockLevel?: number;
}

export const getLevels = (lang: Language): LevelSettings[] => {
  const activeEventEn = Object.assign(getActiveWeeklyEvent('en'), { category: 'event' as const });
  const activeEventDe = Object.assign(getActiveWeeklyEvent('de'), { category: 'event' as const });

  if (lang === 'en') {
    return [
      {
        level: 1, category: 'classic', difficultyName: "Easy", timePerKey: 1000,
        text: "slow is boring.[RIGHT]lets see what you can do. show me.",
        theme: THEMES[6],
      },
      {
        level: 2, category: 'classic', difficultyName: "Normal", timePerKey: 800,
        text: "not bad, but that was nothing.[LEFT]concentrate now.[RIGHT]eyes open.",
        theme: THEMES[3],
      },
      {
        level: 3, category: 'classic', difficultyName: "Advanced", timePerKey: 600,
        text: "your fingers are already trembling.[RIGHT]admit it.[LEFT][LEFT]i see every one of your mistakes.",
        theme: THEMES[7],
      },
      {
        level: 4, category: 'classic', difficultyName: "Hard", timePerKey: 400,
        text: "one mistake and everything is gone.[RIGHT]do not breathe too loudly.[LEFT]i am already waiting for your mistake.",
        theme: THEMES[2],
      },
      {
        level: 5, category: 'classic', difficultyName: "Extreme", timePerKey: 300,
        text: "almost no one makes it this far.[LEFT]you know why.[RIGHT][LEFT]do not lift your fingers.[RIGHT]keep going.",
        theme: THEMES[4],
      },
      {
        level: 6, category: 'classic', difficultyName: "Impossible", timePerKey: 150,
        text: "do not think.[LEFT][RIGHT]just type.[LEFT][LEFT]no mercy no pause no mistakes.[RIGHT][RIGHT][LEFT]now. you did it",
        theme: THEMES[2],
      },
      activeEventEn,
      {
        level: 8, category: 'words', difficultyName: "Dionysoft", timePerKey: 1200,
        text: "dionysoft",
        theme: THEMES[8],
      },
      {
        level: 9, category: 'words', difficultyName: "Speed", timePerKey: 800,
        text: "speed",
        theme: THEMES[1],
      },
      {
        level: 10, category: 'words', difficultyName: "Flawless", timePerKey: 600,
        text: "flawless",
        theme: THEMES[2],
      },
      {
        level: 11, category: 'words', difficultyName: "Lightning", timePerKey: 400,
        text: "lightning",
        theme: THEMES[3],
      },
      {
        level: 12, category: 'words', difficultyName: "WPM", timePerKey: 200,
        text: "wpm",
        theme: THEMES[4],
      },
      {
        level: 21, category: 'unlockable', unlockLevel: 2, difficultyName: "Unlockable 1", timePerKey: 500,
        text: "this is extra content.",
        theme: THEMES[0],
      },
      {
        level: 22, category: 'unlockable', unlockLevel: 5, difficultyName: "Unlockable 2", timePerKey: 300,
        text: "you need level five for this.[RIGHT]dont get too comfortable.",
        theme: THEMES[1],
      },
      {
        level: 23, category: 'unlockable', unlockLevel: 10, difficultyName: "Unlockable 3", timePerKey: 150,
        text: "level ten reached.[LEFT]but you are still so slow.[RIGHT]faster.",
        theme: THEMES[2],
      },
      {
        level: 24, category: 'unlockable', unlockLevel: 20, difficultyName: "Unlockable 4", timePerKey: 80,
        text: "level twenty.[RIGHT]only a few make it here.[LEFT]prove yourself.",
        theme: THEMES[4],
      },
      {
        level: 25, category: 'unlockable', unlockLevel: 50, difficultyName: "Unlockable 5", timePerKey: 30,
        text: "level fifty.[LEFT]impossible.[RIGHT]pure speed.",
        theme: THEMES[6],
      }
    ];
  } else {
    // German
    return [
      {
        level: 1, category: 'classic', difficultyName: "Einfach", timePerKey: 1000,
        text: "langsam ist langweilig.[RIGHT]mal sehen was du kannst. zeig es mir.",
        theme: THEMES[6],
      },
      {
        level: 2, category: 'classic', difficultyName: "Normal", timePerKey: 800,
        text: "nicht schlecht, aber das war noch nichts.[LEFT]konzentrier dich jetzt.[RIGHT]augen auf.",
        theme: THEMES[3],
      },
      {
        level: 3, category: 'classic', difficultyName: "Fortgeschritten", timePerKey: 600,
        text: "deine finger zittern schon.[RIGHT]gib es zu.[LEFT][LEFT]ich sehe jeden deiner fehler.",
        theme: THEMES[7],
      },
      {
        level: 4, category: 'classic', difficultyName: "Schwer", timePerKey: 400,
        text: "ein fehler und alles ist weg.[RIGHT]atme nicht zu laut.[LEFT]ich warte schon auf deinen fehler.",
        theme: THEMES[2],
      },
      {
        level: 5, category: 'classic', difficultyName: "Extrem", timePerKey: 300,
        text: "fast niemand kommt bis hier.[LEFT]du weißt selbst warum.[RIGHT][LEFT]finger nicht heben.[RIGHT]weitermachen.",
        theme: THEMES[4],
      },
      {
        level: 6, category: 'classic', difficultyName: "Unmöglich", timePerKey: 150,
        text: "nicht denken.[LEFT][RIGHT]einfach nur tippen.[LEFT][LEFT]keine gnade keine pause kein fehler.[RIGHT][RIGHT][LEFT]jetzt. geschafft",
        theme: THEMES[2],
      },
      activeEventDe,
      {
        level: 8, category: 'words', difficultyName: "Dionysoft", timePerKey: 1200,
        text: "dionysoft",
        theme: THEMES[8],
      },
      {
        level: 9, category: 'words', difficultyName: "Schnelligkeit", timePerKey: 800,
        text: "schnelligkeit",
        theme: THEMES[1],
      },
      {
        level: 10, category: 'words', difficultyName: "Fehlerfrei", timePerKey: 600,
        text: "fehlerfrei",
        theme: THEMES[2],
      },
      {
        level: 11, category: 'words', difficultyName: "Blitzschnell", timePerKey: 400,
        text: "blitzschnell",
        theme: THEMES[3],
      },
      {
        level: 12, category: 'words', difficultyName: "WPM", timePerKey: 200,
        text: "wpm",
        theme: THEMES[4],
      },
      {
        level: 21, category: 'unlockable', unlockLevel: 2, difficultyName: "Freischaltbar 1", timePerKey: 500,
        text: "das ist extra inhalt.",
        theme: THEMES[0],
      },
      {
        level: 22, category: 'unlockable', unlockLevel: 5, difficultyName: "Freischaltbar 2", timePerKey: 300,
        text: "du brauchst level fünf dafür.[RIGHT]mach dich nicht bequem.",
        theme: THEMES[1],
      },
      {
        level: 23, category: 'unlockable', unlockLevel: 10, difficultyName: "Freischaltbar 3", timePerKey: 150,
        text: "level zehn erreicht.[LEFT]aber du bist immer noch so langsam.[RIGHT]schneller.",
        theme: THEMES[2],
      },
      {
        level: 24, category: 'unlockable', unlockLevel: 20, difficultyName: "Freischaltbar 4", timePerKey: 80,
        text: "level zwanzig.[RIGHT]nur wenige schaffen es hierher.[LEFT]beweise dich.",
        theme: THEMES[4],
      },
      {
        level: 25, category: 'unlockable', unlockLevel: 50, difficultyName: "Freischaltbar 5", timePerKey: 30,
        text: "level fünfzig.[LEFT]unmöglich.[RIGHT]reine geschwindigkeit.",
        theme: THEMES[6],
      }
    ];
  }
};

