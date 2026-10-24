import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { fetchUserScore, fetchAllUserLevelTimes, checkUserUnlockedEffects, applyActiveEffectToRecords, deleteAccountData, getSupabase } from '../lib/supabase';
import { User, ChevronLeft, LogOut, Trophy, Clock, Medal, Activity, Sparkles, Trash2, AlertTriangle, Crown, Zap, Flame, Settings } from 'lucide-react';
import { EFFECTS_MAP } from '../lib/effects';
import { Language, TRANSLATIONS } from '../lib/i18n';

interface AccountProps {
    user: { username: string; uuid: string };
    language: Language;
    onClose: () => void;
    onLogout: () => void;
}

export function Account({ user, language, onClose, onLogout }: AccountProps) {
    const t = TRANSLATIONS[language];
    const [statsLoading, setStatsLoading] = useState(true);
    const [userStats, setUserStats] = useState<any[]>([]);
    const [levelStats, setLevelStats] = useState<any[]>([]);
    const [xp, setXp] = useState(0);
    const [completedQuests, setCompletedQuests] = useState(0);
    const [unlockedEffects, setUnlockedEffects] = useState<number[]>([]);
    const [activeEffect, setActiveEffect] = useState<string | null>(localStorage.getItem('typerr_active_effect'));
    const [savingEffect, setSavingEffect] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await deleteAccountData();
            const supabase = getSupabase();
            await supabase.auth.signOut();
            onLogout();
        } catch (e: any) {
            console.error("Account deletion failed:", e);
            alert(e.message || "Account deletion is not configured safely.");
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    useEffect(() => {
        const loadStats = async () => {
            if (!user) return;
            try {
                const [scoreData, timesData, effectsData] = await Promise.all([
                    fetchUserScore(user.uuid),
                    fetchAllUserLevelTimes(user.uuid),
                    checkUserUnlockedEffects(user.uuid)
                ]);
                setUserStats(scoreData);
                setLevelStats(timesData.filter(lv => lv.level > 0).sort((a, b) => a.level - b.level));
                setUnlockedEffects(effectsData);
                
                const supabase = getSupabase();
                const { data: xpData, error: xpError } = await supabase.from('users').select('xp, username').eq('id', user.uuid).maybeSingle();
                setXp(xpData?.xp || 0);

                const { count: questsCount } = await supabase.from('user_quests')
                     .select('*', { count: 'exact', head: true })
                     .eq('player_uuid', user.uuid)
                     .eq('completed', true);
                setCompletedQuests(questsCount || 0);
            } catch (err) {
                console.error("Error loading user stats:", err);
            } finally {
                setStatsLoading(false);
            }
        };

        if (user?.uuid) {
            loadStats();
        }
    }, [user?.uuid]);

    const handleSelectEffect = async (effectId: string | null) => {
        if (!user) return;
        setSavingEffect(true);
        try {
            if (effectId) {
                localStorage.setItem('typerr_active_effect', effectId);
            } else {
                localStorage.removeItem('typerr_active_effect');
            }
            setActiveEffect(effectId);
            await applyActiveEffectToRecords(user.uuid, user.username, effectId ? parseInt(effectId) : null);
        } catch (e) {
            console.error("Failed to apply effect.");
        } finally {
            setSavingEffect(false);
        }
    };

    const formatTime = (ms: number) => {
        return (ms / 1000).toFixed(2) + 's';
    };

    if (!user) return null;

    const marathonRecord = userStats.reduce((max, stat) => Math.max(max, stat.score || 0), 0);
    const maxLevelRecord = userStats.reduce((max, stat) => Math.max(max, stat.level || 1), 1);

    const playerLevel = Math.floor(Math.sqrt(xp / 100)) + 1;
    const currentLevelXp = xp - (Math.pow(playerLevel - 1, 2) * 100);
    const nextLevelXp = (Math.pow(playerLevel, 2) * 100) - (Math.pow(playerLevel - 1, 2) * 100);
    const xpProgress = Math.min(100, Math.max(0, (currentLevelXp / nextLevelXp) * 100));
    
    const tLevel = t.playerLevel || "Player Level";

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-3xl flex flex-col overflow-y-auto overflow-x-hidden min-h-screen text-slate-200 m-0 p-0"
        >
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.1),transparent_50%)]" />
            
            <div className="sticky top-0 z-20 flex justify-between items-center p-6 md:p-8 border-b border-white/5 bg-slate-950/80 backdrop-blur-md relative">
                <button 
                    onClick={onClose}
                    className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 p-3 bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-all text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 shadow-sm z-20"
                >
                    <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                
                <div className="flex items-center justify-center flex-1 w-full pointer-events-none">
                    <img 
                        src="/account.png" 
                        alt="Account"
                        className="h-12 md:h-16 object-contain drop-shadow-[0_0_15px_rgba(0,150,255,0.8)] pointer-events-auto"
                    />
                </div>

                <div className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2 flex gap-2 z-20">
                    <button 
                         onClick={onLogout}
                         className="flex items-center justify-center gap-2 text-slate-400 bg-slate-800/40 border border-slate-700/50 hover:bg-slate-700 hover:text-white transition-all px-4 md:px-5 py-2.5 md:py-3 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-sm"
                     >
                         <LogOut className="w-4 h-4" />
                         <span className="hidden md:inline">{t.signOutAccount}</span>
                     </button>
                </div>
            </div>

            <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-10 flex flex-col gap-8 z-10 relative">
                
                {/* Hero / Identity Section */}
                <div className="glass-panel p-8 md:p-14 rounded-[2rem] md:rounded-[3rem] flex flex-col md:flex-row gap-8 items-center md:items-start justify-between bg-slate-900/60 border border-slate-700/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_50%)] pointer-events-none group-hover:opacity-100 transition-opacity duration-700 opacity-70" />
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-slate-900/0 to-transparent pointer-events-none group-hover:from-indigo-500/20 transition-all duration-700" />
                    
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-10 z-10 w-full">
                        <div className="w-28 h-28 md:w-40 md:h-40 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-blue-400 p-[3px] shadow-[0_20px_50px_rgba(99,102,241,0.3)] relative shrink-0">
                            <div className="absolute -inset-2 bg-indigo-500/30 blur-2xl rounded-full -z-10" />
                            <div className="w-full h-full bg-slate-950 rounded-[calc(2rem-3px)] flex items-center justify-center">
                                <User className="w-14 h-14 md:w-20 md:h-20 text-indigo-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]" />
                            </div>
                        </div>
                        <div className="flex flex-col items-center md:items-start text-center md:text-left pt-2 flex-1 w-full relative">
                            <h3 className="text-4xl md:text-7xl font-black tracking-tighter text-white uppercase leading-none drop-shadow-2xl mb-3">
                                {user.username}
                            </h3>
                            <div className="flex items-center justify-center md:justify-start gap-2 bg-slate-800/80 border border-slate-700/50 px-4 py-2 rounded-xl shadow-inner">
                                <Crown className="w-5 h-5 text-yellow-400" />
                                <p className="text-sm md:text-base text-slate-300 uppercase tracking-widest font-bold">
                                    {t.playerProfile}
                                </p>
                            </div>

                            {/* Level / XP Bar Section */}
                            <div className="mt-10 w-full max-w-2xl bg-slate-900/50 p-6 md:p-8 rounded-3xl border border-slate-700/50 shadow-inner">
                                <div className="flex justify-between items-end mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                                            <span className="text-3xl font-black text-indigo-400">{playerLevel}</span>
                                        </div>
                                        <span className="text-base md:text-lg font-black text-slate-300 uppercase tracking-widest">{tLevel}</span>
                                    </div>
                                    <div className="text-sm md:text-base font-bold text-indigo-400 uppercase tracking-wider mb-1 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                                        {xp} XP
                                    </div>
                                </div>
                                <div className="w-full h-4 md:h-5 bg-slate-950/80 rounded-full overflow-hidden border border-slate-800/80 shadow-inner relative">
                                    <div 
                                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-1000 ease-out relative"
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
                                {statsLoading ? '-' : marathonRecord}
                            </span>
                        </div>
                        
                        <div className="bg-slate-900/60 border border-slate-700/50 p-6 md:p-8 rounded-3xl flex flex-col gap-2 items-start relative overflow-hidden group hover:border-slate-500 transition-colors shadow-xl backdrop-blur-sm">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
                            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 transform group-hover:scale-110 transition-transform shadow-lg z-10">
                                <Trophy className="w-8 h-8 text-indigo-400" />
                            </div>
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-4 z-10">
                                {t.maxLevel}
                            </span>
                            <span className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-md z-10">
                                {statsLoading ? '-' : maxLevelRecord}
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

                         <div className="pt-6 border-t border-slate-800/50 mt-auto">
                            {!showDeleteConfirm ? (
                                <button 
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center justify-center gap-3 text-slate-500 bg-transparent hover:bg-red-950/30 border border-slate-800 hover:border-red-900/50 hover:text-red-400 transition-all px-5 py-4 rounded-2xl text-xs font-bold uppercase tracking-wider w-full group"
                                >
                                    <Trash2 className="w-4 h-4 opacity-70 group-hover:scale-110 transition-transform" />
                                    {t.deleteAccount}
                                </button>
                            ) : (
                                <div className="flex flex-col gap-3">
                                   <div className="flex animate-[fadeIn_0.2s_ease-out] items-center gap-2 w-full h-full">
                                      <button 
                                          onClick={handleDeleteAccount}
                                          disabled={isDeleting}
                                          className="flex-1 flex items-center justify-center gap-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-500/30 hover:border-red-500/50 transition-all px-5 py-4 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-sm"
                                      >
                                          {isDeleting ? t.deleting : (
                                              <>
                                                  <AlertTriangle className="w-4 h-4" />
                                                  {t.reallyDelete}
                                              </>
                                          )}
                                      </button>
                                      <button 
                                          onClick={() => setShowDeleteConfirm(false)}
                                          disabled={isDeleting}
                                          className="bg-slate-900 h-full text-slate-400 hover:text-white hover:bg-slate-800 px-5 rounded-2xl transition-colors border border-slate-700"
                                      >
                                          <ChevronLeft className="w-5 h-5" />
                                      </button>
                                   </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Right column - Best Times and Cosmetics */}
                    <div className="md:col-span-2 flex flex-col gap-8 w-full">
                         {/* Best Times Section */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <Activity className="w-5 h-5 text-emerald-400" />
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

                        {/* Cosmetics Section */}
                        <div className="flex flex-col gap-4 mt-2">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-pink-500/10 rounded-lg">
                                        <Sparkles className="w-5 h-5 text-pink-400" />
                                    </div>
                                    <h4 className="text-xl font-black text-slate-200 uppercase tracking-widest">{t.cosmeticsEffects}</h4>
                                </div>
                                {unlockedEffects.length === 0 && (
                                    <span className="text-xs font-bold text-slate-500 uppercase bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 shadow-inner">{t.locked}</span>
                                )}
                            </div>
                            
                            <div className="relative">
                                {statsLoading ? (
                                    <div className="h-32 flex items-center justify-center text-xs text-slate-600 uppercase font-bold">{t.loadingEffects}</div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <button
                                                onClick={() => handleSelectEffect(null)}
                                                disabled={savingEffect}
                                                className={`p-5 rounded-2xl border flex flex-col gap-3 justify-between transition-all group text-left ${
                                                    activeEffect === null 
                                                    ? 'bg-slate-800/80 border-slate-500 shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                                                    : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800 hover:border-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                   <span className="text-white font-black uppercase tracking-widest">{t.standard}</span>
                                                   {activeEffect === null && <div className="w-3 h-3 rounded-full bg-slate-400 shrink-0"></div>}
                                                </div>
                                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{t.noEffect}</span>
                                            </button>
                                            
                                            {unlockedEffects.map(effectId => {
                                                const effectConf = EFFECTS_MAP[effectId.toString()];
                                                if (!effectConf) return null;
                                                const isActive = activeEffect === effectId.toString();
                                                return (
                                                    <button
                                                        key={effectId}
                                                        onClick={() => handleSelectEffect(effectId.toString())}
                                                        disabled={savingEffect}
                                                        className={`p-5 rounded-2xl border flex flex-col gap-3 justify-between relative transition-all group overflow-hidden ${
                                                            isActive 
                                                            ? 'bg-slate-900 border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.15)]' 
                                                            : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800 hover:border-slate-700'
                                                        }`}
                                                    >
                                                        {isActive && <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-indigo-500/5 pointer-events-none" />}
                                                        
                                                        <div className="flex items-center justify-between w-full z-10 relative">
                                                            <span className={`text-base font-black tracking-widest uppercase bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 ${effectConf.className}`}>
                                                                {user.username}
                                                            </span>
                                                            {isActive && <div className="w-3 h-3 rounded-full bg-pink-500 shrink-0 shadow-[0_0_10px_rgba(236,72,153,0.8)]"></div>}
                                                        </div>

                                                        <span className="text-[10px] text-slate-400 group-hover:text-slate-300 uppercase font-bold tracking-widest text-left z-10">
                                                            {effectConf.name}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        
                                        {unlockedEffects.length === 0 && (
                                            <div className="w-full flex-col h-40 flex items-center justify-center gap-3 border border-slate-800 border-dashed rounded-3xl mt-4">
                                                <div className="p-3 bg-slate-900 rounded-2xl">
                                                    <Zap className="w-6 h-6 text-slate-600" />
                                                </div>
                                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest text-center px-4 max-w-[200px] leading-relaxed">
                                                    {t.noEffectsUnlocked}
                                                </p>
                                            </div>
                                        )}
                                        
                                        {savingEffect && (
                                            <div className="absolute -top-12 right-0 flex justify-center pointer-events-none z-20">
                                                <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl text-xs text-pink-400 font-bold uppercase tracking-widest shadow-xl border border-pink-500/20 flex items-center gap-2">
                                                    <Sparkles className="w-3 h-3 animate-pulse" />
                                                    {t.applying}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </motion.div>
    );
}

