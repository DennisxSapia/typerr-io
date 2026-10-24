import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { fetchUserPublicStats } from '../lib/supabase';
import { User, ChevronLeft, Trophy, Clock, Activity, Flame, Crown } from 'lucide-react';
import { Language, TRANSLATIONS } from '../lib/i18n';

interface PublicProfileProps {
    username: string;
    uuid: string;
    language: Language;
    onClose: () => void;
}

export function PublicProfile({ username, uuid, language, onClose }: PublicProfileProps) {
    const t = TRANSLATIONS[language];
    const [statsLoading, setStatsLoading] = useState(true);
    const [xp, setXp] = useState(0);
    const [marathonScore, setMarathonScore] = useState(0);
    const [maxLevel, setMaxLevel] = useState(1);
    const [levelStats, setLevelStats] = useState<any[]>([]);
    const [completedQuests, setCompletedQuests] = useState(0);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await fetchUserPublicStats(uuid);
                if (data) {
                    setXp(data.xp || 0);
                    setMarathonScore(data.marathonScore || 0);
                    setMaxLevel(data.maxLevel || 1);
                    setLevelStats(data.levelTimes || []);
                    setCompletedQuests(data.completedQuests || 0);
                }
            } catch (err) {
                console.error("Error loading public stats:", err);
            } finally {
                setStatsLoading(false);
            }
        };

        if (uuid) loadStats();
    }, [uuid]);

    const formatTime = (ms: number) => {
        return (ms / 1000).toFixed(2) + 's';
    };

    const playerLevel = Math.floor(Math.sqrt(xp / 100)) + 1;
    const currentLevelXp = xp - (Math.pow(playerLevel - 1, 2) * 100);
    const nextLevelXp = (Math.pow(playerLevel, 2) * 100) - (Math.pow(playerLevel - 1, 2) * 100);
    const xpProgress = Math.min(100, Math.max(0, (currentLevelXp / nextLevelXp) * 100));

    // Fallback translations if they don't exist yet
    const tProfile = t.publicProfile || "Public Profile";
    const tLevel = t.playerLevel || "Player Level";

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-3xl flex flex-col overflow-y-auto overflow-x-hidden min-h-screen text-slate-200 m-0 p-0"
        >
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.1),transparent_50%)]" />
            
            <div className="sticky top-0 z-20 flex items-center justify-between p-6 md:p-8 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onClose}
                        className="p-3 bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-all text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 shadow-sm"
                    >
                        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase drop-shadow-md flex items-center gap-3">
                            <User className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />    
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Player Profile</span>
                        </h2>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-10 flex flex-col gap-8 z-10 relative">
                
                {/* Hero / Identity Section */}
                <div className="glass-panel p-8 md:p-14 rounded-[2rem] md:rounded-[3rem] flex flex-col md:flex-row gap-8 items-center md:items-start justify-between bg-slate-900/60 border border-slate-700/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_50%)] pointer-events-none group-hover:opacity-100 transition-opacity duration-700 opacity-70" />
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-slate-900/0 to-transparent pointer-events-none group-hover:from-purple-500/20 transition-all duration-700" />
                    
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-10 z-10 w-full">
                        <div className="w-28 h-28 md:w-40 md:h-40 rounded-[2rem] bg-gradient-to-br from-purple-600 to-indigo-400 p-[3px] shadow-[0_20px_50px_rgba(168,85,247,0.3)] relative shrink-0">
                            <div className="absolute -inset-2 bg-purple-500/30 blur-2xl rounded-full -z-10" />
                            <div className="w-full h-full bg-slate-950 rounded-[calc(2rem-3px)] flex items-center justify-center">
                                <User className="w-14 h-14 md:w-20 md:h-20 text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                            </div>
                        </div>
                        <div className="flex flex-col items-center md:items-start text-center md:text-left pt-2 flex-1 w-full relative">
                            <h3 className="text-4xl md:text-7xl font-black tracking-tighter text-white uppercase leading-none drop-shadow-2xl mb-3">
                                {username}
                            </h3>
                            <div className="flex items-center justify-center md:justify-start gap-2 bg-slate-800/80 border border-slate-700/50 px-4 py-2 rounded-xl shadow-inner">
                                <Crown className="w-5 h-5 text-yellow-400" />
                                <p className="text-sm md:text-base text-slate-300 uppercase tracking-widest font-bold">
                                    {tProfile}
                                </p>
                            </div>

                            {/* Level / XP Bar Section */}
                            <div className="mt-10 w-full max-w-2xl bg-slate-900/50 p-6 md:p-8 rounded-3xl border border-slate-700/50 shadow-inner">
                                <div className="flex justify-between items-end mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                                            <span className="text-3xl font-black text-purple-400">{playerLevel}</span>
                                        </div>
                                        <span className="text-base md:text-lg font-black text-slate-300 uppercase tracking-widest">{tLevel}</span>
                                    </div>
                                    <div className="text-sm md:text-base font-bold text-purple-400 uppercase tracking-wider mb-1 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20">
                                        {xp} XP
                                    </div>
                                </div>
                                <div className="w-full h-4 md:h-5 bg-slate-950/80 rounded-full overflow-hidden border border-slate-800/80 shadow-inner relative">
                                    <div 
                                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-1000 ease-out relative"
                                        style={{ width: `${xpProgress}%` }}
                                    >
                                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:10px_10px]" />
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs md:text-sm text-slate-400 font-bold tracking-widest uppercase mt-3">
                                    <span>{currentLevelXp} XP PROGRESS</span>
                                    <span>{nextLevelXp} XP TO GO</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 xl:gap-10">
                    
                    {/* Top Stats Cards */}
                    <div className="md:col-span-1 flex flex-col gap-6 w-full">
                        <div className="bg-slate-900/60 border border-slate-700/50 p-6 md:p-8 rounded-3xl flex flex-col gap-2 items-start relative overflow-hidden group hover:border-slate-500 transition-colors shadow-xl backdrop-blur-sm">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl group-hover:bg-yellow-500/20 transition-all duration-700" />
                            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 transform group-hover:scale-110 transition-transform shadow-lg z-10">
                                <Flame className="w-8 h-8 text-yellow-500" />
                            </div>
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-4 z-10 flexitems-center gap-2">
                                {t.marathonRecord}
                            </span>
                            <span className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-md z-10">
                                {statsLoading ? '-' : marathonScore}
                            </span>
                        </div>
                        
                        <div className="bg-slate-900/60 border border-slate-700/50 p-6 md:p-8 rounded-3xl flex flex-col gap-2 items-start relative overflow-hidden group hover:border-slate-500 transition-colors shadow-xl backdrop-blur-sm">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
                            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 transform group-hover:scale-110 transition-transform shadow-lg z-10">
                                <Trophy className="w-8 h-8 text-indigo-400" />
                            </div>
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-4 z-10">
                                {t.highestLevel}
                            </span>
                            <span className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-md z-10">
                                {statsLoading ? '-' : maxLevel}
                            </span>
                        </div>

                        <div className="bg-slate-900/60 border border-slate-700/50 p-6 md:p-8 rounded-3xl flex flex-col gap-2 items-start relative overflow-hidden group hover:border-slate-500 transition-colors shadow-xl backdrop-blur-sm">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all duration-700" />
                            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 transform group-hover:scale-110 transition-transform shadow-lg z-10">
                                <Activity className="w-8 h-8 text-green-400" />
                            </div>
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-4 z-10">
                                {language === 'de' ? 'Abgeschlossene Aufgaben' : 'Completed Quests'}
                            </span>
                            <span className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-md z-10">
                                {statsLoading ? '-' : completedQuests}
                            </span>
                        </div>
                    </div>
                    
                    {/* Right column - Best Times */}
                    <div className="md:col-span-2 flex flex-col gap-8 w-full">
                         {/* Best Times Section */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <Clock className="w-5 h-5 text-emerald-400" />
                                </div>
                                <h4 className="text-xl font-black text-slate-200 uppercase tracking-widest">{t.bestTimes}</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative w-full">
                                {statsLoading ? (
                                    <div className="col-span-full h-32 flex items-center justify-center text-xs text-slate-600 uppercase font-bold">{t.loading}</div>
                                ) : levelStats.length > 0 ? (
                                    levelStats.map((lv) => (
                                        <div key={lv.id} className="flex justify-between items-center p-4 rounded-2xl bg-slate-900/40 hover:bg-slate-800 border border-slate-800/80 hover:border-emerald-500/30 transition-all shadow-lg group">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-base font-black text-slate-200 group-hover:text-emerald-400 transition-colors uppercase tracking-widest">LEVEL {lv.level}</span>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{lv.language === 'en' ? 'English' : 'Deutsch'}</span>
                                            </div>
                                            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 shadow-inner group-hover:border-emerald-500/20">
                                                <span className="text-sm font-black text-emerald-400 tracking-wider font-mono">{formatTime(lv.time_ms)}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full h-32 flex items-center justify-center text-xs text-slate-600 uppercase font-bold italic border border-slate-800 rounded-3xl border-dashed">
                                        {t.noTimeRecords}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </motion.div>
    );
}
