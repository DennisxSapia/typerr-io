import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { BookOpen, X, Play, Share2, Swords } from "lucide-react";
import { Leaderboard } from "./components/Leaderboard";
import { MainMenuLeaderboard } from "./components/MainMenuLeaderboard";
import { MainMenuLevelSelect } from "./components/MainMenuLevelSelect";
import { Auth } from "./components/Auth";
import { Account } from "./components/Account";
import { PublicProfile } from "./components/PublicProfile";
import { Imprint } from "./components/Imprint";
import { Privacy } from "./components/Privacy";
import { Instructions } from "./components/Instructions";
import { OnlinePlayersList } from "./components/OnlinePlayersList";
import { PlayerOfWeekShowcase } from "./components/PlayerOfWeekShowcase";
import { MultiplayerModals } from "./components/MultiplayerModals";
import { TermsModal } from "./components/TermsModal";
import { MobileKeyboard } from "./components/MobileKeyboard";
import MatrixBackground from "./components/MatrixBackground";
import { getSupabase, submitLevelTime, submitScore, fetchTopScores, fetchGhostByNicknameAndLevel, awardXP, fetchUserPublicStats, submitCommunityLevelTime } from "./lib/supabase";
import { useMultiplayer } from "./lib/useMultiplayer";
import { Language, detectLanguage, TRANSLATIONS, setLanguage } from "./lib/i18n";
import { GhostChallengeModal } from "./components/GhostChallengeModal";
import { getLevels, THEMES } from "./lib/levels";
import { LevelUpOverlay } from "./components/LevelUpOverlay";
import { UserQuest, fetchDailyQuests, updateQuestProgress, QUEST_DEFINITIONS } from "./lib/quests";
import { DailyQuestsPanel } from "./components/DailyQuestsPanel";
import { QuestCompletionToast } from "./components/QuestCompletionToast";
import { generateCommunityLevelText, CommunityLevelDefinition } from "./lib/communityLevels";
import { encodeEvent, decodeEvent } from "./lib/replay";
import { CommunityLevelsBrowser } from "./components/CommunityLevelsBrowser";


export const blockCompletedBase = {
  "--block-color": "#334155",
  "--block-shadow": "#0f172a",
  "--block-stripe": "rgba(0,0,0,0.02)",
} as React.CSSProperties;
export const blockSpaceBase = {
  "--block-color": "#ca8a04",
  "--block-shadow": "#854d0e",
  "--block-stripe": "rgba(0,0,0,0.15)",
} as React.CSSProperties;
export const blockSpaceActiveBase = {
  "--block-color": "#eab308",
  "--block-shadow": "#a16207",
  "--block-stripe": "rgba(0,0,0,0.2)",
} as React.CSSProperties;





export const TILE_SIZE = 64;
export const PLAYER_SIZE = 28;

export interface Token {
  type: "LEFT" | "RIGHT" | "SPACE" | "CHAR";
  display: string;
  key: string;
}



export function parseLevelText(text: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < text.length) {
    if (text.startsWith("[LEFT]", i)) {
      tokens.push({ type: "LEFT", display: "←", key: "ArrowLeft" });
      i += 6;
    } else if (text.startsWith("[RIGHT]", i)) {
      tokens.push({ type: "RIGHT", display: "→", key: "ArrowRight" });
      i += 7;
    } else if (text[i] === " ") {
      tokens.push({ type: "SPACE", display: "SPACE", key: " " });
      i++;
    } else {
      tokens.push({ type: "CHAR", display: text[i], key: text[i] });
      i++;
    }
  }
  return tokens;
}

export function buildPath(tokens: Token[]) {
  let x = 0;
  let y = 0;
  const p = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === "LEFT") {
      x -= 1;
      y += 1;
    } else if (token.type === "RIGHT") {
      x += 1;
      y += 1;
    } else if (token.type === "SPACE") {
      y += 2;
    } else {
      y += 1;
    }
    p.push({ x, y, token });
  }
  return p;
}

const LanguageSwitcher = ({ language, hiddenOnMobile }: { language: string, hiddenOnMobile?: boolean }) => (
  <div className={`fixed top-14 right-6 lg:top-8 lg:right-8 z-[200] pointer-events-auto ${hiddenOnMobile ? "hidden md:block" : ""}`}>
    <div className="flex bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-full p-1 shadow-lg">
      <button 
        onClick={() => setLanguage('de')} 
        className={`px-3 py-1.5 rounded-full text-xs font-black transition-all ${language === 'de' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.6)]' : 'text-slate-400 hover:text-slate-200'} cursor-pointer`}
      >
        DE
      </button>
      <button 
        onClick={() => setLanguage('en')} 
        className={`px-3 py-1.5 rounded-full text-xs font-black transition-all ${language === 'en' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.6)]' : 'text-slate-400 hover:text-slate-200'} cursor-pointer`}
      >
        EN
      </button>
    </div>
  </div>
);

