import React, { useEffect, useState, useMemo } from "react";
import {
  fetchTopScores,
  submitScore,
  isSupabaseConfigured,
  fetchLevelTimes,
  submitLevelTime,
  isMobileDevice,
  fetchCommunityLevelLeaderboard
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
} from "lucide-react";

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

const getHighScoreMessage = (language: Language, seed: number) => {
  const messages = TRANSLATIONS[language].highScoreMessages || [];
  return messages.length ? messages[seed % messages.length] : "";
};

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

interface LeaderboardProps {
  playerUuid: string;
  username?: string;
  currentScore?: number;
  currentLevel?: number;
  communityLevelId?: string;
  communityKeystrokes?: number;
  isTimeAttack?: boolean;
  levelTimeMs?: number;
  isNewBest?: boolean;
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
  replayData?: number[];
  onChallengeGhost?: (
    username: string,
    level: number,
    ghostReplayData: number[],
    timeMs: number,
  ) => void;
  onViewProfile?: (username: string, uuid: string) => void;
}

export function Leaderboard({
  playerUuid,
  username,
  currentScore,
  currentLevel,
  communityLevelId,
  communityKeystrokes,
  isTimeAttack,
  levelTimeMs,
  isNewBest,
  onClose,
  eventTimeLeft,
  language,
  onPlayReplay,
  replayData,
  onChallengeGhost,
  onViewProfile,
}: LeaderboardProps) {
  const LEVELS = useMemo(() => getLevels(language), [language]);
  const t = TRANSLATIONS[language];
  if (!isSupabaseConfigured) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-md mx-auto text-left">
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 bg-slate-900/40 border border-slate-800/50 shadow-2xl text-center items-center justify-center">
          <h3 className="text-xl font-black tracking-tight text-red-500 drop-shadow-md uppercase text-center">
            LEADERBOARD OFFLINE
          </h3>
          <p className="text-sm text-slate-400 font-bold max-w-[280px]">
            Supabase credentials are missing. Please add{" "}
            <span className="text-blue-300 font-mono">VITE_SUPABASE_URL</span>{" "}
            and{" "}
            <span className="text-blue-300 font-mono">
              VITE_SUPABASE_ANON_KEY
            </span>{" "}
            to your environment variables.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white uppercase tracking-widest text-sm font-bold transition-colors"
          >
            Close Leaderboard
          </button>
        )}
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<"global" | number>(
    isTimeAttack && currentLevel && currentScore === undefined
      ? currentLevel
      : "global",
  );
  const [isMobileView, setIsMobileView] = useState(isMobileDevice());
  const [refreshCount, setRefreshCount] = useState(0);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<any>(null);

  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOver: false,
  });

  useEffect(() => {
    // Target is May 30, 2026 24:00:00 German Time (which is May 31, 00:00:00 CEST UTC+2)
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

  const randomScoreMessage = useMemo(() => {
    return getHighScoreMessage(language, Math.floor(Math.random() * 100));
  }, [language]);

  const activeLevelAverageWpm = useMemo(() => {
    if (activeTab === "global" || scores.length === 0) return null;
    let keystrokes = 0;
    if (communityLevelId && communityKeystrokes) {
        keystrokes = communityKeystrokes;
    } else {
        const lvlObj = LEVELS.find((l) => l.level === activeTab);
        if (!lvlObj) return null;
        const text = lvlObj.text || "";
        keystrokes = getKeystrokesCount(text);
    }
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
    setActiveTab(
      isTimeAttack && currentLevel && currentScore === undefined
        ? currentLevel
        : "global",
    );
  }, [currentLevel, isTimeAttack, currentScore]);
  const [nickname, setNickname] = useState(
    username || localStorage.getItem("player_nickname") || "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (username) {
      setNickname(username);
    }
  }, [username]);

  useEffect(() => {
    let isCurrent = true;

    const loadScores = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        let data;
        if (communityLevelId) {
            data = await fetchCommunityLevelLeaderboard(communityLevelId);
        } else if (activeTab === "global") {
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
  }, [activeTab, isMobileView, isNewBest, language, refreshCount]);

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    const validNickname = nickname
      .trim()
      .substring(0, 15)
      .replace(/[^a-zA-Z0-9 ]/g, "");

    setIsSubmitting(true);
    setSubmitError("");
    try {
      localStorage.setItem("player_nickname", validNickname);
      if (
        isTimeAttack &&
        levelTimeMs !== undefined &&
        currentLevel !== undefined
      ) {
        await submitLevelTime(
          validNickname,
          levelTimeMs,
          playerUuid,
          currentLevel,
          replayData || null,
          language,
        );
        if (activeTab !== currentLevel) {
          setActiveTab(currentLevel);
        } else {
          setRefreshCount((c) => c + 1);
        }
      } else if (currentScore !== undefined && currentLevel !== undefined) {
        await submitScore(
          validNickname,
          currentScore,
          playerUuid,
          currentLevel,
          replayData || null,
          language,
        );
        if (activeTab !== "global") {
          setActiveTab("global");
        } else {
          setRefreshCount((c) => c + 1);
        }
      } else if (currentScore !== undefined) {
        await submitScore(
          validNickname,
          currentScore,
          playerUuid,
          1,
          replayData || null,
          language,
        );
        if (activeTab !== "global") {
          setActiveTab("global");
        } else {
          setRefreshCount((c) => c + 1);
        }
      }
    } catch (e: any) {
      if (e?.code === "42501") {
        setSubmitError(
          "Keine Berechtigung. Führe GRANT ALL ON TABLE public.leaderboard TO anon; aus.",
        );
      } else if (e?.code === "42703") {
        setSubmitError(
          'Spalte "is_mobile" fehlt. Führe ALTER TABLE leaderboard ADD COLUMN is_mobile BOOLEAN NOT NULL DEFAULT false; und dasselbe für level_times aus.',
        );
      } else {
        setSubmitError(e.message || "Fehler beim Senden. Prüfe die Konsole.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current tab's theme colors
  const getTabColor = (level: number | "global") => {
    if (level === "global") return "#3b82f6";
    if (level === 6) return "#ef4444"; // Use red for level 6 instead of white for better UI
    const theme = LEVELS.find((l) => l.level === level)?.theme;
    return theme ? theme.playerColor : "#3b82f6";
  };

  const tabColorHex = getTabColor(activeTab);

  // Convert hex to rgb for rgba usage if needed, or just rely on inline styles
  const tabStyle = (isActive: boolean, color: string) => {
    if (isActive) {
      return {
        backgroundColor: color,
        color: "#fff",
        boxShadow: `0 0 15px ${color}80`,
        borderColor: color,
      };
    }
    return {
      backgroundColor: "#1e293b",
      color: "#94a3b8",
      borderColor: "#334155",
    };
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg mx-auto text-left relative z-10">
      {((currentScore !== undefined && currentScore > 0) ||
        (isTimeAttack && levelTimeMs !== undefined)) && (
        <div
          className="glass-panel p-6 rounded-2xl flex flex-col gap-4 bg-slate-900/70 border border-slate-700/50 shadow-2xl backdrop-blur-xl relative overflow-hidden"
          style={{
            borderColor:
              activeTab !== "global" ? tabColorHex : "rgba(51, 65, 85, 0.5)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          <h3 className="text-xl font-black text-white drop-shadow-md z-10 flex justify-between items-center sm:flex-row flex-col sm:gap-0 gap-2">
            {isTimeAttack ? t.yourTime : t.marathonScore}
            <div className="flex flex-col items-end shrink-0">
              <span
                className="text-2xl"
                style={{
                  color:
                    (currentLevel &&
                      LEVELS.find((l) => l.level === currentLevel)?.theme
                        .playerColor) ||
                    "#60a5fa",
                }}
              >
                {isTimeAttack
                  ? (currentLevel && LEVELS.find(l => l.level === currentLevel)?.category === 'words')
                    ? `${levelTimeMs!}ms`
                    : `${(levelTimeMs! / 1000).toFixed(2)}s`
                  : currentScore}
              </span>
              {isTimeAttack && currentLevel !== undefined && levelTimeMs && (() => {
                let keystrokes = 0;
                if (communityLevelId && communityKeystrokes) {
                   keystrokes = communityKeystrokes;
                } else {
                   const lvlObj = LEVELS.find((l) => l.level === currentLevel);
                   keystrokes = getKeystrokesCount(lvlObj?.text || "");
                }
                if (keystrokes > 0) {
                  return (
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                        {Math.round((keystrokes * 12000) / levelTimeMs)} WPM
                    </span>
                  );
                }
                return null;
              })()}
            </div>
          </h3>

          <form
            onSubmit={handleSubmitScore}
            className="flex flex-col gap-2 z-10"
          >
            {username ? (
              <div className="flex flex-col gap-3">
                <div className="text-sm text-slate-300">
                  {t.loggedInAs}{" "}
                  <span className="text-white font-bold">{username}</span>.
                  {isNewBest === true && (
                    <>
                      <br />
                      <span className="text-emerald-400 font-bold mt-1 inline-block bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]">
                        {t.newHighScoreSaved}
                      </span>
                      <div className="text-emerald-400/80 text-xs mt-1.5 italic font-bold">
                        „{randomScoreMessage}“
                      </div>
                    </>
                  )}
                  {isNewBest === false && (
                    <>
                      <br />
                      <span className="text-slate-400 font-bold mt-1 inline-block bg-slate-400/10 px-2 py-0.5 rounded-md border border-slate-400/20 shadow-[0_0_10px_rgba(0,0,0,0.1)] text-xs">
                        {t.timeNotSaved}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <>
                <label className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                  {t.enterNickname}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-slate-800/80 border border-slate-600 rounded-lg px-4 py-2 text-white font-sans focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-bold placeholder-slate-500 shadow-inner"
                    placeholder={t.anonymous}
                    maxLength={15}
                    value={nickname}
                    onChange={(e) =>
                      setNickname(e.target.value.replace(/[^a-zA-Z0-9 ]/g, ""))
                    }
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !nickname.trim()}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold uppercase tracking-widest transition-all shadow-[0_4px_14px_rgba(37,99,235,0.4)]"
                  >
                    {isSubmitting ? "..." : t.submit}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight mt-1">
                  {t.privacyHint}
                </p>
              </>
            )}
            {submitError && (
              <p className="text-red-400 text-xs mt-1 bg-red-400/10 p-2 rounded-lg border border-red-400/20">
                {submitError}
              </p>
            )}
          </form>
        </div>
      )}

      <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 bg-slate-900/60 border border-slate-800/50 shadow-2xl backdrop-blur-xl overflow-hidden relative">
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: `radial-gradient(circle at 100% 0%, ${tabColorHex}, transparent 60%)`,
          }}
        />

        <div className="flex flex-col mb-4 border-b border-slate-800/80 pb-4 z-10 w-full relative mt-2">
          {activeTab === 7 && (
            <div className="absolute -top-12 sm:-top-8 right-0 pointer-events-none opacity-40 mix-blend-screen overflow-hidden left-0 h-24 blur-xl bg-gradient-to-r from-pink-500 via-indigo-500 to-cyan-500" />
          )}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10 w-full">
            <div className="flex flex-col">
              <h3
                className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-md shrink-0 uppercase"
                style={{ textShadow: `0 0 20px ${tabColorHex}80` }}
              >
                {communityLevelId ? "LEVEL GENERATOR RANKING" : 
                 activeTab === "global"
                  ? "MARATHON RANKING"
                  : activeTab === 7
                    ? "EVENT RANKING"
                    : activeTab === 8
                      ? "DIONYSOFT RANKING"
                      : `LEVEL ${activeTab} RANKING`}
              </h3>
              {activeLevelAverageWpm !== null && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                    Ø TYPING SPEED:
                  </span>
                  <span className="text-[10px] bg-slate-850 text-emerald-400 font-black px-2 py-0.5 rounded border border-emerald-500/20 shadow-[0_0_8px_rgba(52,211,153,0.15)] uppercase tracking-wider font-mono">
                    {activeLevelAverageWpm} WPM
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto self-start sm:self-auto shrink-0 z-10 relative">
              {isMobileDevice() && (
                <button
                  onClick={() => setIsMobileView(!isMobileView)}
                  className="px-4 py-2 min-h-[44px] w-full sm:w-auto rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 text-white bg-blue-600/30 border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.2)] hover:bg-blue-600/40"
                  style={{
                    backgroundColor:
                      activeTab !== "global" && activeTab !== 7
                        ? `${tabColorHex}50`
                        : undefined,
                    borderColor:
                      activeTab !== "global" && activeTab !== 7
                        ? `${tabColorHex}80`
                        : undefined,
                    boxShadow:
                      activeTab !== "global" && activeTab !== 7
                        ? `0 0 15px ${tabColorHex}40`
                        : undefined,
                    textShadow: `0 0 10px ${activeTab !== "global" && activeTab !== 7 ? tabColorHex : "rgba(59, 130, 246, 1)"}80`,
                  }}
                >
                  {isMobileView ? (
                    <>
                      <Smartphone className="w-4 h-4 shrink-0" />{" "}
                      <span className="shrink-0 whitespace-nowrap">Mobile</span>
                    </>
                  ) : (
                    <>
                      <Monitor className="w-4 h-4 shrink-0" />{" "}
                      <span className="shrink-0 whitespace-nowrap">
                        Desktop
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          {activeTab === 7 && (
            <div className="mt-2 bg-pink-500/10 border border-pink-500/30 rounded-lg p-2.5 flex flex-col gap-1 z-10 relative">
              <span className="text-[10px] sm:text-xs text-pink-300 font-bold uppercase tracking-wide">
                ⏳{" "}
                {language === "de"
                  ? "Das Event läuft nur noch bis"
                  : "The event ends in"}{" "}
                {eventTimeLeft || "06d 23h 59m"}
              </span>
              <span className="text-[9px] sm:text-[10px] text-pink-400/80 font-medium leading-tight">
                {language === "de"
                  ? "Danach wird das Ranking zurückgesetzt und der Erstplatzierte erhält exklusive Kosmetika!"
                  : "After that, the ranking resets and the 1st place wins exclusive cosmetics!"}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar z-10">
          {loading ? (
            <div className="text-center text-slate-500 py-12 animate-pulse text-sm tracking-widest uppercase flex flex-col items-center gap-4">
              <div
                className="w-8 h-8 rounded-full border-2 border-t-white border-white/20 animate-spin"
                style={{ borderTopColor: tabColorHex }}
              ></div>
              {t.loadingLeaderboard}
            </div>
          ) : fetchError ? (
            <div className="flex flex-col gap-3 p-4 bg-slate-900/60 border border-red-500/30 rounded-xl text-center">
              <p className="text-red-400 font-bold text-xs uppercase tracking-widest">
                {t.errorLabel}
              </p>
              <p className="text-sm text-slate-300">
                {fetchError.message || fetchError}
              </p>
            </div>
          ) : scores.length === 0 ? (
            <div className="text-center text-slate-500 py-12 text-sm uppercase tracking-widest font-bold">
              {t.noEntries}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {(() => {
                let currentRank = 1;
                const ranks = scores.map((s) => {
                  return currentRank++;
                });

                return scores.map((score, index) => {
                  const isMe = score.player_uuid === playerUuid;
                  const rank = ranks[index];
                  const isTop3 = rank !== null && rank <= 3;

                  return (
                    <div
                      key={score.id}
                      className={`flex items-center justify-between p-3 sm:px-4 rounded-xl transition-all ${
                        isMe
                          ? "bg-slate-800/80 border text-white"
                          : isTop3
                            ? "bg-slate-800/40 border border-slate-700/50 text-slate-200"
                            : "bg-slate-900/30 text-slate-400 border border-transparent hover:bg-slate-800/50 hover:border-slate-700/30"
                      }`}
                      style={
                        isMe
                          ? {
                              borderColor: tabColorHex,
                              boxShadow: `0 0 15px ${tabColorHex}30`,
                            }
                          : {}
                      }
                    >
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 pr-2">
                        <div className="w-8 flex justify-center shrink-0">
                          {rank === 1 ? (
                            <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center text-yellow-400 font-black shadow-[0_0_10px_rgba(234,179,8,0.4)]">
                              1
                            </div>
                          ) : rank === 2 ? (
                            <div className="w-8 h-8 rounded-full bg-slate-300/20 border border-slate-300/50 flex items-center justify-center text-slate-300 font-black shadow-[0_0_10px_rgba(203,213,225,0.4)]">
                              2
                            </div>
                          ) : rank === 3 ? (
                            <div className="w-8 h-8 rounded-full bg-amber-600/20 border border-amber-600/50 flex items-center justify-center text-amber-500 font-black shadow-[0_0_10px_rgba(217,119,6,0.4)]">
                              3
                            </div>
                          ) : (
                            <div className="text-slate-600 font-black text-sm">
                              #{rank}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <div className="flex items-center flex-wrap gap-1.5 min-w-0">
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
                                className={`font-bold text-sm sm:text-base truncate max-w-[120px] sm:max-w-none hover:text-purple-400 transition-colors ${
                                  score.active_effect &&
                                  EFFECTS_MAP[score.active_effect]
                                    ? EFFECTS_MAP[score.active_effect].className
                                    : EFFECTS_MAP[
                                          score.nickname.split("###")[1]
                                        ]
                                      ? EFFECTS_MAP[
                                          score.nickname.split("###")[1]
                                        ].className
                                      : isMe
                                        ? "text-white"
                                        : ""
                                }`}
                              >
                                {score.nickname.split("###")[0]}
                              </button>
                            ) : (
                              <span
                                className={`font-bold text-sm sm:text-base truncate max-w-[120px] sm:max-w-none ${
                                  score.active_effect &&
                                  EFFECTS_MAP[score.active_effect]
                                    ? EFFECTS_MAP[score.active_effect].className
                                    : EFFECTS_MAP[
                                          score.nickname.split("###")[1]
                                        ]
                                      ? EFFECTS_MAP[
                                          score.nickname.split("###")[1]
                                        ].className
                                      : isMe
                                        ? "text-white"
                                        : ""
                                }`}
                              >
                                {score.nickname.split("###")[0]}
                              </span>
                            )}

                            {((score.active_effect &&
                              EFFECTS_MAP[score.active_effect]) ||
                              (score.nickname.split("###")[1] &&
                                EFFECTS_MAP[
                                  score.nickname.split("###")[1]
                                ])) && (
                              <span className="text-[7px] sm:text-[8px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded uppercase font-black tracking-widest border border-indigo-500/40 shrink-0 whitespace-nowrap">
                                Event Champion
                              </span>
                            )}
                            {isMe && (
                              <span
                                className="text-[9px] font-black px-2 py-0.5 rounded uppercase shrink-0"
                                style={{
                                  backgroundColor: `${tabColorHex}30`,
                                  color: tabColorHex,
                                }}
                              >
                                DU
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <span
                          className={`font-black font-mono text-sm sm:text-base text-right leading-tight flex flex-col items-end ${isTop3 && !isMe ? "text-white" : ""}`}
                          style={
                            activeTab === "global" && score.level
                              ? { color: getTabColor(score.level) }
                              : isMe
                                ? { color: tabColorHex }
                                : {}
                          }
                        >
                          {activeTab === "global" ? (
                            <>
                              <div>
                                {score.level ? (
                                  <span className="text-xs mr-1 opacity-80">
                                    L{score.level}
                                  </span>
                                ) : (
                                  ""
                                )}
                                {score.score}
                              </div>
                              {score.marathon_time_ms && (
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                  {(score.marathon_time_ms / 1000).toFixed(2)}s
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              {score.time_ms
                                ? (() => {
                                    let keystrokes = 0;
                                    if (communityLevelId && communityKeystrokes) {
                                       keystrokes = communityKeystrokes;
                                    } else {
                                       const lvlObj = LEVELS.find((l) => l.level === activeTab);
                                       const text = lvlObj?.text || "";
                                       keystrokes = getKeystrokesCount(text);
                                    }
                                    const sWpm =
                                      keystrokes > 0
                                        ? Math.round(
                                            (keystrokes * 12000) /
                                              score.time_ms,
                                          )
                                        : 0;
                                    return (
                                      <>
                                        <div>
                                          {(activeTab !== "global" && LEVELS.find(l => l.level === activeTab)?.category === 'words')
                                            ? `${(score.time_us ? parseFloat((score.time_us / 1000).toFixed(1)) : score.time_ms)}ms`
                                            : `${(score.time_ms / 1000).toFixed(2)}s`}
                                        </div>
                                        {sWpm > 0 && (
                                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                            {sWpm} WPM
                                          </span>
                                        )}
                                      </>
                                    );
                                  })()
                                : ""}
                            </>
                          )}
                        </span>

                        {score.replay_data &&
                          score.replay_data.length > 0 &&
                          onPlayReplay && (
                            <div className="flex items-center gap-1 sm:gap-2 pl-2 border-l border-slate-700/50">
                              <button
                                title={
                                  language === "de"
                                    ? "Replay ansehen"
                                    : "Watch Replay"
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const targetLevel =
                                    activeTab === "global"
                                      ? 0
                                      : Math.max(0, LEVELS.findIndex(l => l.level === activeTab));
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
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 flex items-center justify-center transition-all group shrink-0"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5 group-hover:scale-110 transition-transform"
                                >
                                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                              </button>

                              {score.nickname &&
                                score.nickname !== t.guest &&
                                score.replay_data &&
                                score.replay_data.length > 0 &&
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
                                        activeTab === "global"
                                          ? 0
                                          : (activeTab as number);
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
                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-500/10 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center transition-all group shrink-0 relative"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 group-hover:rotate-12 transition-transform"
                                    >
                                      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"></polyline>
                                      <line
                                        x1="13"
                                        y1="19"
                                        x2="19"
                                        y2="13"
                                      ></line>
                                      <line
                                        x1="16"
                                        y1="16"
                                        x2="20"
                                        y2="20"
                                      ></line>
                                      <line
                                        x1="19"
                                        y1="21"
                                        x2="21"
                                        y2="19"
                                      ></line>
                                    </svg>
                                  </button>
                                )}

                              {score.nickname && score.nickname !== t.guest && (
                                <button
                                  title={
                                    language === "de"
                                      ? "Link zum Herausfordern kopieren"
                                      : "Copy link to challenge"
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const btn = e.currentTarget;
                                    const urlLevel =
                                      activeTab === "global"
                                        ? 0
                                        : (activeTab as number);
                                    const urlStr = `${window.location.origin}${window.location.pathname}?ghost=${encodeURIComponent(score.nickname || "")}&level=${urlLevel}&lang=${language}`;
                                    navigator.clipboard
                                      .writeText(urlStr)
                                      .then(() => {
                                        const originalIcon = btn.innerHTML;
                                        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 sm:w-4 sm:h-4"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                                        btn.classList.add(
                                          "bg-blue-500",
                                          "text-white",
                                          "border-blue-400",
                                        );
                                        btn.classList.remove(
                                          "bg-blue-500/10",
                                          "text-blue-400",
                                        );
                                        setTimeout(() => {
                                          btn.innerHTML = originalIcon;
                                          btn.classList.remove(
                                            "bg-blue-500",
                                            "text-white",
                                            "border-blue-400",
                                          );
                                          btn.classList.add(
                                            "bg-blue-500/10",
                                            "text-blue-400",
                                          );
                                        }, 2000);
                                      });
                                  }}
                                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500/10 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 flex items-center justify-center transition-all group shrink-0 relative"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform"
                                  >
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                                  </svg>
                                </button>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="mt-2 text-slate-400 hover:text-white uppercase tracking-widest text-xs font-bold transition-all z-10 bg-slate-900/50 hover:bg-slate-800 py-3 rounded-xl border border-slate-800"
        >
          {language === "de" ? "Bestenliste schließen" : "Close Leaderboard"}
        </button>
      )}
    </div>
  );
}
