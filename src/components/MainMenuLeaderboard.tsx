import React, { useEffect, useState, useMemo } from "react";
import {
  fetchTopScores,
  isSupabaseConfigured,
  fetchLevelTimes,
  isMobileDevice,
} from "../lib/supabase";
import { EFFECTS_MAP } from "../lib/effects";
import { getLevels } from "../lib/levels";
import { Language, TRANSLATIONS } from "../lib/i18n";
import {
  Trophy,
  Sparkles,
  Clock,
  Monitor,
  Smartphone,
  Link,
  X,
  Crown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

function getKeystrokesCount(text: string): number {
  let count = 0;
  let i = 0;
  while (i < text.length) {
    if (text.startsWith("[LEFT]", i)) {
      count++;
      i += 6;
    } else if (text.startsWith("[RIGHT]", i)) {
      count++;
      i += 7;
    } else {
      count++;
      i++;
    }
  }
  return count;
}

interface ScoreEntry {
  id: number;
  nickname: string;
  score?: number;
  time_ms?: number;
  marathon_time_ms?: number;
  level?: number;
  player_uuid: string;
  active_effect?: string;
  replay_data?: number[];
  time_us?: number;
}

interface MainMenuLeaderboardProps {
  playerUuid: string;
  username?: string;
  onClose?: () => void;
  eventTimeLeft?: string;
  language: Language;
  onPlayReplay?: (
    replayData: number[],
    targetLevelIndex: number,
    isMarathonReplay: boolean,
    originalTimeMs?: number,
    originalScore?: number,
  ) => void;
  onChallengeGhost?: (
    username: string,
    level: number,
    ghostReplayData: number[],
    timeMs: number,
  ) => void;
  onViewProfile?: (username: string, uuid: string) => void;
}

export function MainMenuLeaderboard({
  playerUuid,
  username,
  onClose,
  eventTimeLeft,
  language,
  onPlayReplay,
  onChallengeGhost,
  onViewProfile,
}: MainMenuLeaderboardProps) {
  const LEVELS = useMemo(() => getLevels(language), [language]);
  const t = TRANSLATIONS[language];

  const [activeTab, setActiveTab] = useState<"global" | number>("global");
  const [activeCategory, setActiveCategory] = useState<
    "marathon" | "classic" | "event" | "words" | "unlockable"
  >("marathon");
  const [isMobileView, setIsMobileView] = useState(isMobileDevice());
  const [refreshCount, setRefreshCount] = useState(0);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<any>(null);

  const categories = useMemo(
    () => [
      { id: "marathon", label: language === "en" ? "Marathon" : "Marathon" },
      { id: "classic", label: language === "en" ? "Classic" : "Klassisch" },
      { id: "event", label: "Event" },
      { id: "words", label: language === "en" ? "Words" : "Wörter" },
      {
        id: "unlockable",
        label: language === "en" ? "Unlockable" : "Freischaltbar",
      },
    ],
    [language],
  );

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId as any);
    if (catId === "marathon") {
      setActiveTab("global");
    } else {
      const firstLevel = LEVELS.find(
        (l) => (l.category || "classic") === catId,
      );
      if (firstLevel) setActiveTab(firstLevel.level);
    }
  };

  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOver: false,
  });

  useEffect(() => {
    const targetDate = new Date("2026-05-31T00:00:00+02:00");
    const update = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isOver: true,
        });
        return;
      }
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        isOver: false,
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const activeLevelAverageWpm = useMemo(() => {
    if (activeTab === "global" || scores.length === 0) return null;
    const lvlObj = LEVELS.find((l) => l.level === activeTab);
    if (!lvlObj) return null;
    const text = lvlObj.text || "";
    const keystrokes = getKeystrokesCount(text);
    if (keystrokes === 0) return null;

    const validScores = scores.filter((s) => s.time_ms && s.time_ms > 0);
    if (validScores.length === 0) return null;

    const sumWpm = validScores.reduce((sum, s) => {
      const w = (keystrokes * 12000) / s.time_ms!;
      return sum + w;
    }, 0);
    return Math.round(sumWpm / validScores.length);
  }, [activeTab, scores, LEVELS]);

  useEffect(() => {
    let isCurrent = true;
    const loadScores = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        let data;
        if (activeTab === "global") {
          data = await fetchTopScores(isMobileView, language);
        } else {
          data = await fetchLevelTimes(activeTab, isMobileView, language);
        }
        if (isCurrent) {
          setScores(data as ScoreEntry[]);
        }
      } catch (e) {
        if (isCurrent) {
          console.error(e);
          setFetchError(e as Error);
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };
    loadScores();
    return () => {
      isCurrent = false;
    };
  }, [activeTab, isMobileView, language, refreshCount]);

  const getTabColor = (level: number | "global") => {
    if (level === "global") return "#3b82f6";
    if (level === 6) return "#ef4444";
    const theme = LEVELS.find((l) => l.level === level)?.theme;
    return theme ? theme.playerColor : "#3b82f6";
  };

  const tabColorHex = getTabColor(activeTab);

  if (!isSupabaseConfigured) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="flex flex-col gap-6 w-full max-w-md text-left">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl flex flex-col gap-4 items-center justify-center text-center shadow-2xl">
            <h3 className="text-2xl font-black tracking-tight text-red-500 drop-shadow-md uppercase">
              {language === "de"
                ? "BESTENLISTE OFFLINE"
                : "LEADERBOARD OFFLINE"}
            </h3>
            <p className="text-sm text-slate-400 font-bold max-w-[280px]">
              {language === "de"
                ? "Supabase Zugangsdaten fehlen. Bitte füge "
                : "Supabase credentials are missing. Please add "}
              <span className="text-blue-400 font-mono">VITE_SUPABASE_URL</span>{" "}
              {language === "de" ? "und" : "and"}{" "}
              <span className="text-blue-400 font-mono">
                VITE_SUPABASE_ANON_KEY
              </span>{" "}
              {language === "de" ? "hinzu." : "."}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />{" "}
              {language === "de"
                ? "Bestenliste Schließen"
                : "Close Leaderboard"}
            </button>
          )}
        </div>
      </div>
    );
  }

  const top3 = scores.slice(0, 3);
  const rest = scores.slice(3);

  const renderScoreItem = (score: ScoreEntry, rank: number) => {
    const isMe = score.player_uuid === playerUuid;
    const isTop3 = rank <= 3;

    let timeStr = "";
    let wpmValue = 0;
    if (activeTab === "global") {
      timeStr = score.marathon_time_ms
        ? (score.marathon_time_ms / 1000).toFixed(2) + "s"
        : "";
    } else {
      const isWords = activeTab !== "global" && LEVELS.find(l => l.level === activeTab)?.category === 'words';
      timeStr = score.time_ms
        ? isWords
          ? `${(score.time_us ? parseFloat((score.time_us / 1000).toFixed(1)) : score.time_ms)}ms`
          : `${(score.time_ms / 1000).toFixed(2)}s`
        : "";
      const lvlObj = LEVELS.find((l) => l.level === activeTab);
      const keystrokes = getKeystrokesCount(lvlObj?.text || "");
      wpmValue =
        score.time_ms && keystrokes > 0
          ? Math.round((keystrokes * 12000) / score.time_ms)
          : 0;
    }

    const scoreElement = (
      <div className="flex flex-col items-end">
        <span
          className={`font-mono font-black ${isTop3 ? "text-2xl" : "text-xl"} text-white flex items-center gap-2`}
        >
          {activeTab === "global" && score.level && (
            <span
              className="text-sm opacity-80"
              style={{ color: getTabColor(score.level) }}
            >
              L{score.level}
            </span>
          )}
          {activeTab === "global" ? score.score : timeStr}
        </span>
        {activeTab === "global" && timeStr && (
          <span className="text-xs text-slate-400 font-mono font-bold uppercase tracking-widest mt-1">
            {timeStr}
          </span>
        )}
        {activeTab !== "global" && wpmValue > 0 && (
          <span className="text-xs text-slate-400 font-mono font-bold uppercase tracking-widest mt-1">
            {wpmValue} WPM
          </span>
        )}
      </div>
    );

    let effectClass =
      score.active_effect && EFFECTS_MAP[score.active_effect]
        ? EFFECTS_MAP[score.active_effect].className
        : EFFECTS_MAP[score.nickname.split("###")[1]]
          ? EFFECTS_MAP[score.nickname.split("###")[1]].className
          : isMe
            ? "text-white"
            : "text-slate-200";

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: rank * 0.05 }}
        key={score.id}
        className={`relative flex flex-row items-center justify-between p-4 rounded-xl transition-all border ${
          isMe
            ? "bg-slate-800/80 text-white shadow-lg"
            : isTop3
              ? `bg-slate-800/60 backdrop-blur-md text-white border-slate-700`
              : "bg-slate-900/40 text-slate-300 border-slate-800/50 hover:bg-slate-800/60"
        }`}
        style={
          isMe
            ? {
                borderColor: tabColorHex,
                boxShadow: `0 0 20px ${tabColorHex}30`,
                zIndex: 10,
              }
            : {}
        }
      >
        {isMe && (
          <div className="absolute inset-0 bg-blue-500/5 rounded-xl pointer-events-none" />
        )}

        <div className="flex flex-row items-center justify-start gap-4 flex-1 min-w-0 z-10 w-full">
          <div
            className={`w-8 shrink-0 flex justify-center text-xl font-black ${isTop3 && rank === 1 ? "text-yellow-400" : isTop3 && rank === 2 ? "text-slate-300" : isTop3 && rank === 3 ? "text-amber-500" : "text-slate-500"}`}
          >
            {isTop3 ? (
              <Crown
                className={`w-6 h-6 ${rank === 1 ? "fill-yellow-500/20" : rank === 2 ? "fill-slate-300/20" : "fill-amber-600/20"}`}
              />
            ) : (
              `#${rank}`
            )}
          </div>

          <div className="flex flex-col min-w-0 w-full">
            <div className="flex items-center gap-2 justify-start">
              {score.nickname &&
              !score.nickname.includes(t.guest) &&
              score.player_uuid &&
              !score.player_uuid.startsWith("guest_") &&
              onViewProfile ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewProfile(
                      score.nickname.split("###")[0],
                      score.player_uuid,
                    );
                  }}
                  className={`font-black text-lg md:text-xl truncate hover:text-purple-400 transition-colors ${effectClass}`}
                >
                  {score.nickname.split("###")[0]}
                </button>
              ) : (
                <span
                  className={`font-black text-lg md:text-xl truncate ${effectClass}`}
                >
                  {score.nickname.split("###")[0]}
                </span>
              )}
              {isMe && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest bg-blue-500/20 text-blue-400 shrink-0 border border-blue-500/30">
                  {language === "de" ? "DU" : "YOU"}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 z-10">
          {scoreElement}
          {score.replay_data &&
            score.replay_data.length > 0 &&
            onPlayReplay && (
              <div className="flex items-center gap-2 pl-4 border-l border-slate-700/50">
                <button
                  title={language === "de" ? "Replay ansehen" : "Watch Replay"}
                  onClick={(e) => {
                    e.stopPropagation();
                    const targetLevel =
                      activeTab === "global" ? 0 : Math.max(0, LEVELS.findIndex(l => l.level === activeTab));
                    onPlayReplay(
                      score.replay_data!,
                      targetLevel,
                      activeTab === "global",
                      activeTab === "global"
                        ? score.marathon_time_ms
                        : score.time_ms,
                      score.score,
                    );
                    if (onClose) onClose();
                  }}
                  className="w-10 h-10 rounded-full bg-emerald-500/10 hover:bg-emerald-500/30 hover:scale-105 text-emerald-400 border border-emerald-500/30 flex items-center justify-center transition-all group shrink-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 ml-1"
                  >
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </button>

                {score.nickname &&
                  score.nickname !== t.guest &&
                  onChallengeGhost && (
                    <button
                      title={
                        language === "de"
                          ? "Ghost direkt herausfordern"
                          : "Challenge Ghost"
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        const targetLevel =
                          activeTab === "global" ? 0 : (activeTab as number);
                        onChallengeGhost(
                          score.nickname.split("###")[0],
                          targetLevel,
                          score.replay_data!,
                          activeTab === "global"
                            ? score.marathon_time_ms!
                            : score.time_ms!,
                        );
                        if (onClose) onClose();
                      }}
                      className="w-10 h-10 rounded-full bg-indigo-500/10 hover:bg-indigo-500/30 hover:scale-105 text-indigo-400 border border-indigo-500/30 flex items-center justify-center transition-all group shrink-0"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-5 h-5"
                      >
                        <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"></polyline>
                        <line x1="13" y1="19" x2="19" y2="13"></line>
                        <line x1="16" y1="16" x2="20" y2="20"></line>
                        <line x1="19" y1="21" x2="21" y2="19"></line>
                      </svg>
                    </button>
                  )}
              </div>
            )}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-3xl flex flex-col overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent_50%)]" />

      {/* Header */}
      <div className="flex flex-col items-center justify-center p-6 md:p-8 border-b border-white/5 relative z-10 bg-slate-900/50">
        <img
          src={
            language === "de" ? "/bestenliste-de.png" : "/bestenliste-en.png"
          }
          alt={language === "de" ? "Bestenliste" : "Hall of Fame"}
          className="h-16 md:h-20 object-contain drop-shadow-[0_0_15px_rgba(0,150,255,0.8)] mb-2 mt-4"
        />
        <div className="h-6">
          {activeLevelAverageWpm && (
            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs md:text-sm">
              {language === "de" ? "Gesamtdurchschnitt" : "Overall Average"}:{" "}
              <span className="text-emerald-400 font-mono">
                {activeLevelAverageWpm} WPM
              </span>
            </p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 transition-all flex items-center justify-center shrink-0 z-20 shadow-lg"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col relative z-10">
        {/* Category Navigation - Top Bar */}
        <div className="w-full border-b border-white/5 bg-slate-900/30 p-4 md:p-6 flex flex-col gap-4 shrink-0">
          {/* Primary Categories */}
          <div className="flex overflow-x-auto custom-scrollbar pb-2 items-center justify-start md:justify-center gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`shrink-0 px-6 py-2.5 rounded-full font-bold uppercase tracking-widest text-xs transition-all border ${activeCategory === cat.id ? "bg-blue-600 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.5)] text-white" : "bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800/80 hover:text-white"}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Secondary Level Nav (only if not marathon and > 1 level) */}
          {activeCategory !== "marathon" && (
            <div className="flex overflow-x-auto custom-scrollbar items-center justify-start md:justify-center gap-2">
              {LEVELS.filter(
                (l) => (l.category || "classic") === activeCategory,
              ).map((lvl) => {
                const isSpecial =
                  ("isSpecialEvent" in lvl && lvl.isSpecialEvent) ||
                  lvl.level === 7 ||
                  activeCategory === "event";
                const isActive = activeTab === lvl.level;
                const tColor = getTabColor(lvl.level);

                return (
                  <button
                    key={lvl.level}
                    onClick={() => setActiveTab(lvl.level)}
                    className={`shrink-0 px-4 py-2 rounded-xl border transition-all text-xs font-black uppercase tracking-widest relative overflow-hidden ${isActive ? "scale-[1.02] text-white" : "bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800/80 hover:text-white"}`}
                    style={
                      isActive
                        ? {
                            backgroundColor: `${tColor}20`,
                            borderColor: tColor,
                            boxShadow: `0 0 20px ${tColor}30`,
                          }
                        : {}
                    }
                  >
                    {isSpecial && (
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] bg-[length:10px_10px]" />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      {isSpecial && (
                        <Sparkles
                          className="w-3 h-3"
                          style={{ color: tColor }}
                        />
                      )}
                      {lvl.category === "words"
                        ? lvl.difficultyName
                        : lvl.level > 20
                          ? `Lvl ${lvl.level - 20}`
                          : `Lvl ${lvl.level}`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Leaderboard Viewpane */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Event Banner */}
          {activeTab === 7 && (
            <div className="bg-gradient-to-r from-pink-500/20 via-indigo-500/20 to-cyan-500/20 border-b border-indigo-500/30 p-4 shrink-0 flex items-center justify-between">
              <span className="font-bold text-indigo-200 uppercase tracking-widest text-sm flex items-center gap-2">
                <Clock className="w-5 h-5 text-pink-400" />{" "}
                {language === "de" ? "Event endet in:" : "Event ends in:"}{" "}
                {eventTimeLeft || "06d 23h 59m"}
              </span>
              <span className="text-xs text-indigo-300 font-medium hidden md:block">
                {language === "de"
                  ? "Gewinne exklusive Kosmetika für den 1. Platz!"
                  : "Win exclusive cosmetics for placing 1st!"}
              </span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar pb-32">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-blue-500/20 animate-spin"></div>
              </div>
            ) : fetchError ? (
              <div className="flex h-full items-center justify-center text-red-500 font-bold uppercase tracking-widest text-xl">
                Error: {fetchError.message || fetchError}
              </div>
            ) : scores.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-500 font-bold uppercase tracking-widest text-2xl">
                {language === "de" ? "Noch keine Einträge" : "No Entries Yet"}
              </div>
            ) : (
              <div className="max-w-5xl mx-auto flex flex-col gap-12">
                {/* Unified List */}
                <div className="flex flex-col gap-3">
                  <div className="text-sm font-black uppercase tracking-widest text-slate-500 mb-2 pl-4">
                    {language === "de" ? "Top Platzierungen" : "Top Placements"}
                  </div>
                  {top3.map((score, idx) => renderScoreItem(score, idx + 1))}
                </div>

                {/* Rest of list */}
                {rest.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="text-sm font-black uppercase tracking-widest text-slate-500 mb-2 pl-4">
                      {language === "de" ? "Herausforderer" : "Contenders"}
                    </div>
                    {rest.map((score, idx) => renderScoreItem(score, idx + 4))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