export default function App() {
  const [language, setLanguageState] = useState<Language>(detectLanguage());
  const t = TRANSLATIONS[language];
  const LEVELS = useMemo(() => getLevels(language), [language]);

  const marathonGhostBoundaries = useMemo(() => {
    const boundaries: number[] = [];
    let total = 0;
    for (let i = 0; i < LEVELS.length - 1; i++) {
        total += parseLevelText(LEVELS[i].text).length;
        boundaries.push(total);
    }
    return boundaries;
  }, [LEVELS]);

  useEffect(() => {
    const handleLangChange = () => setLanguageState(detectLanguage());
    window.addEventListener('languagechange_custom', handleLangChange);
    return () => window.removeEventListener('languagechange_custom', handleLangChange);
  }, []);

  const [eventTimeLeft, setEventTimeLeft] = useState("");


  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    fetchTopScores().catch(console.error);
  }, []);



  useEffect(() => {
    const getEventEndTime = () => {
      const defaultTarget = new Date("2026-05-27T18:00:00Z").getTime();
      const now = Date.now();
      if (now < defaultTarget) {
        return defaultTarget;
      }
      const diff = now - defaultTarget;
      const cycle = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
      return defaultTarget + cycle * 7 * 24 * 60 * 60 * 1000;
    };

    const updateTime = () => {
      const target = getEventEndTime();
      const diff = target - Date.now();
      if (diff <= 0) {
        setEventTimeLeft(TRANSLATIONS[language].eventEnded);
        return;
      }
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      const hours = Math.floor(
        (diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000),
      );
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((diff % (60 * 1000)) / 1000);

      setEventTimeLeft(
        `${days}d ${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`,
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [language]);

  const [gameState, setGameState] = useState<
    "menu" | "playing" | "gameover" | "cleared" | "victory" | "replay"
  >("menu");
  const [earnedXp, setEarnedXp] = useState<number>(0);
  const [totalXp, setTotalXp] = useState<number | null>(null);
  const playerLevel = totalXp ? Math.floor(Math.sqrt(totalXp / 100)) + 1 : 1;
  const [levelIndex, setLevelIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const comboRef = useRef(0);

  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1);
  const [replayDisplayTime, setReplayDisplayTime] = useState("");
  const [replayDisplayWpm, setReplayDisplayWpm] = useState("0");
  
  const replayStatsRef = useRef({
      charsTypedSinceLastSecond: 0,
      lastWpmUpdateTime: 0,
  });
  const [timeBonuses, setTimeBonuses] = useState<
    { id: number; text: string }[]
  >([]);
  const [isJumping, setIsJumping] = useState(false);
  const [plusOnes, setPlusOnes] = useState<{ id: number }[]>([]);
  const [shake, setShake] = useState(false);
  
  useEffect(() => {
    // Reset typing progress if language changes while playing to prevent out of bounds errors
    if (gameState === "playing") {
      setCurrentIndex(0);
      currentIndexRef.current = 0;
      setPlusOnes([]);
    }
  }, [language, gameState]);
  const [mistake, setMistake] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isMobile = useMemo(() => /Mobi|Android/i.test(navigator.userAgent), []);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [readingLevelIndex, setReadingLevelIndex] = useState<number | null>(null);
  const [showAccount, setShowAccount] = useState(false);
  const [showImprint, setShowImprint] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showOnlinePlayers, setShowOnlinePlayers] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<{username: string, uuid: string} | null>(null);
  const [showCommunityBrowser, setShowCommunityBrowser] = useState(false);
  const [activeCommunityLevel, setActiveCommunityLevel] = useState<CommunityLevelDefinition | null>(null);
  const [onlineUsersCount, setOnlineUsersCount] = useState<number>(0);
  const [onlinePresencesState, setOnlinePresencesState] = useState<any>({});

  const [onlineUsers, setOnlineUsers] = useState<{username: string, isUser: boolean, presenceId?: string, statusDesc?: string}[]>([]);
  const [isPractice, setIsPractice] = useState(false);
  const [ghostState, setGhostState] = useState<{ active: boolean, username: string, replayData: number[], progress: number, finished: boolean, time_ms: number, lastUpdateTime: number, runningIndex: number, hasTriggeredError: boolean, ghostLevel: number } | null>(null);
  const [incomingGhostChallenge, setIncomingGhostChallenge] = useState<{username: string, level: number, ghostData: any, language: string} | null>(null);
  const ghostAnimationRef = useRef<number>();
  const [user, setUser] = useState<{ username: string; uuid: string } | null>(
    null,
  );

  const [quests, setQuests] = useState<UserQuest[]>([]);
  const [completedQuestNotifs, setCompletedQuestNotifs] = useState<UserQuest[]>([]);
  const questsRef = useRef<UserQuest[]>([]);
  useEffect(() => { questsRef.current = quests; }, [quests]);
  useEffect(() => {
    if (user?.uuid && !user.uuid.startsWith('guest_')) {
      fetchDailyQuests(user.uuid).then(setQuests);
    } else {
      setQuests([]);
    }
  }, [user?.uuid]);

  useEffect(() => {
    if (user?.uuid) {
      const globalSeen = localStorage.getItem(`typerr_tutorial_seen_global_v2`);
      const userSeen = localStorage.getItem(`typerr_tutorial_seen_v2_${user.uuid}`);
      if (!globalSeen && !userSeen) {
        setShowInstructions(true);
        localStorage.setItem(`typerr_tutorial_seen_global_v2`, 'true');
      } else if (!globalSeen && userSeen) {
        // Migrate old users so they don't see it again
        localStorage.setItem(`typerr_tutorial_seen_global_v2`, 'true');
      }

      const cachedXp = localStorage.getItem(`typerr_xp_${user.uuid}`);
      if (cachedXp) {
        setTotalXp(parseInt(cachedXp, 10));
      }
      fetchUserPublicStats(user.uuid).then((stats: any) => {
        if (stats && typeof stats.xp === 'number') {
          setTotalXp(stats.xp);
          localStorage.setItem(`typerr_xp_${user.uuid}`, stats.xp.toString());
        }
      }).catch(console.error);
    }
  }, [user]);

  const handleAwardXp = useCallback((amount: number) => {
    if (!user?.uuid) return;
    awardXP(user.uuid, amount).catch(console.error);
    setEarnedXp((prev) => prev + amount);
    setTotalXp((prev) => {
      const next = (prev || 0) + amount;
      localStorage.setItem(`typerr_xp_${user.uuid}`, next.toString());
      return next;
    });
  }, [user]);

  const handleQuestProgress = useCallback(async (type: string, amount: number, isAbsolute: boolean = false) => {
    if (!user?.uuid || user.uuid.startsWith('guest_')) return;
    const currentQuests = questsRef.current;
    if (currentQuests.length === 0) return;
    
    const relevantQuests = currentQuests.filter(q => !q.completed && QUEST_DEFINITIONS.find(d => d.id === q.quest_id)?.type === type);
    if (relevantQuests.length === 0) return;
    
    let updatedQuests = [...currentQuests];
    let xpGained = 0;
    let didUpdate = false;

    for (const q of relevantQuests) {
      const completedNow = await updateQuestProgress(user.uuid, q, amount, isAbsolute);
      didUpdate = true;
      const index = updatedQuests.findIndex(uq => uq.quest_id === q.quest_id);
      if (index !== -1) {
        const newProg = isAbsolute ? amount : updatedQuests[index].progress + amount;
        updatedQuests[index] = { 
          ...updatedQuests[index], 
          progress: Math.min(newProg, updatedQuests[index].target),
          completed: updatedQuests[index].completed || completedNow 
        };
      }
      if (completedNow) {
        xpGained += q.xp_reward;
        setCompletedQuestNotifs(prev => {
           if (prev.find(p => p.quest_id === q.quest_id)) return prev;
           return [...prev, { ...q, completed: true }];
        });
      }
    }
    
    if (didUpdate) {
      setQuests(updatedQuests);
    }
    if (xpGained > 0) {
      handleAwardXp(xpGained);
    }
  }, [user?.uuid, handleAwardXp]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ghostName = params.get("ghost");
    const levelParam = params.get("level");
    const langParam = params.get("lang") || detectLanguage();
    
    if (ghostName && levelParam) {
      const level = parseInt(levelParam, 10);
      if (!isNaN(level)) {
        fetchGhostByNicknameAndLevel(ghostName, level, langParam).then(ghost => {
          if (ghost && ghost.replay_data) {
            setIncomingGhostChallenge({
              username: ghostName,
              level,
              ghostData: ghost,
              language: langParam
            });
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            console.warn("Ghost not found or no replay data available.");
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }).catch(err => console.error("Error fetching ghost:", err));
      }
    }
  }, []);

  const [finalScore, setFinalScore] = useState(0);
  const [authReady, setAuthReady] = useState(false);
  const [scoreResult, setScoreResult] = useState<{
    isNewBest: boolean;
    previousBest?: number;
    previousBestUs?: number;
  } | null>(null);

  const replayRecordingRef = useRef<number[]>([]);
  const replayLastTimeRef = useRef<number>(0);
  const replayPlaybackDataRef = useRef<number[]>([]);
  const replayPlaybackRunningIndexRef = useRef(0);
  const isMistakeRecordedRef = useRef<boolean>(false);
  const isReplaySessionRef = useRef<boolean>(false);
  const hasSubmittedScoreRef = useRef<boolean>(false);


  const levelStartTimeRef = useRef<number | null>(null);
  const levelTimeMsRef = useRef<number>(0);
  const levelStartTimeUsRef = useRef<number | null>(null);
  const levelTimeUsRef = useRef<number>(0);
  const marathonStartTimeRef = useRef<number | null>(null);
  const marathonTimeMsRef = useRef<number>(0);
  const presenceIdRef = useRef(
    `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  );
  const deviceIdRef = useRef<string>((() => {
    let rawDeviceId = localStorage.getItem("device_id");
    if (!rawDeviceId) {
      rawDeviceId = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("device_id", rawDeviceId);
    }
    return rawDeviceId;
  })() as string);

  useEffect(() => {
    // we already initialized the ref
  }, []);

  const {
      mpState,
      incomingChallenge,
      sendChallenge,
      acceptChallenge,
      declineChallenge,
      sendLevelSelect,
      emitProgress,
      emitFinish,
      leaveMatch,
      rematch,
      cancelChallenge
  } = useMultiplayer(
      presenceIdRef.current,
      user?.username || 'Gast',
      (levelIdx) => {
          startGame(levelIdx, true); // Practice true = only current level
      },
      (progress) => { /* no-op, mpState handles opponent progress display */ },
      (time) => { 
          // opponent finished before us
          setGameState("gameover");
      },
      () => { 
          alert(t.opponentLeft); 
          setGameState("menu");
      },
      () => {
          setGameState("menu");
          setShowLeaderboard(false);
          setShowLevelSelect(false);
      }
  );

  const presenceChannelRef = useRef<any>(null);
  const [isPresenceSubscribed, setIsPresenceSubscribed] = useState(false);

  useEffect(() => {
    try {
      const supabase = getSupabase();
      const channel = supabase.channel("online-players", {
        config: {
          presence: {
            key: presenceIdRef.current,
          },
        },
      });

      presenceChannelRef.current = channel;

      channel
        .on("presence", { event: "sync" }, () => {
          setOnlinePresencesState(structuredClone(channel.presenceState()));
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            setIsPresenceSubscribed(true);
          }
        });

      return () => {
        setIsPresenceSubscribed(false);
        supabase.removeChannel(channel);
        presenceChannelRef.current = null;
      };
    } catch (error) {
      console.warn("Could not setup presence tracking", error);
    }
  }, []);

  useEffect(() => {
    const pList: { key: string, p: any }[] = [];
    for (const key in onlinePresencesState) {
      const presences = onlinePresencesState[key];
      if (presences && presences.length > 0) {
        const bestPresence = presences.reduce((best: any, current: any) => {
          if (!best) return current;
          if (current.isUser && !best.isUser) return current;
          if (!current.isUser && best.isUser) return best;
          
          const isActive = (p: any) => p.gameState === "playing" || p.isLobby;
          
          if (isActive(current) && !isActive(best)) return current;
          return best;
        }, presences[0]);
        pList.push({ key, p: bestPresence });
      }
    }

    pList.sort((a, b) => (a.p.isUser === b.p.isUser ? 0 : a.p.isUser ? -1 : 1));

    const uniqueUsers = new Map<string, {username: string, isUser: boolean, presenceId?: string, statusDesc?: string, __raw: any}>();
    const seenDevices = new Set<string>();
    const myKey = presenceIdRef.current;
    
    for (const item of pList) {
      const { key, p } = item;
      
      if (p.deviceId && seenDevices.has(p.deviceId) && !p.isUser) {
        continue;
      }
      if (p.deviceId) seenDevices.add(p.deviceId);

      const identityKey = p.isUser ? `user:${p.username}` : `guest:${p.deviceId || key}`;
      
      let desc = t.inMainMenu;
      if (p.gameState === "playing" && p.levelIndex !== undefined) {
        if (p.isPractice) desc = `${t.playingLevel} ${p.levelIndex + 1}`;
        else desc = `${t.playingMarathon} ${p.levelIndex + 1}`;
      } else if (p.isLobby) {
        desc = `${t.inMainMenu} ${t.inLobby}`;
      }

      if (!uniqueUsers.has(identityKey)) {
        uniqueUsers.set(identityKey, {
          username: (p.isUser && p.username) ? p.username : t.guest,
          isUser: !!p.isUser,
          presenceId: key,
          statusDesc: desc,
          __raw: p
        });
      } else {
        const existing = uniqueUsers.get(identityKey)!;
        const isActive = (pObj: any) => pObj.gameState === "playing" || pObj.isLobby;
        
        if (isActive(p) && !isActive(existing.__raw)) {
          existing.statusDesc = desc;
          existing.__raw = p;
        }

        if (p.isUser) {
          existing.isUser = true;
          existing.username = p.username || t.guest;
        }
        
        if (key === myKey) {
           existing.presenceId = key;
        } else if (isActive(p) && !isActive(existing.__raw)) {
           if (existing.presenceId !== myKey) {
             existing.presenceId = key;
           }
        }
      }
    }
    
    setOnlineUsersCount(uniqueUsers.size);
    setOnlineUsers(Array.from(uniqueUsers.values()));
  }, [onlinePresencesState, t]);

  useEffect(() => {
    if (!presenceChannelRef.current || !isPresenceSubscribed) return;
    
    // Only send structural data, not localized strings
    presenceChannelRef.current.track({
      username: (user?.username && !user.uuid.startsWith('guest_')) ? user.username : null,
      online_at: new Date().toISOString(),
      isUser: !!user && !user.uuid.startsWith('guest_'),
      deviceId: deviceIdRef.current,
      gameState: gameState,
      isPractice: isPractice,
      levelIndex: levelIndex,
      isLobby: mpState.status !== 'idle'
    }).catch((err: any) => console.error("Presence track error: ", err));
  }, [gameState, levelIndex, isPractice, mpState.status, user, isPresenceSubscribed]);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = getSupabase();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          // Wir holen den originalen Namen aus den Metadaten (display_name)
          // Falls nicht vorhanden (z.B. alter Account), nutzen wir den E-Mail-Teil
          const username =
            session.user.user_metadata?.display_name ||
            session.user.email?.split("@")[0] ||
            "Unbekannt";
          setUser({ username, uuid: session.user.id });
        }
      } catch (e) {
        console.error("Error checking auth session:", e);
      } finally {
        setAuthReady(true);
      }
    };
    checkUser();
  }, []);

  const handleAuthSuccess = (username: string, uuid: string) => {
    setUser({ username, uuid });
  };

  const handleMobileVirtualKey = (key: string) => {
      // Small debounce to prevent double-firings from touch events
      const now = Date.now();
      if ((window as any)._lastVirtualKeyTime && now - (window as any)._lastVirtualKeyTime < 20) {
          return;
      }
      (window as any)._lastVirtualKeyTime = now;

      const ev = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
      Object.defineProperty(ev, "isMobileInput", { value: true });
      window.dispatchEvent(ev);
  };

  const handleLogout = async () => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    setShowAccount(false);
  };

  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef(0);
  const remainingTimeRef = useRef(3000);
  const maxTimeRef = useRef(5000);

  const tokens = useMemo(() => {
    if (activeCommunityLevel) {
        return parseLevelText(generateCommunityLevelText(activeCommunityLevel.seed, activeCommunityLevel.length, activeCommunityLevel.language));
    }
    return parseLevelText(LEVELS[levelIndex].text);
  }, [levelIndex, LEVELS, activeCommunityLevel]);

  const path = useMemo(() => buildPath(tokens), [tokens]);

  const resetLevel = () => {
    currentIndexRef.current = 0;
    setCurrentIndex(0);
    setMistake(false);
    setTimeLeft(1);
  };

  const replayOriginalTimeMsRef = useRef<number | undefined>();
  const replayOriginalScoreRef = useRef<number | undefined>();

  const playReplay = (replayData: number[], targetLevelIndex: number, isMarathonReplay = false, originalTimeMs?: number, originalScore?: number) => {
    setGhostState(null);
    replayOriginalTimeMsRef.current = originalTimeMs;
    replayOriginalScoreRef.current = originalScore;
    setIsPractice(!isMarathonReplay);
    setScoreResult(null);

    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setMistake(false);
    setTimeLeft(1);
    setReplayDisplayTime(targetLevelIndex === 7 ? "0ms" : "0.00s");
    setReplayDisplayWpm("0");
    replayStatsRef.current = {
        charsTypedSinceLastSecond: 0,
        lastWpmUpdateTime: 0,
    };
    
    if (isMarathonReplay && targetLevelIndex > 0) {
        levelStartTimeRef.current = Date.now();
        levelStartTimeUsRef.current = Math.round(performance.now() * 1000);
    } else {
        levelStartTimeRef.current = null;
        levelStartTimeUsRef.current = null;
    }
    levelTimeMsRef.current = 0;
    levelTimeUsRef.current = 0;

    setCombo(0);
    comboRef.current = 0;
    marathonStartTimeRef.current = Date.now();
    marathonTimeMsRef.current = 0;
    setFinalScore(0);
    
    const sanitizedReplayData = [...replayData];
    if (sanitizedReplayData.length > 0 && targetLevelIndex === 0) {
        // Cap initial idle delay for backwards compatibility with old records
        const first = sanitizedReplayData[0];
        if (Math.abs(first) > 500) {
            sanitizedReplayData[0] = Math.sign(first) * 200;
        }
    }
    
    replayPlaybackDataRef.current = sanitizedReplayData;
    replayPlaybackRunningIndexRef.current = 0;
    isReplaySessionRef.current = true;
    setLevelIndex(targetLevelIndex);
    
    const targetTimePerKey = activeCommunityLevel ? Math.round(12000 / Math.max(10, activeCommunityLevel.wpm || 60)) : LEVELS[targetLevelIndex].timePerKey;
    maxTimeRef.current = activeCommunityLevel ? Math.max(300, targetTimePerKey * 10) : Math.max(2000, targetTimePerKey * 4);
    remainingTimeRef.current = maxTimeRef.current;
    lastFrameTimeRef.current = performance.now();
    setGameState("replay");
  };

  const challengeGhost = (username: string, level: number, ghostReplayData: number[], timeMs: number) => {
      setGhostState({
           active: true,
           username: username,
           replayData: ghostReplayData,
           progress: 0,
           time_ms: timeMs,
           finished: false,
           lastUpdateTime: performance.now(),
           runningIndex: 0,
           hasTriggeredError: false,
           ghostLevel: level
      });
      startGame(level === 0 ? 0 : (level - 1), level > 0, false, true);
      setShowLeaderboard(false);
  };

  const startGame = (targetLevelIndex?: number, practice = false, replaying = false, isGhostMatch = false, communityLevel?: CommunityLevelDefinition | null) => {
    setActiveCommunityLevel(communityLevel || null);
    const startIdx = targetLevelIndex ?? levelIndex;
    setIsPractice(practice);
    setScoreResult(null);
    setEarnedXp(0);
    if (!replaying) isReplaySessionRef.current = false;
    if (!isGhostMatch) setGhostState(null);


    // Always reset level state
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setMistake(false);
    setTimeLeft(1);
    
    // In marathon mode (not practice), levels after the first should start their timer immediately
    if (!practice && startIdx > 0) {
      levelStartTimeRef.current = Date.now();
      levelStartTimeUsRef.current = Math.round(performance.now() * 1000);
    } else {
      levelStartTimeRef.current = null;
      levelStartTimeUsRef.current = null;
    }
    
    levelTimeMsRef.current = 0;
    levelTimeUsRef.current = 0;

    // Only reset global game state if starting from the beginning or in practice mode
    if (targetLevelIndex === 0 || practice) {
      setCombo(0);
      comboRef.current = 0;
      marathonStartTimeRef.current = null;
      marathonTimeMsRef.current = 0;
      setFinalScore(0);
      replayRecordingRef.current = [];
      replayLastTimeRef.current = Date.now();
      isMistakeRecordedRef.current = false;
      hasSubmittedScoreRef.current = false;
    }
    
    setLevelIndex(startIdx);

    const activeCommLvl = communityLevel !== undefined ? communityLevel : activeCommunityLevel;
    const timePerKey = activeCommLvl ? Math.round(12000 / Math.max(10, activeCommLvl.wpm || 60)) : LEVELS[startIdx].timePerKey;
    maxTimeRef.current = activeCommLvl ? Math.max(300, timePerKey * 10) : Math.max(2000, timePerKey * 4);
    remainingTimeRef.current = maxTimeRef.current;
    lastFrameTimeRef.current = performance.now();
    setGameState(replaying ? "replay" : "playing");
  };

  const handleGameOver = () => {
    if (isReplaySessionRef.current) {
        setFinalScore(replayOriginalScoreRef.current !== undefined ? replayOriginalScoreRef.current : comboRef.current);
        setGameState("replay_finished");
    } else {
        setFinalScore(comboRef.current);
        setGameState("gameover");
    }
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  // Calculate cumulative tokens for a marathon ghost
  const cumulativeTokensUpToLevel = useMemo(() => {
     let total = 0;
     for (let i = 0; i < levelIndex; i++) {
         const lvl = LEVELS[i];
         if (!lvl) continue;
         const lvlTokens = parseLevelText(lvl.text);
         total += lvlTokens.length;
     }
     return total;
  }, [levelIndex]);

  const handleLevelCleared = (isReplayingNow = false) => {
    if (isReplayingNow) {
       if (replayPlaybackRunningIndexRef.current >= replayPlaybackDataRef.current.length) {
         setFinalScore(replayOriginalScoreRef.current !== undefined ? replayOriginalScoreRef.current : comboRef.current);
         setGameState("replay_finished");
         return;
       }
    }
    
    setGameState("cleared");
    setTimeout(() => {
      setLevelIndex((prev) => {
        const next = prev + 1;
        if (next < LEVELS.length) {
          startGame(next, false, isReplayingNow, true); // Keep ghost attached!
        } else {
          setGameState(isReplayingNow ? "replay_finished" : "victory");
        }
        return next;
      });
    }, 3000);
  };

  // Keyboard and Input Loop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      // Menu controls
      if (
        gameState === "menu" &&
        !showLeaderboard &&
        !showLevelSelect &&
        e.key === " "
      ) {
        e.preventDefault();
        startGame(0, false);
        return;
      }

      // Escape to return to menu
      if (
        ["gameover", "victory", "menu", "replay", "replay_finished"].includes(gameState) &&
        e.key === "Escape"
      ) {
        if (showLeaderboard) setShowLeaderboard(false);
        if (showLevelSelect) setShowLevelSelect(false);
        if (showAccount) setShowAccount(false);
        if (showImprint) setShowImprint(false);
        if (showPrivacy) setShowPrivacy(false);
        if (showInstructions) setShowInstructions(false);
        if (showOnlinePlayers) setShowOnlinePlayers(false);
        if (readingLevelIndex !== null) {
            setReadingLevelIndex(null);
            return;
        }
        if (gameState !== "menu") {
            leaveMatch();
            setGameState("menu");
            setGhostState(null);
        }
      }

      if (
        ["gameover", "victory"].includes(gameState) &&
        e.key.toLowerCase() === "r"
      ) {
        if (mpState.matchChannel && mpState.status !== 'playing') {
           rematch();
        } else {
            if (ghostState?.active) {
                challengeGhost(ghostState.username, ghostState.ghostLevel, ghostState.replayData, ghostState.time_ms);
            } else {
                startGame(isPractice ? levelIndex : 0, isPractice, false, false, activeCommunityLevel);
            }
        }
        return;
      }

      // Game controls
      if ((gameState !== "playing" && gameState !== "replay") || e.ctrlKey || e.altKey || e.metaKey) return;

      // Ensure that mobile highscores are only achieved with the virtual keyboard
      if (isMobile && gameState === "playing" && e.isTrusted) {
          if (e.key !== "Escape" && e.key.toLowerCase() !== "r") {
               e.preventDefault();
               return; // Ignore physical keyboard inputs completely to prevent cheating on mobile mode
          }
      }

      const isReplayingNow = gameState === "replay";
      const isRealInput = e.isTrusted || (e as any).isMobileInput;
      if (isReplayingNow && isRealInput) return; // ignore real user input during replay

      const currentTargetIndex = currentIndexRef.current;
      const token = tokens[currentTargetIndex];
      if (!token) return;

      const expected = token.key;
      const pressed = e.key;
      let isCorrect = false;

      if (expected === " " && pressed === " ") {
        e.preventDefault();
        isCorrect = true;
      } else if (expected === "ArrowLeft" && e.key === "ArrowLeft") {
        e.preventDefault();
        isCorrect = true;
      } else if (expected === "ArrowRight" && e.key === "ArrowRight") {
        e.preventDefault();
        isCorrect = true;
      } else if (
        expected.length === 1 &&
        pressed.toLowerCase() === expected.toLowerCase()
      ) {
        isCorrect = true;
      }

      if (isCorrect) {
        if (isRealInput) {
            const now = Date.now();
            let delta = now - replayLastTimeRef.current;
            if (!levelStartTimeRef.current) {
                if (isPractice || levelIndex === 0) {
                    delta = 100; // Prevent recording idle time before the very first keystroke
                }
            }
            replayRecordingRef.current.push(encodeEvent(delta, false));
            replayLastTimeRef.current = now;
            isMistakeRecordedRef.current = false;
        }

        if (!levelStartTimeRef.current) {
          levelStartTimeRef.current = Date.now();
          levelStartTimeUsRef.current = Math.round(performance.now() * 1000);
          if (gameState === "replay") {
              replayStatsRef.current.lastWpmUpdateTime = Date.now();
          }
        }
        
        if (gameState === "replay") {
            replayStatsRef.current.charsTypedSinceLastSecond += 1;
        }

        if (!isPractice && !marathonStartTimeRef.current && levelIndex === 0) {
          marathonStartTimeRef.current = Date.now();
        }

        const bonus = activeCommunityLevel ? Math.round(12000 / Math.max(10, activeCommunityLevel.wpm || 60)) : LEVELS[levelIndex].timePerKey;
        remainingTimeRef.current = Math.min(
          maxTimeRef.current,
          remainingTimeRef.current + bonus,
        );

        const bonusText = `+${(bonus / 1000).toFixed(1)}s`;
        const bonusId = Date.now() + Math.random();
        setTimeBonuses((prev) => [...prev, { id: bonusId, text: bonusText }]);
        setTimeout(
          () => setTimeBonuses((prev) => prev.filter((p) => p.id !== bonusId)),
          600,
        );

        const nextCombo = comboRef.current + 1;
        comboRef.current = nextCombo;
        setCombo(nextCombo);

        if (token.type === "SPACE") {
          setIsJumping(true);
          setTimeout(() => setIsJumping(false), 150);
        }

        const id = Date.now() + Math.random();
        setPlusOnes((prev) => [...prev, { id }]);
        setTimeout(
          () => setPlusOnes((prev) => prev.filter((p) => p.id !== id)),
          800,
        );

        const nextIndex = currentTargetIndex + 1;
        currentIndexRef.current = nextIndex;
        setCurrentIndex(nextIndex);
        if (mpState.status === 'playing') emitProgress(nextIndex);

        if (nextIndex >= tokens.length) {
          if (levelStartTimeRef.current) {
            if (gameState === "replay") {
              const finalTime = replayOriginalTimeMsRef.current || (Date.now() - levelStartTimeRef.current);
              if (isPractice) {
                 levelTimeMsRef.current = finalTime; // Only force time for single-level runs
                 levelTimeUsRef.current = Math.round(finalTime * 1000);
                 const isWords = LEVELS[levelIndex]?.category === 'words';
                 setReplayDisplayTime(isWords ? `${(levelTimeUsRef.current ? parseFloat((levelTimeUsRef.current / 1000).toFixed(1)) : finalTime)}ms` : (finalTime / 1000).toFixed(2) + "s");
              } else {
                 levelTimeMsRef.current = Date.now() - levelStartTimeRef.current;
                 levelTimeUsRef.current = levelStartTimeUsRef.current ? Math.round(performance.now() * 1000) - levelStartTimeUsRef.current : levelTimeMsRef.current * 1000;
              }
            } else {
              levelTimeMsRef.current = Date.now() - levelStartTimeRef.current;
              levelTimeUsRef.current = levelStartTimeUsRef.current ? Math.round(performance.now() * 1000) - levelStartTimeUsRef.current : levelTimeMsRef.current * 1000;
            }
          }
          if (mpState.status === 'playing') emitFinish(levelTimeMsRef.current);
          if (isPractice || (!isPractice && levelIndex === 5)) {
            if (!isPractice) {
              setFinalScore(comboRef.current);
              if (!isReplayingNow && marathonStartTimeRef.current) {
                marathonTimeMsRef.current = Date.now() - marathonStartTimeRef.current;
              }
            }
            setGameState(isReplayingNow ? "replay_finished" : "victory");
          } else {
            handleLevelCleared(isReplayingNow);
          }
        }
      } else if (
        pressed.length === 1 ||
        ["ArrowLeft", "ArrowRight", " ", "WrongKey!"].includes(pressed)
      ) {
        if (isRealInput && !isMistakeRecordedRef.current) {
            const now = Date.now();
            let delta = now - replayLastTimeRef.current;
            if (!levelStartTimeRef.current) {
                if (isPractice || levelIndex === 0) {
                    delta = 100;
                }
            }
            replayRecordingRef.current.push(encodeEvent(delta, true));
            replayLastTimeRef.current = now;
            isMistakeRecordedRef.current = true;
        }

        if (pressed === " ") e.preventDefault();
        const msgList =
          t.errorMessages[Math.min(levelIndex, t.errorMessages.length - 1)];
        setErrorMessage(msgList[Math.floor(Math.random() * msgList.length)]);
        setMistake(true);
        handleQuestProgress('make_mistakes', 1);
        handleGameOver();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, tokens, levelIndex, handleQuestProgress]);

  // Handle automatic score submission
  useEffect(() => {
    if (user?.uuid && user?.username && !hasSubmittedScoreRef.current) {
      if (gameState === "victory" && isPractice && !isReplaySessionRef.current) {
        if (levelTimeMsRef.current > 0) {
          hasSubmittedScoreRef.current = true;
          if (activeCommunityLevel) {
            submitCommunityLevelTime(
              activeCommunityLevel.id,
              user.uuid,
              user.username,
              levelTimeMsRef.current
            ).then((res) => {
              if (res) setScoreResult(res);
            }).catch(console.error);
          } else {
              submitLevelTime(
                user.username,
                levelTimeMsRef.current,
                user.uuid,
                LEVELS[levelIndex].level,
                replayRecordingRef.current,
                language,
                levelTimeUsRef.current
              )
                .then((res) => {
                  if (res) setScoreResult(res);
                })
                .catch(console.error);
          }
            
          // Award XP based on level time and keystrokes (base XP for clear + speed bonus)
          const tokensLength = tokens.length;

          handleQuestProgress('type_letters', tokensLength);
          handleQuestProgress('finish_levels', 1);

          let totalXp = 0;
          if (LEVELS[levelIndex].category === 'words') {
              totalXp = 10;
              handleQuestProgress('finish_words_levels', 1);
          } else {
              const baseXP = tokensLength * 2;
              const wpm = (tokensLength * 12000) / levelTimeMsRef.current;
              const speedBonus = wpm > 80 ? Math.floor((wpm - 80) / 2) : 0;
              totalXp = baseXP + speedBonus;
              handleQuestProgress('wpm_any', wpm, true);
          }
          handleAwardXp(totalXp);
        }
      }

      if (
        (gameState === "gameover" ||
          (gameState === "victory" && !isPractice)) &&
        !isPractice && !isReplaySessionRef.current && !hasSubmittedScoreRef.current
      ) {
        hasSubmittedScoreRef.current = true;
        if (combo > 0) {
          handleQuestProgress('type_letters', combo);
          
          submitScore(user.username, combo, user.uuid, LEVELS[levelIndex].level, replayRecordingRef.current, language)
            .then((res) => {
              if (res) setScoreResult(res);
            })
            .catch(console.error);
            
          // Award XP for marathon progress
          let marathonXP = 0;
          if (levelIndex > 0) {
            const effectiveLevelIndex = gameState === "victory" ? levelIndex + 1 : levelIndex;
            marathonXP = 100 * Math.pow(2, effectiveLevelIndex - 1);
            handleQuestProgress('marathon_level', effectiveLevelIndex + 1, true);
          } else if (gameState === "victory") {
            marathonXP = 100; // Passed level 1
            handleQuestProgress('marathon_level', 2, true);
          }

          if (marathonXP > 0) {
            handleAwardXp(marathonXP);
          }
        }
        
        if (gameState === "victory" && marathonTimeMsRef.current > 0) {
           handleQuestProgress('finish_levels', 1);
           submitLevelTime(
             user.username,
             marathonTimeMsRef.current,
             user.uuid,
             0, // Level 0 represents Marathon Mode best time
             replayRecordingRef.current,
             language
           ).catch(console.error);
           
           // Marathon clear bonus
           handleAwardXp(500);
        }
      }
    }
  }, [gameState, isPractice, levelIndex, user, combo, tokens.length]);

  // Replay Simulation Loop
  const replaySimStateRef = useRef({ expectedSimTime: 0, startSystemTime: 0 });
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (gameState === "replay" && replayPlaybackDataRef.current.length > 0) {
      replaySimStateRef.current = { expectedSimTime: 0, startSystemTime: performance.now() };
      
      const playNextEvent = () => {
        const index = replayPlaybackRunningIndexRef.current;
        if (index >= replayPlaybackDataRef.current.length || gameState !== "replay") {
           return; // Replay finished
        }

        let { delta, isMistake } = decodeEvent(replayPlaybackDataRef.current[index]);

        // Backward compatibility: Old replays recorded the +3000ms "ZONE GEREINIGT" time inside the delta of the first keypress.
        if (currentIndexRef.current === 0 && levelIndex > 0) {
            if (delta >= 3000) {
                delta -= 3000;
            }
        }

        replaySimStateRef.current.expectedSimTime += delta;
        const realElapsed = performance.now() - replaySimStateRef.current.startSystemTime;
        let adjustedDelta = replaySimStateRef.current.expectedSimTime - realElapsed;
        if (adjustedDelta < 0) adjustedDelta = 0;

        timeoutId = setTimeout(() => {
          if (gameState !== "replay") return;
          
          if (isMistake) {
             window.dispatchEvent(new KeyboardEvent("keydown", { key: "WrongKey!", bubbles: true, cancelable: true }));
             replayPlaybackRunningIndexRef.current++;
             playNextEvent();
          } else {
             const currentToken = tokens[currentIndexRef.current];
             if (currentToken) {
                 replayPlaybackRunningIndexRef.current++;
                 window.dispatchEvent(new KeyboardEvent("keydown", { key: currentToken.key, bubbles: true, cancelable: true }));
                 playNextEvent();
             }
          }
        }, adjustedDelta);
      };

      playNextEvent();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [gameState, tokens, levelIndex]);

  // Ghost Simulation Loop
  const ghostSimStateRef = useRef({ expectedSimTime: 0, startSystemTime: 0, lastPauseTime: 0, paddedBoundaries: new Set<number>(), currentEventIndexAdded: -1 });
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (["playing", "cleared", "victory", "gameover"].includes(gameState) && ghostState?.active && !ghostState.finished) {
      if (ghostState.runningIndex === 0) {
        ghostSimStateRef.current = { expectedSimTime: 0, startSystemTime: performance.now(), lastPauseTime: 0, paddedBoundaries: new Set<number>(), currentEventIndexAdded: -1 };
      } else {
        if (ghostSimStateRef.current.lastPauseTime > 0) {
            const pausedDuration = performance.now() - ghostSimStateRef.current.lastPauseTime;
            ghostSimStateRef.current.startSystemTime += pausedDuration;
            ghostSimStateRef.current.lastPauseTime = 0;
        }
      }
      
      const playNextEvent = () => {
        if (!levelStartTimeRef.current && (ghostState.runningIndex === 0 || isPractice)) {
            // Player hasn't hit the first key yet, ghost waits.
            // Adjust startSystemTime so that the realElapsed exactly matches expectedSimTime,
            // effectively pausing the simulation's clock without breaking cumulative expected time.
            ghostSimStateRef.current.startSystemTime = performance.now() - ghostSimStateRef.current.expectedSimTime;
            timeoutId = setTimeout(playNextEvent, 50);
            return;
        }

        const index = ghostState.runningIndex;
        if (index >= ghostState.replayData.length) {
           setGhostState(prev => prev ? { ...prev, finished: true } : null);
           return;
        }
        if (!["playing", "cleared", "victory", "gameover"].includes(gameState)) return;

        let { delta, isMistake } = decodeEvent(ghostState.replayData[index]);

        // Backward compatibility for ghosts that were recorded without the 3s pause
        if (ghostState.ghostLevel === 0 && marathonGhostBoundaries.includes(ghostState.progress)) {
            if (!ghostSimStateRef.current.paddedBoundaries.has(ghostState.progress)) {
                if (delta < 2000) {
                    delta += 3000;
                }
                ghostSimStateRef.current.paddedBoundaries.add(ghostState.progress);
            }
        }
        
        // Prevent unusually long initial pauses
        if (index === 0 && delta > 500) {
            delta = 500;
        }

        if (ghostSimStateRef.current.currentEventIndexAdded !== index) {
            ghostSimStateRef.current.expectedSimTime += delta;
            ghostSimStateRef.current.currentEventIndexAdded = index;
        }

        const realElapsed = performance.now() - ghostSimStateRef.current.startSystemTime;
        let adjustedDelta = ghostSimStateRef.current.expectedSimTime - realElapsed;
        if (adjustedDelta < 0) adjustedDelta = 0;

        timeoutId = setTimeout(() => {
          if (!["playing", "cleared", "victory", "gameover"].includes(gameState)) return;
          
          setGhostState(prev => {
             if (!prev) return null;
             // Progress update (don't increment progress on mistake)
             return {
                 ...prev,
                 progress: isMistake ? prev.progress : prev.progress + 1,
                 runningIndex: prev.runningIndex + 1
             };
          });
          
        }, adjustedDelta);
      };

      playNextEvent();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      ghostSimStateRef.current.lastPauseTime = performance.now();
    };
  }, [gameState, ghostState?.active, ghostState?.runningIndex]);

  // Ghost Finish Check
  useEffect(() => {
    if (gameState === "playing" && ghostState?.finished && !ghostState.hasTriggeredError) {
       // Ghost finished before player!
       setGhostState(prev => prev ? { ...prev, hasTriggeredError: true } : null);
       
       if (ghostState.ghostLevel !== 0) {
           setMistake(true);
           handleGameOver();
       }
    }
  }, [ghostState?.finished, gameState, ghostState?.ghostLevel]);

  // Timer Loop
  useEffect(() => {
    if (gameState !== "playing" && gameState !== "replay") {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    lastFrameTimeRef.current = performance.now();

    const loop = (time: number) => {
      let delta = time - lastFrameTimeRef.current;
      lastFrameTimeRef.current = time;

      if (delta > 100) delta = 16; // Prevent massive jumps from tab switching

      if (levelStartTimeRef.current !== null) {
        remainingTimeRef.current -= delta;
        
        if (gameState === "replay") {
           let elapsedPlayTime = Date.now() - levelStartTimeRef.current;
           if (!isPractice && marathonStartTimeRef.current) {
               elapsedPlayTime = Date.now() - marathonStartTimeRef.current;
           }
           
           if (replayOriginalTimeMsRef.current && elapsedPlayTime > replayOriginalTimeMsRef.current) {
               elapsedPlayTime = replayOriginalTimeMsRef.current;
           }
           
           if (!isPractice) {
               setReplayDisplayTime((elapsedPlayTime / 1000).toFixed(2) + "s");
           } else {
               const isWords = LEVELS[levelIndex]?.category === 'words';
               const usTime = levelStartTimeUsRef.current ? Math.round(performance.now() * 1000) - levelStartTimeUsRef.current : elapsedPlayTime * 1000;
               setReplayDisplayTime(isWords ? `${parseFloat((usTime / 1000).toFixed(1))}ms` : (elapsedPlayTime / 1000).toFixed(2) + "s");
           }
           
           if (Date.now() - replayStatsRef.current.lastWpmUpdateTime >= 1000) {
               const wpm = (replayStatsRef.current.charsTypedSinceLastSecond / 5) * 60;
               setReplayDisplayWpm(Math.round(wpm).toString());
               replayStatsRef.current.charsTypedSinceLastSecond = 0;
               replayStatsRef.current.lastWpmUpdateTime = Date.now();
           }
        }
      }
      setTimeLeft(remainingTimeRef.current / maxTimeRef.current);

      if (remainingTimeRef.current <= 0) {
        remainingTimeRef.current = 0;
        setTimeLeft(0);
        setMistake(false);
        handleGameOver();
      } else {
        animationRef.current = requestAnimationFrame(loop);
      }
    };

    animationRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameState]);

  // Pre-calculate visual states
  const platformsData = useMemo(() => {
    const pData = [];
    const elements = [{ x: 0, y: 0 }, ...path];

    for (let i = 0; i < elements.length; i++) {
      const n = elements[i];
      const t = tokens[i];

      pData.push({
        id: `plat-${i}`,
        index: i,
        xOffset: n.x * TILE_SIZE,
        yOffset: -n.y * TILE_SIZE,
        yCoord: n.y,
        type: t ? t.type : "END",
        token: t,
        isWall: false,
      });

      if (t && (t.type === "LEFT" || t.type === "RIGHT")) {
        pData.push({
          id: `wall-${i}`,
          index: i,
          xOffset: n.x * TILE_SIZE,
          yOffset: -(n.y + 1) * TILE_SIZE,
          yCoord: n.y + 1,
          type: "WALL",
          token: null,
          isWall: true,
        });
      }
    }
    return pData;
  }, [path, tokens]);

  const drawDistance = 8;
  const DOM_KEEP_DISTANCE = 10;
  const visiblePlatforms = platformsData.filter(
    (p) =>
      p.index >= currentIndex - 2 &&
      p.index <= currentIndex + DOM_KEEP_DISTANCE,
  );

  const playerNode =
    currentIndex === 0 ? { x: 0, y: 0 } : path[currentIndex - 1];
  const pX = playerNode.x * TILE_SIZE;
  const pY = -playerNode.y * TILE_SIZE;

  const currentTheme = activeCommunityLevel 
    ? THEMES[parseInt(activeCommunityLevel.theme_color || "0")] || THEMES[0]
    : ((gameState === "menu" || !LEVELS[levelIndex]) ? LEVELS[0].theme : LEVELS[levelIndex].theme);

  const BackgroundLayers = () => (
    <div className="fixed inset-0 pointer-events-none z-[-2] bg-slate-950 w-full h-full">
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, rgb(0, 0, 0) 0%, rgb(0 4 12) 80%, rgb(0 0 0) 100%)",
          opacity: (gameState !== "playing" && gameState !== "replay") ? 1 : 0,
        }}
      />
      {LEVELS.map((lbl, idx) => (
        <div
          key={idx}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{
            background: lbl.theme.bg,
            opacity: gameState === "playing" && !activeCommunityLevel && levelIndex === idx ? 1 : 0,
          }}
        />
      ))}
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
        style={{
          background: activeCommunityLevel ? THEMES[parseInt(activeCommunityLevel.theme_color || "0")]?.bg || THEMES[0].bg : 'transparent',
          opacity: gameState === "playing" && activeCommunityLevel ? 1 : 0,
        }}
      />
    </div>
  );

  if (gameState === "menu") {
    return (
      <div className="fixed inset-0 w-full h-full min-h-[100dvh] flex flex-col overflow-y-auto overflow-x-hidden text-slate-200 m-0 p-0">
        <BackgroundLayers />
        {/* Background Decorative Elements */}
        <MatrixBackground speed={0.1} />

        {gameState === "menu" && !showLeaderboard && !showLevelSelect && !showCommunityBrowser && !showAccount && !showImprint && !viewingProfile && (
          <LanguageSwitcher language={language} />
        )}

        {!showLeaderboard &&
        !showLevelSelect &&
        !showCommunityBrowser &&
        !showAccount &&
        !showImprint &&
        !showPrivacy &&
        !showInstructions &&
        !showOnlinePlayers ? (
          <>
            {user && (
              <div className="fixed left-0 top-1/2 -translate-y-1/2 z-20 w-fit pointer-events-none hidden md:flex items-center">
                <div className={`flex flex-col gap-4 pointer-events-auto transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${leftPanelCollapsed ? '-translate-x-full' : 'translate-x-0'} ml-4 md:ml-8`}>
                  
                  {/* PROMO BOX */}
                {/* LIVE EVENT BOX */}
                <button
                  onClick={() => startGame(6, true)}
                  className="group relative flex flex-col p-5 rounded-2xl bg-slate-900/30 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/60 transition-all duration-700 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(79,70,229,0.15)] hover:bg-slate-900/60 text-left overflow-hidden min-w-[240px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-slate-600 to-slate-700 group-hover:from-indigo-400 group-hover:to-pink-500 transition-colors duration-700"></div>
  
                  <span className="flex items-center gap-2 mb-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 group-hover:bg-indigo-400 opacity-60 transition-colors duration-700"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500 group-hover:bg-indigo-400 transition-colors duration-700"></span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-300 transition-colors duration-700">
                      {t.liveEvent}
                    </span>
                  </span>
  
                  <h3 className="text-lg font-black text-slate-200 group-hover:text-white uppercase tracking-wide mb-1 transition-colors duration-700">
                    {LEVELS[6].difficultyName}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 group-hover:text-slate-400 mb-5 transition-colors duration-700">
                    {t.specialLevelTime}
                  </p>
  
                  <div className="mt-auto flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-400 uppercase tracking-widest transition-colors duration-700">
                      {t.endsIn}
                    </span>
                    <span className="text-[11px] font-mono font-black text-slate-400 group-hover:text-pink-400 tabular-nums bg-slate-800/50 group-hover:bg-pink-500/10 px-2 py-1 rounded inline-block w-fit border border-slate-700/50 group-hover:border-pink-500/20 transition-colors duration-700">
                      {eventTimeLeft || "06d 23h 59m"}
                    </span>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setLeftPanelCollapsed(c => !c)}
                className={`pointer-events-auto absolute transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] w-8 h-20 bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500 flex items-center justify-center shadow-lg rounded-r-lg border-l-0 cursor-pointer group z-10 ${leftPanelCollapsed ? 'left-0 text-amber-400' : 'left-[100%] text-slate-500 opacity-60 hover:opacity-100'}`}
              >
                {leftPanelCollapsed ? (
                  <svg className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                ) : (
                  <svg className="w-5 h-5 mr-1 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                )}
              </button>
            </div>
            )}

            <div className="fixed right-0 top-1/2 -translate-y-1/2 z-20 w-fit pointer-events-none hidden md:flex items-center">
              <button
                onClick={() => setRightPanelCollapsed(c => !c)}
                className={`pointer-events-auto absolute transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] w-8 h-20 bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500 flex items-center justify-center shadow-lg rounded-l-lg border-r-0 cursor-pointer group z-10 ${rightPanelCollapsed ? 'right-0 text-blue-400' : 'right-[100%] text-slate-500 opacity-60 hover:opacity-100'}`}
              >
                {rightPanelCollapsed ? (
                  <svg className="w-5 h-5 mr-1 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                ) : (
                  <svg className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                )}
              </button>

              <div className={`flex flex-col gap-4 pointer-events-auto transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${rightPanelCollapsed ? 'translate-x-full' : 'translate-x-0'} mr-4 md:mr-8`}>
                <button
                  onClick={() => setShowInstructions(true)}
                  className="group relative flex flex-col p-4 rounded-xl bg-slate-900/20 backdrop-blur-sm border border-slate-700/30 hover:border-blue-500/40 transition-all duration-500 hover:scale-105 hover:bg-slate-900/40 text-left overflow-hidden min-w-[200px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-bl from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-0 right-0 w-1 h-full bg-slate-800 group-hover:bg-blue-500/50 transition-colors duration-500"></div>

                <span className="flex items-center justify-end gap-2 mb-2 w-full">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 group-hover:text-blue-400 transition-colors duration-500">
                    Tutorial
                  </span>
                </span>

                <div className="flex flex-col items-end w-full text-right">
                  <h3 className="text-sm font-black text-slate-300 group-hover:text-white uppercase tracking-wide mb-1 transition-colors duration-500">
                    {t.tutorialHeader}
                  </h3>
                  <p className="text-[10px] font-medium text-slate-600 group-hover:text-slate-400 transition-colors duration-500">
                    {t.tutorialSubText}
                  </p>
                </div>
              </button>
            </div>
          </div>

            <div className="relative flex flex-col justify-between w-full max-w-4xl min-h-full h-fit mx-auto items-center z-10 py-4 md:py-10 flex-1">
              <div className="w-full flex-1 flex flex-col text-center max-w-3xl px-4 shrink-0 mb-8">
                <div className="my-auto flex flex-col w-full">
                <div className="flex flex-col items-center justify-center shrink-0 mb-[4vh] animate-[fadeIn_1s_ease-out]">
                  <img
                    src="/typeRR-3D-Text.png"
                    alt="Typerr"
                    draggable={false}
                    className="h-[18vh] min-h-[80px] max-h-[220px] drop-shadow-[0_0_45px_rgba(59,130,246,0.5)] object-contain hover:scale-105 transition-transform duration-700 select-none"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                    className="flex flex-col items-center gap-1 mt-[2vh]"
                  >
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">
                      {t.aGameBy}
                    </div>
                    <a
                      href="https://dionysoft-webdesign.de"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer transition-transform hover:scale-105 active:scale-95 group"
                    >
                      <img
                        src="/dionysoft-logo-azzurro.png"
                        alt="Dionysoft Logo"
                        draggable={false}
                        className="h-[8vh] min-h-[40px] max-h-[80px] object-contain filter drop-shadow-[0_0_8px_rgba(0,207,255,0.6)] group-hover:drop-shadow-[0_0_16px_rgba(0,207,255,0.9)] transition-all duration-300 select-none"
                      />
                    </a>
                  </motion.div>
                </div>

                {!authReady ? (
                  <div className="flex flex-col gap-4 items-center justify-center flex-1">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className="text-slate-500 text-xs uppercase tracking-widest animate-pulse">
                      Initialisierung...
                    </p>
                  </div>
                ) : !user ? (
                  <div className="relative animate-[fadeIn_1.5s_ease-out] flex justify-center flex-1 w-full items-center flex-col gap-6 lg:gap-0 lg:flex-none">
                    <div className="hidden lg:block absolute right-1/2 mr-[260px] xl:mr-[300px]">
                      <PlayerOfWeekShowcase language={language} />
                    </div>
                    <div className="w-full shrink-0 relative z-10 px-4 lg:px-0 flex justify-center">
                      <Auth
                        language={language}
                        onAuthSuccess={handleAuthSuccess}
                        onShowPrivacy={() => setShowPrivacy(true)}
                      />
                    </div>
                    <div className="w-full lg:absolute lg:left-1/2 lg:ml-[260px] xl:ml-[300px] shrink-0 relative z-10 px-4 lg:px-0 flex justify-center lg:block">
                        <div className="glass-panel p-8 rounded-2xl flex flex-col justify-center items-center text-center gap-6 bg-slate-900/60 border border-slate-700/50 shadow-2xl backdrop-blur-md relative overflow-hidden w-full max-w-sm lg:w-[320px] h-full lg:h-[400px]">
                           <div className="absolute inset-0 bg-gradient-to-tl from-emerald-500/10 to-transparent pointer-events-none" />
                           <div className="z-10 flex flex-col gap-4 w-full h-full justify-center mt-2">
                               <h3 className="text-2xl font-black tracking-tight text-white drop-shadow-md uppercase leading-tight">
                                   {t.authPlayAsGuest}
                               </h3>
                               <p className="text-slate-400 text-[11px] mt-1 uppercase tracking-widest font-bold leading-relaxed px-2">
                                   {t.authGuestDisclaimer}
                               </p>
                           </div>
                           
                           <button
                             onClick={() => handleAuthSuccess(`${t.guestPlayer}_${Math.floor(Math.random()*10000)}`, `guest_${Date.now()}`)}
                             className="mt-4 md:mt-8 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 md:py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all transform active:scale-95 uppercase tracking-widest text-sm border-b-4 border-emerald-900 z-10 shrink-0"
                           >
                              {t.playNow}
                           </button>
                        </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative animate-[fadeIn_1.5s_ease-out] flex justify-center flex-1 w-full items-center flex-col lg:flex-none">
                    
                    {/* Left Column (Desktop) */}
                    <div className="hidden lg:block absolute right-1/2 mr-[260px] xl:mr-[300px]">
                      {/* You can add something else here if needed in the future */}
                    </div>

                    {/* Right Column (Desktop) */}
                    <div className="hidden lg:flex flex-col absolute left-1/2 ml-[260px] xl:ml-[300px] w-64 lg:w-[300px]">
                      {!user?.uuid?.startsWith('guest_') && (
                        <DailyQuestsPanel quests={quests} language={language} />
                      )}
                    </div>

                    {/* Center Column (Responsive) */}
                    <div className="flex-1 flex flex-col justify-center min-h-0 w-full max-w-sm shrink-0 z-10 px-4 lg:px-0">
                      <p className="text-slate-400 font-sans mb-[3vh] max-w-xl mx-auto text-sm md:text-lg leading-relaxed font-light drop-shadow-md shrink-0 text-center">
                        {t.welcome}{" "}
                        <span className="text-blue-400 font-bold">
                          {user.username}
                        </span>
                        {t.challengeText}
                      </p>

                      {isMobile && (
                        <div className="flex flex-col items-center gap-1 mb-[2vh] p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 w-full shadow-inner text-center">
                          <span className="text-orange-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                             📱 {language === 'de' ? 'Mobile Nutzer' : 'Mobile Users'}
                          </span>
                          <span className="text-slate-400 text-[10px] md:text-xs leading-relaxed">
                            {t.mobileWarning}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col gap-2 md:gap-4 justify-center items-center w-full overflow-y-auto no-scrollbar pb-4 shrink-0">
                        <div className="w-full flex flex-col gap-1 md:gap-2">
                          <button
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 md:px-8 py-3 md:py-4 rounded-lg font-black text-lg md:text-xl uppercase tracking-[0.2em] transition-all shadow-[0_0_40px_rgba(37,99,235,0.4)] border-b-4 border-blue-800 hover:border-blue-700 active:scale-95 flex-shrink-0"
                            onClick={() => startGame(0, false)}
                          >
                            MARATHON RUN
                          </button>
                          <p className="text-[10px] text-blue-400/60 uppercase tracking-widest font-bold text-center hidden md:block">
                            {t.marathonDesc}
                          </p>
                        </div>

                        <div className="w-full flex flex-col gap-1 md:gap-2 md:hidden">
                          <button
                            className="w-full relative overflow-hidden bg-slate-900/40 backdrop-blur-sm text-slate-300 hover:text-white px-4 py-3 rounded-lg font-bold text-sm uppercase tracking-widest transition-all border border-slate-700/50 hover:border-indigo-500/50 transform active:scale-95 flex flex-col items-center justify-center gap-1 cursor-pointer flex-shrink-0"
                            onClick={() => startGame(6, true)}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-pink-500/10"></div>
                            <span className="flex items-center gap-2 relative z-10 text-slate-200">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                              </span>
                              {LEVELS[6].difficultyName} Event
                            </span>
                          </button>
                        </div>

                        <div className="w-full flex flex-col gap-1 md:gap-2">
                          <button
                            className="w-full bg-transparent backdrop-blur-sm hover:bg-slate-800/50 text-slate-400 hover:text-white px-4 md:px-8 py-2 md:py-3.5 rounded-lg font-bold text-sm md:text-lg uppercase tracking-widest transition-all border-2 border-slate-700 hover:border-slate-500 active:scale-95 flex-shrink-0"
                            onClick={() => setShowLevelSelect(true)}
                          >
                            {t.levelSelect.toUpperCase()}
                          </button>
                        </div>
                        <div className="w-full flex flex-col gap-1 md:gap-2">
                          <button
                            className="w-full bg-transparent backdrop-blur-sm hover:bg-indigo-900/30 text-indigo-400 hover:text-indigo-300 px-4 md:px-8 py-2 md:py-3.5 rounded-lg font-bold text-sm md:text-lg uppercase tracking-widest transition-all border-2 border-indigo-700/50 hover:border-indigo-500 active:scale-95 flex-shrink-0 flex items-center justify-center gap-2"
                            onClick={() => setShowCommunityBrowser(true)}
                          >
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            {language === 'de' ? 'Level Generator' : 'Level Generator'}
                          </button>
                        </div>
                        <div className="w-full flex flex-row gap-2">
                            <button
                              className="flex-1 bg-transparent backdrop-blur-sm hover:bg-slate-800/50 text-slate-400 hover:text-white py-2 md:py-3 rounded-lg font-bold text-xs md:text-sm uppercase tracking-widest transition-all border-2 border-slate-700 hover:border-slate-500 active:scale-95 flex-shrink-0 flex items-center justify-center gap-2"
                              onClick={() => setShowLeaderboard(true)}

                            >
                              {t.leaderboard}
                            </button>
                            {!user?.uuid?.startsWith('guest_') && (
                              <button
                                className="flex-1 bg-transparent backdrop-blur-sm hover:bg-slate-800/50 text-slate-400 hover:text-white py-2 md:py-3 rounded-lg font-bold text-xs md:text-sm uppercase tracking-widest transition-all border-2 border-slate-700 hover:border-slate-500 active:scale-95 flex-shrink-0 flex items-center justify-center gap-2"
                                onClick={() => setShowAccount(true)}
                              >
                                {t.account}
                              </button>
                            )}
                        </div>
                        
                        {/* Mobile Only Quests Panel */}
                        <div className="w-full lg:hidden flex-shrink-0 mt-2">
                          {!user?.uuid?.startsWith('guest_') && (
                            <DailyQuestsPanel quests={quests} language={language} />
                          )}
                        </div>
                        
                        <button
                          className="w-full md:hidden bg-transparent backdrop-blur-sm hover:bg-blue-900/20 text-blue-400/80 hover:text-blue-300 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all border-2 border-blue-900/30 hover:border-blue-700/50 active:scale-95 mt-1 flex-shrink-0"
                          onClick={() => setShowInstructions(true)}
                        >
                          {t.tutorial}
                        </button>
                        <button
                          className="mt-2 text-slate-600 hover:text-red-400 text-[10px] uppercase tracking-widest transition-colors font-bold shrink-0"
                          onClick={handleLogout}
                        >
                          {t.logout}
                        </button>
                      </div>

                      {authReady && (
                        <button 
                          onClick={() => setShowOnlinePlayers(true)}
                          className="group mt-2 md:mt-4 flex items-center justify-center gap-2 md:gap-3 text-emerald-400/80 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all duration-300 px-4 py-2 md:px-5 md:py-2.5 rounded-full border border-emerald-500/20 hover:border-emerald-400/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] w-fit mx-auto cursor-pointer shrink-0"
                          title="Liste aller aktiven Spieler anzeigen"
                        >
                          <div className="flex items-center gap-2">
                             <span className="relative flex h-2.5 w-2.5">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                             </span>
                             <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">
                               {onlineUsersCount} {t.playersOnline}
                             </span>
                          </div>
                          <svg className="w-3 md:w-4 h-3 md:h-4 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}
                </div>
              </div>

              <div className="w-full flex justify-between items-center px-4 shrink-0 mt-4 h-8 pb-10 md:pb-0 z-10 relative">
                <button
                  onClick={() => setShowImprint(true)}
                  className="text-slate-500 hover:text-slate-300 text-[10px] uppercase tracking-widest font-bold transition-colors"
                >
                  {t.imprint}
                </button>
                <button
                  onClick={() => setShowPrivacy(true)}
                  className="text-slate-500 hover:text-slate-300 text-[10px] uppercase tracking-widest font-bold transition-colors"
                >
                  {t.privacy}
                </button>
              </div>
            </div>
          </>
        ) : showAccount ? (
          <Account
             user={user!}
             language={language}
             onClose={() => setShowAccount(false)}
             onLogout={handleLogout}
          />
        ) : showLevelSelect ? (
          <MainMenuLevelSelect
            language={language}
            playerLevel={playerLevel}
            onClose={() => setShowLevelSelect(false)}
            onStartGame={(idx) => {
              startGame(idx, true);
              setShowLevelSelect(false);
            }}
            onReadText={(idx) => {
              setReadingLevelIndex(idx);
            }}
          />
        ) : showCommunityBrowser ? (
          <CommunityLevelsBrowser
            language={language}
            user={user}
            onClose={() => setShowCommunityBrowser(false)}
            onPlay={(level) => {
              setShowCommunityBrowser(false);
              startGame(0, true, false, false, level);
            }}
          />
        ) : viewingProfile ? (
          <PublicProfile
            language={language}
            uuid={viewingProfile.uuid}
            username={viewingProfile.username}
            onClose={() => setViewingProfile(null)}
          />
        ) : showImprint ? (
          <div className="relative flex flex-col gap-8 w-full max-w-4xl mx-auto my-auto items-center py-10 h-full overflow-y-auto z-10">
            <Imprint onClose={() => setShowImprint(false)} />
          </div>
        ) : showPrivacy ? (
          <div className="relative flex flex-col gap-8 w-full max-w-4xl mx-auto my-auto items-center py-10 h-full overflow-y-auto z-10">
            <Privacy language={language} onClose={() => setShowPrivacy(false)} />
          </div>
        ) : showInstructions ? (
          <div className="relative flex flex-col gap-8 w-full max-w-4xl mx-auto my-auto items-center py-10 h-full overflow-y-auto no-scrollbar z-10">
            <Instructions language={language} onClose={() => setShowInstructions(false)} />
          </div>
        ) : showOnlinePlayers ? (
          <div className="relative flex flex-col gap-8 w-full max-w-4xl mx-auto my-auto items-center py-10 h-full overflow-y-auto z-10">
            <OnlinePlayersList 
              users={onlineUsers} 
              onClose={() => setShowOnlinePlayers(false)} 
              myPresenceId={presenceIdRef.current}
              language={language}
              onViewProfile={(username, uuid) => setViewingProfile({username, uuid})}
            />
          </div>
        ) : (
          <MainMenuLeaderboard
            language={language}
            playerUuid={user?.uuid || ""}
            username={user?.username}
            onClose={() => setShowLeaderboard(false)}
            eventTimeLeft={eventTimeLeft}
            onPlayReplay={playReplay}
            onChallengeGhost={challengeGhost}
            onViewProfile={(username, uuid) => setViewingProfile({username, uuid})}
          />
        )}
        {/* <MultiplayerModals 
          mpState={mpState}
          incomingChallenge={incomingChallenge}
          onAccept={acceptChallenge}
          onDecline={declineChallenge}
          onCancel={cancelChallenge}
          onSelectLevel={(idx) => sendLevelSelect(idx)}
          levels={LEVELS}
        /> */}
        {showTerms && <TermsModal language={language} onClose={() => setShowTerms(false)} />}

        {readingLevelIndex !== null && (
          <div className="fixed inset-0 bg-slate-950/90 flex flex-col items-center justify-center z-[200] p-4 backdrop-blur-xl animate-[fadeIn_0.3s_ease-out]">
            <div className="relative w-full max-w-3xl bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 md:p-10 shadow-2xl flex flex-col max-h-[85vh]">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-2xl pointer-events-none" />
                
                <div className="flex justify-between items-center mb-6 z-10 border-b border-white/5 pb-6">
                    <h3 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] flex items-center gap-4">
                       <BookOpen className="w-8 h-8 text-cyan-400" />
                       {t.logbook}: Level {readingLevelIndex < 9 ? '0' : ''}{readingLevelIndex + 1}
                    </h3>
                    <button onClick={() => setReadingLevelIndex(null)} className="text-slate-400 hover:text-red-400 transition-colors p-2 bg-slate-800/50 hover:bg-slate-800 rounded-full">
                       <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-4 z-10 custom-scrollbar text-lg md:text-xl text-slate-300 leading-relaxed tracking-wide space-y-6">
                    {LEVELS[readingLevelIndex].text.split('\n').filter(p => p.trim()).map((para, i) => (
                        <p key={i} className="animate-[fadeIn_0.5s_ease-out] whitespace-pre-wrap">{para}</p>
                    ))}
                </div>

                <div className="mt-8 flex flex-col sm:flex-row justify-end gap-4 z-10 pt-6 border-t border-white/5">
                   <button onClick={() => setReadingLevelIndex(null)} className="px-6 py-3 rounded-full border border-slate-700 text-slate-300 uppercase text-sm font-bold tracking-widest hover:bg-slate-800 transition-colors flex-1 sm:flex-none">
                       {t.close}
                   </button>
                   <button onClick={() => {
                           const idxToStart = readingLevelIndex;
                           setReadingLevelIndex(null);
                           startGame(idxToStart, true);
                           setShowLevelSelect(false);
                       }} 
                       className="px-8 py-3 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 uppercase text-sm font-bold tracking-widest hover:bg-cyan-500/30 hover:text-cyan-300 transition-colors flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(34,211,238,0.3)] flex-1 sm:flex-none">
                       <Play className="w-5 h-5 fill-current" />
                       {t.playNow}
                   </button>
                </div>
            </div>
          </div>
        )}

        <GhostChallengeModal 
          challenge={incomingGhostChallenge}
          language={language}
          onAccept={(ghost) => {
              setIncomingGhostChallenge(null);
              challengeGhost(ghost.username, ghost.level, ghost.ghostData.replay_data, ghost.ghostData.time_ms);
          }}
          onDecline={() => setIncomingGhostChallenge(null)}
        />
        
        <QuestCompletionToast 
          quests={completedQuestNotifs} 
          language={language} 
          onDismiss={(id) => setCompletedQuestNotifs(prev => prev.filter(p => p.quest_id !== id))} 
        />
      </div>
    );
  }

  return (
    <div 
        className="fixed inset-0 w-full h-full min-h-[100dvh] flex flex-col text-slate-200 overflow-hidden m-0 p-0"
    >
      <BackgroundLayers />
      {gameState !== "playing" && <MatrixBackground speed={0.1} />}

      {/* Game View */}
      <div
        className={`relative w-full h-full flex-1 z-0 min-h-0 ${shake ? "animate-shake" : ""}`}
      >
        {/* HUD Overlay */}
        <div className="absolute top-0 left-0 w-full z-[60] pointer-events-none flex flex-col justify-between">
          <div className="px-6 py-8 md:px-12 md:py-10 max-w-4xl mx-auto w-full flex flex-col gap-4">
            <div className="flex w-full justify-between items-end font-sans">
              <div className="hud-panel px-6 py-3 flex flex-col pointer-events-auto">
                <span className="text-xs text-slate-400 font-bold tracking-[0.2em] uppercase mb-1 drop-shadow-md">
                  Level
                </span>
                <span className="text-2xl text-white font-black leading-none drop-shadow-lg">
                  {levelIndex + 1}
                </span>
              </div>

              <div className="hud-panel px-6 py-3 flex flex-col items-end pointer-events-auto">
                <span className="text-xs text-slate-400 font-bold tracking-[0.2em] uppercase mb-1 drop-shadow-md">
                  {isPractice ? t.chars : t.combo}
                </span>
                <span
                  className={`text-2xl font-black leading-none transition-all ${!isPractice && combo > 10 ? `${currentTheme.hudColor} drop-shadow-[0_0_10px_currentColor] scale-110` : "text-white drop-shadow-lg"}`}
                >
                  {isPractice ? `${currentIndex}/${tokens.length}` : combo}
                </span>
              </div>
            </div>
            
            {gameState === "replay" && (
              <div className="flex w-full justify-center mt-2 pointer-events-none">
                 <div className="hud-panel px-6 sm:px-8 py-3 flex items-center gap-6 sm:gap-8 bg-purple-900/40 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] sm:text-[10px] text-purple-300 font-bold tracking-widest uppercase mb-1 drop-shadow-md">
                           TIMER
                        </span>
                        <span className="text-lg sm:text-xl text-white font-black leading-none drop-shadow-[0_0_10px_rgba(168,85,247,0.6)] font-mono">
                           {replayDisplayTime || (LEVELS[levelIndex]?.category === 'words' ? "0ms" : "0.00s")}
                        </span>
                    </div>
                    
                    <div className="w-[1px] h-8 bg-purple-500/30" />
                    
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] sm:text-[10px] text-purple-300 font-bold tracking-widest uppercase mb-1 drop-shadow-md">
                           WPM
                        </span>
                        <span className="text-lg sm:text-xl text-white font-black leading-none drop-shadow-[0_0_10px_rgba(168,85,247,0.6)] font-mono">
                           {replayDisplayWpm || "0"}
                        </span>
                    </div>
                 </div>
              </div>
            )}

            <div className="w-full timer-container relative h-4 md:h-5 mt-2 pointer-events-auto">
              <div
                className="h-full glossy-pill transition-colors duration-75 ease-linear relative"
                style={{
                  width: `${Math.min(100, Math.max(0, timeLeft * 100))}%`,
                  backgroundColor: `hsl(${Math.max(0, timeLeft) * 120}, 80%, 50%)`,
                }}
              >
                <div className="absolute right-0 bottom-full mb-2">
                  {timeBonuses.map((b) => (
                    <span
                      key={b.id}
                      className="absolute bottom-0 right-0 font-bold animate-time-bonus whitespace-nowrap text-white"
                      style={{
                        textShadow: "0 2px 4px rgba(0,0,0,0.8)",
                        fontSize: "1rem",
                      }}
                    >
                      {b.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {mpState.status === 'playing' && mpState.opponent && (
                <div className="w-full flex items-center justify-end gap-3 mt-1 pointer-events-auto opacity-80 backdrop-blur-sm p-2 rounded-xl bg-slate-900/40">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-300 drop-shadow-md">{mpState.opponent.username}</span>
                    <div className="w-full max-w-[150px] bg-slate-900/80 rounded-full h-2 border border-slate-700/50 overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${(mpState.opponent.progress / tokens.length) * 100}%` }}
                        />
                    </div>
                </div>
            )}
            {gameState === 'playing' && ghostState?.active && (() => {
                const relativeGhostProgress = ghostState.ghostLevel === 0 ? ghostState.progress - cumulativeTokensUpToLevel : ghostState.progress;
                return (
                  <div className="w-full flex items-center justify-end gap-3 mt-1 pointer-events-auto opacity-80 backdrop-blur-sm p-2 rounded-xl bg-slate-900/40 border-emerald-500/20 border">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-300 drop-shadow-md">{ghostState.username} (Ghost)</span>
                      <div className="w-full max-w-[150px] bg-slate-900/80 rounded-full h-2 border border-slate-700/50 overflow-hidden shadow-inner">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            style={{ width: `${Math.max(0, Math.min(100, (relativeGhostProgress / tokens.length) * 100))}%` }}
                          />
                      </div>
                  </div>
                );
            })()}
          </div>
        </div>

        {/* World Container */}
        <div
          className={`absolute left-1/2 transition-transform duration-300 transform-gpu ease-out ${isMobile && gameState === "playing" ? "top-[40%]" : "top-[70%]"}`}
          style={{ transform: `translate(${-pX}px, ${-pY}px)` }}
        >
          {/* Render visible platforms */}
          {visiblePlatforms.map((p) => {
            const isActive = p.index === currentIndex;
            const isCompleted = p.index < currentIndex;
            const dist = p.index - currentIndex;

            let opacity = 1;
            if (dist < 0) {
              opacity = Math.max(0, 1 + dist * 0.5);
            } else if (dist > drawDistance - 3) {
              opacity = Math.max(0, 1 - (dist - (drawDistance - 3)) / 3);
            }

            if (p.isWall) {
              return (
                <div
                  key={p.id}
                  className="absolute rounded-md transition-all duration-300 ease-out block-wall"
                  style={{
                    width: TILE_SIZE,
                    height: TILE_SIZE * 2.5,
                    transform: `translate(${p.xOffset - TILE_SIZE / 2}px, ${p.yOffset + TILE_SIZE / 2 - TILE_SIZE * 2.5}px)`,
                    zIndex: 1000 - p.yCoord,
                    opacity,
                  }}
                >
                  <div className="absolute inset-x-0 top-4 flex justify-center">
                    <div className="w-10 h-10 rounded-full bg-red-600/30 flex items-center justify-center border-2 border-red-500/80 shadow-[0_0_20px_red]">
                      <div className="w-4 h-4 rounded-full bg-white animate-pulse shadow-[0_0_10px_white]" />
                    </div>
                  </div>
                </div>
              );
            }

            let blockClass = `block-3d text-slate-300`;
            let scaleVal = 1;
            let blockStyle: React.CSSProperties = {
              ...(currentTheme.block as any),
            };

            if (isCompleted) {
              blockClass = "block-3d text-slate-600";
              blockStyle = blockCompletedBase;
            } else if (isActive) {
              scaleVal = 1.1;
              if (p.type === "SPACE") {
                blockClass = "block-3d text-white";
                blockStyle = blockSpaceActiveBase;
              } else {
                blockClass = `block-3d text-white`;
                blockStyle = { ...(currentTheme.blockActive as any) };
              }
            } else {
              if (p.type === "SPACE") {
                blockClass = "block-3d text-slate-200";
                blockStyle = blockSpaceBase;
              }
            }

            // Show text for the next few blocks.
            const showText = dist >= 0 && dist <= 2;

            return (
              <div
                key={p.id}
                className={`absolute flex items-center justify-center rounded-lg font-sans font-bold transition-all duration-300 ease-out ${blockClass}`}
                style={{
                  ...blockStyle,
                  width: TILE_SIZE - 6,
                  height: TILE_SIZE - 6,
                  transform: `translate(${p.xOffset - TILE_SIZE / 2 + 3}px, ${p.yOffset - TILE_SIZE / 2 + 3}px) scale(${scaleVal})`,
                  zIndex: 1000 - p.yCoord,
                  opacity,
                }}
              >
                {showText && p.token && (
                  <span
                    className={`inline-block transition-transform duration-200 ${p.token && (p.token.type === "SPACE" || p.token.type === "LEFT" || p.token.type === "RIGHT") ? "text-[12px] font-black tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-[0]" : "text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"} ${isActive ? "drop-shadow-[0_0_12px_rgba(255,255,255,1)] text-white scale-125" : ""} ${isActive && p.index === 0 ? "translate-y-16 scale-[2] z-[100] font-black text-white" : ""}`}
                  >
                    {p.token && p.token.type === "SPACE" ? "JUMP" : p.token && p.token.type === "LEFT" ? "<-" : p.token && p.token.type === "RIGHT" ? "->" : p.token.display}
                  </span>
                )}
              </div>
            );
          })}

          {/* Player Shadow */}
          <div
            className="absolute rounded-full transition-all duration-150 transform-gpu ease-out pointer-events-none bg-black"
            style={{
              width: PLAYER_SIZE,
              height: PLAYER_SIZE,
              transform: `translate(${pX - PLAYER_SIZE / 2 + 8}px, ${pY - PLAYER_SIZE / 2 + 8}px) scale(${isJumping ? 1.4 : 1})`,
              filter: `blur(${isJumping ? "10px" : "4px"})`,
              opacity: isJumping ? 0.3 : 0.6,
              zIndex: 1001 - playerNode.y,
            }}
          />

          {/* Player */}
          <div
            className="absolute rounded-full transition-transform duration-150 transform-gpu ease-out flex items-center justify-center pointer-events-none"
            style={{
              width: PLAYER_SIZE,
              height: PLAYER_SIZE,
              background: currentTheme.playerColor,
              boxShadow: currentTheme.playerGlow,
              transform: `translate(${pX - PLAYER_SIZE / 2}px, ${pY - PLAYER_SIZE / 2}px) scale(${isJumping ? 1.6 : 1})`,
              zIndex: 1002 - playerNode.y,
            }}
          >
            {plusOnes.map((p) => (
              <span
                key={p.id}
                className="absolute text-white font-bold animate-score whitespace-nowrap drop-shadow-md"
                style={{ left: "-10px", top: "-10px" }}
              >
                +1
              </span>
            ))}
          </div>

          {/* Ghost Shadow & Player */}
          {(gameState === "playing" || gameState === "replay") && ghostState?.active && (() => {
            const isGhostInZoneCleared = ghostState.ghostLevel === 0 && marathonGhostBoundaries.includes(ghostState.progress);
            const relativeGhostProgress = ghostState.ghostLevel === 0 ? ghostState.progress - cumulativeTokensUpToLevel : ghostState.progress;
            
            // Ghost is in a previous level (behind us)
            if (relativeGhostProgress < 0) return null;
            
            // Ghost is at the end of the current level doing the "zone cleared" pause, so hide from this level
            if (isGhostInZoneCleared && relativeGhostProgress > 0) return null;
            
            const ghostNode = relativeGhostProgress === 0 ? { x: 0, y: 0 } : (path[Math.min(relativeGhostProgress - 1, path.length - 1)] || { x: 0, y: 0 });
            const gX = ghostNode.x * TILE_SIZE;
            const gY = -ghostNode.y * TILE_SIZE;
            const isGhostJumping = relativeGhostProgress > 0 && relativeGhostProgress <= tokens.length && tokens[relativeGhostProgress - 1]?.type === "SPACE";
            
            return (
              <>
                <div
                  className="absolute rounded-full transition-all duration-150 transform-gpu ease-out pointer-events-none bg-black"
                  style={{
                    width: PLAYER_SIZE,
                    height: PLAYER_SIZE,
                    transform: `translate(${gX - PLAYER_SIZE / 2 + 8}px, ${gY - PLAYER_SIZE / 2 + 8}px) scale(${isGhostJumping && !ghostState.finished ? 1.4 : 1})`,
                    filter: `blur(${isGhostJumping && !ghostState.finished ? "10px" : "4px"})`,
                    opacity: ghostState.finished ? 0.1 : (isGhostJumping ? 0.2 : 0.4),
                    zIndex: 1001 - ghostNode.y,
                  }}
                />
                
                <div
                  className={`absolute rounded-full transition-all duration-150 transform-gpu ease-out flex items-center justify-center pointer-events-none border-2 border-dashed ${ghostState.finished ? 'border-red-400 bg-red-500/20' : 'border-emerald-400 bg-emerald-500/30'} backdrop-blur-[2px]`}
                  style={{
                    width: PLAYER_SIZE,
                    height: PLAYER_SIZE,
                    boxShadow: ghostState.finished ? "0 0 15px rgba(239, 68, 68, 0.2)" : "0 0 15px rgba(16, 185, 129, 0.4)",
                    transform: `translate(${gX - PLAYER_SIZE / 2}px, ${gY - PLAYER_SIZE / 2}px) scale(${isGhostJumping && !ghostState.finished ? 1.6 : 1})`,
                    zIndex: 1002 - ghostNode.y,
                    opacity: ghostState.finished ? 0.3 : 1
                  }}
                >
                  <span className={`absolute -top-6 text-[9px] uppercase tracking-widest font-bold ${ghostState.finished ? 'text-red-300' : 'text-emerald-300'} whitespace-nowrap bg-slate-900/50 px-1 rounded backdrop-blur-sm pointer-events-none`}>
                    {ghostState.username} {ghostState.finished && " (Finished)"}
                  </span>
                </div>
              </>
            );
          })()}

          {/* Opponent (Multiplayer) Shadow & Player */}
          {gameState === "playing" && mpState.opponent && (() => {
            const oppProgress = mpState.opponent.progress || 0;
            const oppNode = oppProgress === 0 ? { x: 0, y: 0 } : (path[Math.min(oppProgress - 1, path.length - 1)] || { x: 0, y: 0 });
            const oX = oppNode.x * TILE_SIZE;
            const oY = -oppNode.y * TILE_SIZE;
            
            return (
              <>
                <div
                  className="absolute rounded-full transition-all duration-150 transform-gpu ease-out pointer-events-none bg-black"
                  style={{
                    width: PLAYER_SIZE,
                    height: PLAYER_SIZE,
                    transform: `translate(${oX - PLAYER_SIZE / 2 + 8}px, ${oY - PLAYER_SIZE / 2 + 8}px)`,
                    filter: "blur(4px)",
                    opacity: 0.4,
                    zIndex: 1001 - oppNode.y,
                  }}
                />
                
                <div
                  className="absolute rounded-full transition-transform duration-150 transform-gpu ease-out flex items-center justify-center pointer-events-none border-2 border-dashed border-red-400 bg-red-500/30 backdrop-blur-[2px]"
                  style={{
                    width: PLAYER_SIZE,
                    height: PLAYER_SIZE,
                    boxShadow: "0 0 15px rgba(239, 68, 68, 0.4)",
                    transform: `translate(${oX - PLAYER_SIZE / 2}px, ${oY - PLAYER_SIZE / 2}px)`,
                    zIndex: 1002 - oppNode.y,
                  }}
                >
                  <span className="absolute -top-6 text-[9px] uppercase tracking-widest font-bold text-red-300 whitespace-nowrap bg-slate-900/50 px-1 rounded backdrop-blur-sm pointer-events-none">
                    {mpState.opponent.username}
                  </span>
                </div>
              </>
            );
          })()}
        </div>

        {/* Status Overlays */}
        {(gameState !== "playing" && gameState !== "replay") && (
          <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-[100] p-4 overflow-y-auto w-full h-full min-h-[100dvh]">
            {(gameState === "gameover" || gameState === "victory" || gameState === "replay_finished") && (() => {
              const isBattleMode = isPractice && (ghostState?.active || mpState.opponent) && gameState !== "replay_finished";

              if (isBattleMode) {
                  const playerWon = gameState === "victory";
                  const oppName = ghostState?.active ? (ghostState.username || "Opponent") : (mpState.opponent?.username || "Opponent");
                  const oppTimeMs = ghostState?.active ? ghostState.time_ms : mpState.opponent?.time;
                  const myTimeMs = levelTimeMsRef.current;
                  
                  let oppTimeStr = "DNF";
                  const isWords = LEVELS[levelIndex]?.category === 'words';
                  if (oppTimeMs) {
                      oppTimeStr = isWords ? `${oppTimeMs}ms` : (oppTimeMs / 1000).toFixed(2) + "s";
                  }
                  
                  let playerTimeStr = "FAILED";
                  if (gameState === "victory" && myTimeMs > 0) {
                      playerTimeStr = isWords ? `${(levelTimeUsRef.current ? parseFloat((levelTimeUsRef.current / 1000).toFixed(1)) : myTimeMs)}ms` : (myTimeMs / 1000).toFixed(2) + "s";
                  }
                  
                  const myName = user?.username || "Guest";

                  return (
                      <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto my-auto items-center justify-center px-4 animate-[fadeIn_0.5s_ease-out]">
                          
                          <div className="text-center mb-4 relative z-10 w-full animate-[fadeInDown_0.5s_ease-out]">
                              <h1 className="text-5xl md:text-7xl font-sans font-black tracking-[0.2em] uppercase bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent drop-shadow-lg">
                                  {playerWon ? t.battleVictory : t.battleDefeat}
                              </h1>
                              <p className="text-slate-400 font-sans text-xl uppercase tracking-widest mt-2 font-bold drop-shadow-md">
                                  {playerWon ? t.battleVictoryDesc : t.battleDefeatDesc}
                              </p>
                          </div>
              
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative z-10">
                              
                              {/* VS Divider */}
                              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center w-16 h-16 rounded-full bg-slate-950 border-4 border-slate-700 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                                  <span className="font-black italic text-slate-400 text-xl tracking-tighter">VS</span>
                              </div>
              
                              {/* Player Card */}
                              <div className={`relative p-8 md:p-10 rounded-3xl backdrop-blur-md border shadow-2xl transition-all duration-700 transform hover:scale-[1.02] flex flex-col items-center justify-center overflow-hidden
                                   ${playerWon ? 'bg-indigo-900/40 border-indigo-500/50 shadow-[0_0_50px_rgba(79,70,229,0.3)]' : 'bg-slate-900/80 border-slate-700'}
                              `}>
                                  {playerWon && <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>}
                                  <div className="relative z-10 flex flex-col items-center gap-4 w-full">
                                      <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black shadow-xl ${playerWon ? 'bg-indigo-500 text-white shadow-[0_0_30px_rgba(79,70,229,0.6)]' : 'bg-slate-800 text-slate-400'}`}>
                                         {myName.charAt(0).toUpperCase()}
                                      </div>
                                      <h2 className={`font-black text-2xl tracking-widest uppercase truncate max-w-full ${playerWon ? 'text-white' : 'text-slate-400'}`}>{myName}</h2>
                                      
                                      <div className="mt-4 flex flex-col items-center">
                                          <span className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold mb-1">{t.timeStat}</span>
                                          <span className={`font-mono text-5xl font-black ${playerWon ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]' : 'text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.4)]'}`}>
                                              {playerTimeStr}
                                          </span>
                                      </div>
                                  </div>
                                  {playerWon && <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full"></div>}
                              </div>
                              
                              {/* Opponent Card */}
                              <div className={`relative p-8 md:p-10 rounded-3xl backdrop-blur-md border shadow-2xl transition-all duration-700 transform hover:scale-[1.02] flex flex-col items-center justify-center overflow-hidden
                                   ${!playerWon ? 'bg-red-900/30 border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.2)]' : 'bg-slate-900/80 border-slate-700'}
                              `}>
                                  {!playerWon && <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent"></div>}
                                  <div className="relative z-10 flex flex-col items-center gap-4 w-full">
                                      <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black shadow-xl ${!playerWon ? 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 'bg-slate-800 text-slate-400'}`}>
                                         {oppName.charAt(0).toUpperCase()}
                                      </div>
                                      <h2 className={`font-black text-2xl tracking-widest uppercase truncate max-w-full ${!playerWon ? 'text-white' : 'text-slate-400'}`}>{oppName}</h2>
                                      <div className="mt-4 flex flex-col items-center">
                                          <span className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold mb-1">{t.timeStat}</span>
                                          <span className={`font-mono text-5xl font-black ${!playerWon ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]' : 'text-slate-300 drop-shadow-md'}`}>
                                              {oppTimeStr}
                                          </span>
                                      </div>
                                  </div>
                                  {!playerWon && <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 blur-3xl rounded-full"></div>}
                              </div>
                          </div>

                          {scoreResult && scoreResult.isNewBest && (
                            <div className="mt-4 animate-bounce">
                                <span className="text-emerald-400 font-bold uppercase tracking-[0.1em] text-xl bg-emerald-400/10 px-6 py-3 rounded-full border border-emerald-400/30 inline-block shadow-[0_0_20px_rgba(52,211,153,0.2)]">
                                {t.newScore}
                                </span>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row gap-6 justify-center mt-6 relative z-20 w-fit">
                              <button
                                  onClick={() => {
                                      if (mpState.matchChannel && mpState.status !== 'playing') {
                                         rematch();
                                      } else if (ghostState?.active) {
                                          challengeGhost(ghostState.username, ghostState.ghostLevel, ghostState.replayData, ghostState.time_ms);
                                      }
                                  }}
                                  className="relative group overflow-hidden px-8 py-4 rounded-xl bg-slate-900 border border-slate-600/50 hover:border-indigo-400/50 transition-all shadow-xl active:scale-95"
                              >
                                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 group-hover:translate-x-full transition-transform duration-700 ease-out -translate-x-full"></div>
                                  <span className="font-bold uppercase tracking-widest text-slate-200 group-hover:text-white relative z-10 flex items-center justify-center">
                                      {t.rematchBtn}
                                  </span>
                              </button>
                              
                              <button
                                  onClick={() => {
                                      leaveMatch();
                                      setGameState("menu");
                                      setShowLeaderboard(false);
                                      setShowLevelSelect(false);
                                      setGhostState(null);
                                  }}
                                  className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all uppercase tracking-widest font-bold active:scale-95 flex items-center justify-center font-sans tracking-[0.2em]"
                              >
                                  {t.mainMenu}
                              </button>
                          </div>
                          
                          {earnedXp > 0 && !isReplaySessionRef.current && (
                            <div className="w-full mt-4 bg-transparent animate-[fadeInUp_0.5s_ease-out_0.3s_both] relative z-30">
                              <LevelUpOverlay totalXp={totalXp} earnedXpSession={earnedXp} inline />
                            </div>
                          )}
                          
                          {!isMobile && (
                            <p className="text-slate-500 font-bold text-xs tracking-widest mt-2 uppercase">
                              {t.orRToRestart}
                            </p>
                          )}
                      </div>
                  );
              }

              return (
              <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl mx-auto my-auto items-center lg:items-start justify-center">
                <div className="text-center hud-panel p-8 md:p-12 w-full max-w-xl shrink-0 border-red-500/20 animate-[fadeIn_0.3s_ease-out]">
                  {gameState === "replay_finished" ? (
                    <>
                      <h1 className="text-5xl md:text-7xl font-sans font-black text-emerald-400 mb-6 tracking-tight drop-shadow-[0_0_20px_rgba(52,211,153,0.4)] uppercase">
                        {t.replayFinishedTitle}
                      </h1>
                      <div className="flex flex-col gap-2 mb-8">
                        <p className="text-slate-300 font-sans text-2xl drop-shadow-md">
                          {t.replayFinishedDesc}
                        </p>
                        {isPractice ? (
                          <div className="text-4xl md:text-5xl font-mono font-black text-white mt-4 drop-shadow-lg">
                            <span className="text-indigo-400 mr-3 opacity-80">{t.timeLabel || "TIME:"}</span>
                            {replayDisplayTime || (levelTimeMsRef.current > 0 ? (LEVELS[levelIndex]?.category === 'words' ? `${(levelTimeUsRef.current ? parseFloat((levelTimeUsRef.current / 1000).toFixed(1)) : levelTimeMsRef.current)}ms` : (levelTimeMsRef.current / 1000).toFixed(2) + "s") : "-")}
                          </div>
                        ) : (
                          <div className="text-5xl md:text-6xl font-mono font-black text-white mt-4 drop-shadow-lg">
                            <span className="text-emerald-400 mr-4 opacity-80">{t.score}:</span>
                            {finalScore}
                          </div>
                        )}
                      </div>
                    </>
                  ) : gameState === "gameover" ? (
                    <>
                      <h1
                        className="text-5xl md:text-7xl font-sans font-black text-red-500 mb-6 tracking-tight drop-shadow-xl"
                        style={{
                          textShadow: "0 4px 20px rgba(239, 68, 68, 0.5)",
                        }}
                      >
                        {(mpState.opponent?.time || ghostState?.finished) ? t.lostTitle : t.fatalErrorTitle}
                      </h1>
                      <p className="text-red-200 font-sans mb-8 text-2xl drop-shadow-md">
                        {mpState.opponent?.time ? `${mpState.opponent.username} ${t.opponentWasFaster}` : (ghostState?.finished ? `${ghostState.username} ${t.opponentWasFaster}` : (mistake
                          ? errorMessage ||
                            t.invalidInput
                          : t.timeExpired))}
                      </p>
                      {(mpState.opponent?.time || (ghostState?.finished && ghostState.time_ms)) && (
                          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                              <span className="text-red-300 font-bold tracking-widest text-sm uppercase">{t.opponentTime} {((mpState.opponent?.time || ghostState!.time_ms)/1000).toFixed(2)}s</span>
                          </div>
                      )}
                    </>
                  ) : (
                    <>
                      <h1 className="text-5xl md:text-7xl font-sans font-black text-white mb-6 tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] uppercase">
                        {isPractice
                          ? `${t.level.toUpperCase()} ${levelIndex + 1} ${t.levelCleared}`
                          : t.allLevelsCleared}
                      </h1>
                       <p className="text-slate-300 font-sans text-2xl mb-8 drop-shadow-md">
                        {isPractice
                          ? (() => {
                              const wpmVal = Math.round((tokens.length * 12000) / levelTimeMsRef.current);
                              const isWords = LEVELS[levelIndex]?.category === 'words';
                              const timeStr = isWords ? `${(levelTimeUsRef.current ? parseFloat((levelTimeUsRef.current / 1000).toFixed(1)) : levelTimeMsRef.current)}ms` : `${(levelTimeMsRef.current / 1000).toFixed(2)}s`;
                              return `${t.time} ${timeStr} (${wpmVal} WPM)`;
                            })()
                          : t.youNavigatedAllLevels}
                      </p>
                    </>
                  )}

                  {scoreResult && (
                    <div className="mb-8">
                      {scoreResult.isNewBest ? (
                        <span className="text-emerald-400 font-bold uppercase tracking-[0.1em] text-xl bg-emerald-400/10 px-6 py-3 rounded-full border border-emerald-400/30 inline-block shadow-[0_0_20px_rgba(52,211,153,0.2)]">
                          {t.newScore}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-medium tracking-wide text-lg">
                          {t.yourScoreIs}
                          <strong className="text-white">
                            {!isPractice &&
                            (gameState === "gameover" ||
                              gameState === "victory")
                              ? scoreResult.previousBest
                              : scoreResult.previousBest
                                ? (() => {
                                    const wpmVal = Math.round((tokens.length * 12000) / scoreResult.previousBest!);
                                    const isWords = LEVELS[levelIndex]?.category === 'words';
                                    const timeStr = isWords ? `${(scoreResult.previousBestUs ? parseFloat((scoreResult.previousBestUs / 1000).toFixed(1)) : scoreResult.previousBest!)}ms` : `${(scoreResult.previousBest! / 1000).toFixed(2)}s`;
                                    return `${timeStr} (${wpmVal} WPM)`;
                                  })()
                                : ""}
                          </strong>
                          {t.tryAgain}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4 flex-wrap">
                    <button
                      onClick={() => {
                        if (mpState.matchChannel && mpState.status !== 'playing') {
                           rematch();
                        } else {
                            if (ghostState?.active) {
                                challengeGhost(ghostState.username, ghostState.ghostLevel, ghostState.replayData, ghostState.time_ms);
                            } else {
                                startGame(isPractice ? levelIndex : 0, isPractice, false, false, activeCommunityLevel);
                            }
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-widest transition-all shadow-[0_4px_14px_rgba(37,99,235,0.4)] flex-1 min-w-[150px]"
                    >
                      {t.playAgain}
                    </button>
                    <button
                      onClick={() => {
                        leaveMatch();
                        setGameState("menu");
                        setShowLeaderboard(false);
                        setShowLevelSelect(false);
                        setGhostState(null);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-widest transition-all shadow-[0_4px_14px_rgba(0,0,0,0.4)] border border-slate-600 flex-1 min-w-[150px]"
                    >
                      {t.mainMenu}
                    </button>
                  </div>
                  
                  {earnedXp > 0 && !isReplaySessionRef.current && (
                    <div className="w-full mt-4 bg-transparent animate-[fadeInUp_0.5s_ease-out_0.3s_both] relative z-30">
                      <LevelUpOverlay totalXp={totalXp} earnedXpSession={earnedXp} inline />
                    </div>
                  )}

                  {!isMobile && (
                    <p className="text-slate-500 font-bold text-xs tracking-widest mt-6 uppercase">
                      {t.orRToRestart}
                    </p>
                  )}
                </div>
                <div className="w-full max-w-md shrink-0 mb-8 mt-4">
                  {isPractice ? (
                    <Leaderboard
                      language={language}
                      playerUuid={user?.uuid || ""}
                      username={user?.username}
                      currentLevel={LEVELS[levelIndex].level}
                      communityLevelId={activeCommunityLevel?.id}
                      communityKeystrokes={tokens.length}
                      isTimeAttack={true}
                      levelTimeMs={
                        gameState === "victory"
                          ? levelTimeMsRef.current
                          : undefined
                      }
                      isNewBest={scoreResult?.isNewBest}
                      eventTimeLeft={eventTimeLeft}
                      onPlayReplay={playReplay}
                      onChallengeGhost={challengeGhost}
                      replayData={replayRecordingRef.current}
                    />
                  ) : (
                    <Leaderboard
                      language={language}
                      playerUuid={user?.uuid || ""}
                      username={user?.username}
                      currentScore={finalScore}
                      currentLevel={LEVELS[levelIndex].level}
                      isNewBest={scoreResult?.isNewBest}
                      eventTimeLeft={eventTimeLeft}
                      onPlayReplay={playReplay}
                      onChallengeGhost={challengeGhost}
                      replayData={replayRecordingRef.current}
                    />
                  )}
                </div>
              </div>
              );
            })()}
            {gameState === "cleared" && (
              <div className="text-center hud-panel p-12 my-auto">
                <h1 className="text-5xl md:text-7xl font-sans font-black text-white mb-6 tracking-tight drop-shadow-lg">
                  {t.clearedTitle}
                </h1>
                <p className="text-blue-300 font-sans text-2xl animate-pulse drop-shadow-md mb-6">
                  {t.clearedDesc}
                </p>
                {scoreResult && (
                  <div className="mb-4">
                    {scoreResult.isNewBest ? (
                      <span className="text-emerald-400 font-bold uppercase tracking-[0.1em] text-lg bg-emerald-400/10 px-5 py-2 rounded-full border border-emerald-400/30 inline-block shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                        {t.newScore}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-medium tracking-wide">
                        {t.yourScoreIs}{" "}
                        <strong className="text-white">
                          {scoreResult.previousBest
                            ? (() => {
                                const wpmVal = Math.round((tokens.length * 12000) / scoreResult.previousBest!);
                                const isWords = LEVELS[levelIndex]?.category === 'words';
                                const timeStr = isWords ? `${(scoreResult.previousBestUs ? parseFloat((scoreResult.previousBestUs / 1000).toFixed(1)) : scoreResult.previousBest!)}ms` : `${(scoreResult.previousBest! / 1000).toFixed(2)}s`;
                                return `${timeStr} (${wpmVal} WPM)`;
                              })()
                            : ""}
                        </strong>
                        {t.tryAgain}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {/* <MultiplayerModals 
          mpState={mpState}
          incomingChallenge={incomingChallenge}
          onAccept={acceptChallenge}
          onDecline={declineChallenge}
          onCancel={cancelChallenge}
          onSelectLevel={(idx) => sendLevelSelect(idx)}
          levels={LEVELS}
        /> */}
        {showTerms && <TermsModal language={language} onClose={() => setShowTerms(false)} />}
      </div>
      
      {isMobile && gameState === "playing" && (
        <div className="w-full relative z-[100]">
            <MobileKeyboard onKey={handleMobileVirtualKey} />
        </div>
      )}
    
      <GhostChallengeModal 
        challenge={incomingGhostChallenge}
        language={language}
        onAccept={(ghost) => {
            setIncomingGhostChallenge(null);
            challengeGhost(ghost.username, ghost.level, ghost.ghostData.replay_data, ghost.ghostData.time_ms);
        }}
        onDecline={() => setIncomingGhostChallenge(null)}
      />

      <QuestCompletionToast 
        quests={completedQuestNotifs} 
        language={language} 
        onDismiss={(id) => setCompletedQuestNotifs(prev => prev.filter(p => p.quest_id !== id))} 
      />

    </div>
  );
}
