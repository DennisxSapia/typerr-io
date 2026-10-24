import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

let supabaseInstance: any = null;

export const isMobileDevice = () => /Mobi|Android/i.test(navigator.userAgent);

export const getSupabase = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials are missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.');
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
};

export const fetchTopScores = async (isMobileView: boolean = false, language: string = 'de') => {
    try {
        const supabase = getSupabase();
        let queryRes = await supabase
            .from('leaderboard')
            .select('*')
            .eq('is_mobile', isMobileView)
            .eq('language', language)
            .order('score', { ascending: false })
            .limit(100);
            
        if (queryRes.error && queryRes.error.code === '42703') {
            queryRes = await supabase
                .from('leaderboard')
                .select('*')
                .eq('is_mobile', isMobileView)
                .order('score', { ascending: false })
                .limit(100);
        }

        if (queryRes.error) throw queryRes.error;
        let finalData = queryRes.data || [];
        
        // Fetch marathon times for these players
        if (finalData.length > 0) {
            const playerUuids = finalData.map((d: any) => d.player_uuid);
            const mappedLevel = getEventLevelId(0, language);
            const { data: timesData, error: timesError } = await supabase
                .from('level_times')
                .select('player_uuid, time_ms')
                .eq('level', mappedLevel)
                .eq('is_mobile', isMobileView)
                .in('player_uuid', playerUuids);
                
            if (!timesError && timesData) {
                const timeMap = new Map();
                timesData.forEach((t: any) => timeMap.set(t.player_uuid, t.time_ms));
                
                finalData.forEach((d: any) => {
                    if (timeMap.has(d.player_uuid)) {
                        d.marathon_time_ms = timeMap.get(d.player_uuid);
                    }
                });
                
                // Re-sort: Score DESC, then Marathon Time ASC
                finalData.sort((a: any, b: any) => {
                    if (a.score !== b.score) return b.score - a.score;
                    
                    const timeA = a.marathon_time_ms || Infinity;
                    const timeB = b.marathon_time_ms || Infinity;
                    
                    if (timeA === timeB) return 0;
                    return timeA < timeB ? -1 : 1;
                });
            }

            // Fetch XP from users table
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('id, xp')
                .in('id', playerUuids);

            if (!usersError && usersData) {
                const xpMap = new Map();
                usersData.forEach((u: any) => xpMap.set(u.id, u.xp));
                finalData.forEach((d: any) => {
                    d.xp = xpMap.get(d.player_uuid) || 0;
                });
            }
        }
        
        return finalData.slice(0, 50);
    } catch (e) {
        console.error("Failed to fetch top scores:", e);
        throw e;
    }
};

export const submitScore = async (nickname: string, score: number, player_uuid: string, level: number = 1, replay_data: number[] | null = null, language: string = 'de') => {
    if (player_uuid?.startsWith('guest_')) return { isNewBest: false };
    try {
        const activeEffect = localStorage.getItem('typerr_active_effect');
        const supabase = getSupabase();
        const is_mobile = isMobileDevice();
        // Upsert or just insert? The requirement says "overwrite their own highscore"
        // Let's first check if a score exists for the UUID.
        let { data: existingData, error: checkError } = await supabase
            .from('leaderboard')
            .select('*')
            .eq('player_uuid', player_uuid)
            .eq('is_mobile', is_mobile)
            .eq('language', language)
            .limit(1)
            .maybeSingle();

        if (checkError && checkError.code === '42703') {
            const fb = await supabase.from('leaderboard').select('*').eq('player_uuid', player_uuid).eq('is_mobile', is_mobile).limit(1).maybeSingle();
            existingData = fb.data;
        }

        if (existingData) {
            if (score > existingData.score) {
                let { error } = await supabase
                    .from('leaderboard')
                    .update({ nickname, active_effect: activeEffect, score, level, created_at: new Date().toISOString(), ...(replay_data && { replay_data }), is_mobile, language })
                    .eq('player_uuid', player_uuid)
                    .eq('is_mobile', is_mobile)
                    .eq('language', language);
                
                if (error && error.code === '42703') { // Column doesn't exist
                    const fallback = await supabase
                        .from('leaderboard')
                        .update({ nickname, score, level, created_at: new Date().toISOString() })
                        .eq('player_uuid', player_uuid);
                    if (fallback.error) throw fallback.error;
                } else if (error) {
                    throw error;
                }
                return { isNewBest: true, previousBest: existingData.score };
            } else {
                // If they don't beat score but want to update name/effect
                let { error } = await supabase
                    .from('leaderboard')
                    .update({ nickname, active_effect: activeEffect, language })
                    .eq('player_uuid', player_uuid)
                    .eq('is_mobile', is_mobile)
                    .eq('language', language);
                
                if (error && error.code === '42703') { 
                    await supabase.from('leaderboard').update({ nickname }).eq('player_uuid', player_uuid);
                }
                return { isNewBest: false, previousBest: existingData.score };
            }
        } else {
            let { error } = await supabase
                .from('leaderboard')
                .insert([{ nickname, active_effect: activeEffect, score, level, player_uuid, ...(replay_data && { replay_data }), is_mobile, language }]);
                
            if (error && error.code === '42703') {
                const fallback = await supabase
                    .from('leaderboard')
                    .insert([{ nickname, score, level, player_uuid, ...(replay_data && { replay_data }) }]);
                if (fallback.error) throw fallback.error;
            } else if (error) {
                throw error;
            }
            return { isNewBest: true };
        }
    } catch (e) {
        console.error("Failed to submit score:", e);
        throw e;
    }
};

export const removeScore = async (player_uuid: string) => {
    try {
        const supabase = getSupabase();
        const { error } = await supabase
            .from('leaderboard')
            .delete()
            .eq('player_uuid', player_uuid);
        if (error) throw error;
    } catch (e) {
        console.error("Failed to remove score:", e);
        throw e;
    }
};

export const getEventCycleIndex = (): number => {
    const defaultTarget = new Date("2026-05-27T18:00:00Z").getTime();
    const now = Date.now();
    if (now < defaultTarget) {
        return 0;
    }
    const diff = now - defaultTarget;
    // Each cycle is exactly 7 days
    return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
};

export const getEventLevelId = (level: number, language: string = 'de'): number => {
    let baseLevel = level;
    if (level === 7) {
        baseLevel = 7000 + getEventCycleIndex();
    }
    if (language === 'en') {
        baseLevel += 10000;
    }
    return baseLevel;
};

export const fetchLevelTimes = async (level: number, isMobileView: boolean = false, language: string = 'de') => {
    try {
        const mappedLevel = getEventLevelId(level, language);
        const supabase = getSupabase();
        let queryRes = await supabase
            .from('level_times')
            .select('*')
            .eq('level', mappedLevel)
            .eq('is_mobile', isMobileView)
            .order('time_ms', { ascending: true })
            .limit(50);
            
        if (queryRes.error && queryRes.error.code === '42703') {
            queryRes = await supabase
                .from('level_times')
                .select('*')
                .eq('level', mappedLevel)
                .eq('is_mobile', isMobileView)
                .order('time_ms', { ascending: true })
                .limit(50);
        }

        if (queryRes.error) throw queryRes.error;
        const data = queryRes.data;
        
        // Normalize any virtual level >= 7000 back to 7 for displaying L7 correctly
        const normalizedData = (data || []).map(row => {
            let dl = row.level;
            if (dl >= 10000) dl -= 10000;
            if (dl >= 7000) {
                return { ...row, level: 7 };
            }
            return { ...row, level: dl };
        });

        // Sort locally to handle time_us tie-breakers since not all users might have it 
        normalizedData.sort((a, b) => {
            if (a.time_ms === b.time_ms) {
                return (a.time_us || 0) - (b.time_us || 0);
            }
            return (a.time_ms || 0) - (b.time_ms || 0);
        });

        if (normalizedData.length > 0) {
            const playerUuids = normalizedData.map((d: any) => d.player_uuid);
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('id, xp')
                .in('id', playerUuids);

            if (!usersError && usersData) {
                const xpMap = new Map();
                usersData.forEach((u: any) => xpMap.set(u.id, u.xp));
                normalizedData.forEach((d: any) => {
                    d.xp = xpMap.get(d.player_uuid) || 0;
                });
            }
        }

        return normalizedData;
    } catch (e) {
        console.error("Failed to fetch level times:", e);
        throw e;
    }
};

export const submitLevelTime = async (nickname: string, time_ms: number, player_uuid: string, level: number, replay_data: number[] | null = null, language: string = 'de', time_us?: number) => {
    if (player_uuid?.startsWith('guest_')) return { isNewBest: false };
    if (!time_ms || time_ms <= 0) return { isNewBest: false }; // Safeguard against 0 or negative times
    try {
        const activeEffect = localStorage.getItem('typerr_active_effect');
        const mappedLevel = getEventLevelId(level, language);
        const supabase = getSupabase();
        const is_mobile = isMobileDevice();
        let { data: existingData, error: checkError } = await supabase
            .from('level_times')
            .select('*')
            .eq('player_uuid', player_uuid)
            .eq('level', mappedLevel)
            .eq('is_mobile', is_mobile)
            .eq('language', language)
            .limit(1)
            .maybeSingle();

        if (checkError && checkError.code === '42703') {
            const fb = await supabase.from('level_times').select('*').eq('player_uuid', player_uuid).eq('level', mappedLevel).eq('is_mobile', is_mobile).limit(1).maybeSingle();
            existingData = fb.data;
        }

        if (existingData) {
            // Overwrite if new time is better, OR if existing time is 0 (bugged)
            const isBetterUs = time_us !== undefined && existingData.time_us !== undefined && existingData.time_us !== null ? (time_us < existingData.time_us) : false;
            if (time_ms < existingData.time_ms || existingData.time_ms <= 0 || (time_ms === existingData.time_ms && isBetterUs)) {
                let pd: any = { nickname, active_effect: activeEffect, time_ms, created_at: new Date().toISOString(), ...(replay_data && { replay_data }), is_mobile, language };
                if (time_us !== undefined) pd.time_us = time_us;
                let { error } = await supabase
                    .from('level_times')
                    .update(pd)
                    .eq('player_uuid', player_uuid)
                    .eq('level', mappedLevel)
                    .eq('is_mobile', is_mobile)
                    .eq('language', language);
                
                if (error && error.code === '42703') {
                    delete pd.time_us;
                    delete pd.language;
                    delete pd.is_mobile;
                    delete pd.active_effect;
                    const fallback = await supabase
                        .from('level_times')
                        .update({ nickname, time_ms, created_at: new Date().toISOString() })
                        .eq('player_uuid', player_uuid)
                        .eq('level', mappedLevel);
                    if (fallback.error) throw fallback.error;
                } else if (error) {
                    throw error;
                }
                return { isNewBest: true, previousBest: existingData.time_ms };
            } else {
                // Not better time, but apply nickname/effect updates if needed
                let { error } = await supabase
                    .from('level_times')
                    .update({ nickname, active_effect: activeEffect, language })
                    .eq('player_uuid', player_uuid)
                    .eq('level', mappedLevel)
                    .eq('is_mobile', is_mobile)
                    .eq('language', language);
                
                if (error && error.code === '42703') {
                    await supabase.from('level_times').update({ nickname }).eq('player_uuid', player_uuid).eq('level', mappedLevel);
                }
                return { isNewBest: false, previousBest: existingData.time_ms };
            }
        } else {
            let pd: any = { nickname, active_effect: activeEffect, time_ms, level: mappedLevel, player_uuid, ...(replay_data && { replay_data }), is_mobile, language };
            if (time_us !== undefined) pd.time_us = time_us;
            let { error } = await supabase
                .from('level_times')
                .insert([pd]);
                
            if (error && error.code === '42703') {
                const fallback = await supabase
                    .from('level_times')
                    .insert([{ nickname, time_ms, level: mappedLevel, player_uuid, ...(replay_data && { replay_data }) }]);
                if (fallback.error) throw fallback.error;
            } else if (error) {
                throw error;

            }
            return { isNewBest: true };
        }
    } catch (e) {
        console.error("Failed to submit level time:", e);
        throw e;
    }
};

export const fetchUserScore = async (player_uuid: string) => {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('leaderboard')
            .select('*')
            .eq('player_uuid', player_uuid)
            .order('score', { ascending: false });
            
        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error("Failed to fetch user score:", e);
        throw e;
    }
};

export const fetchAllUserLevelTimes = async (player_uuid: string) => {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('level_times')
            .select('*')
            .eq('player_uuid', player_uuid)
            .order('level', { ascending: true });
            
        if (error) throw error;
        
        const currentEventLevelId_de = getEventLevelId(7, 'de');
        const currentEventLevelId_en = getEventLevelId(7, 'en');
        
        // Filter out old event times from previous cycles, keep only the current cycle's L7 event (mapped to 7)
        const normalizedData = (data || [])
            .filter(lv => !lv.level || (lv.level < 7000) || lv.level === currentEventLevelId_de || (lv.level >= 10000 && lv.level < 17000) || lv.level === currentEventLevelId_en)
            .map(lv => {
                let displayLevel = lv.level;
                if (displayLevel >= 10000) displayLevel -= 10000;
                if (displayLevel === 7000 + getEventCycleIndex()) {
                    return { ...lv, level: 7 };
                }
                return { ...lv, level: displayLevel };
            });
            
        return normalizedData;
    } catch (e) {
        console.error("Failed to fetch all user level times:", e);
        throw e;
    }
};

export const fetchGhostByNicknameAndLevel = async (nickname: string, level: number, language: string = 'de') => {
    try {
        const mappedLevel = getEventLevelId(level, language);
        const supabase = getSupabase();
        
        let queryRes = await supabase
            .from('level_times')
            .select('*')
            .eq('nickname', nickname)
            .eq('level', mappedLevel)
            .not('replay_data', 'is', null)
            .order('time_ms', { ascending: true })
            .limit(1)
            .maybeSingle();

        // Also fallback to other languages just in case, but prioritize same language
        if (!queryRes.data) {
            const fallbackLanguage = language === 'de' ? 'en' : 'de';
            const fallbackMappedLevel = getEventLevelId(level, fallbackLanguage);
            queryRes = await supabase
                .from('level_times')
                .select('*')
                .eq('nickname', nickname)
                .eq('level', fallbackMappedLevel)
                .not('replay_data', 'is', null)
                .order('time_ms', { ascending: true })
                .limit(1)
                .maybeSingle();
        }

        if (queryRes.error && queryRes.error.code !== 'PGRST116') throw queryRes.error;
        return queryRes.data || null;
    } catch (e) {
        console.error("Failed to fetch ghost run:", e);
        return null;
    }
};

export const checkUserUnlockedEffects = async (player_uuid: string) => {
    try {
        const supabase = getSupabase();
        const currentEventLevelId = getEventLevelId(7, 'de');
        const currentEventLevelIdEn = getEventLevelId(7, 'en');
        
        const { data: userTimes, error } = await supabase
            .from('level_times')
            .select('level, time_ms')
            .eq('player_uuid', player_uuid);
            
        if (error || !userTimes || userTimes.length === 0) return [];
        
        // Filter those that are past events (>=7000 but not current 7000x event)
        const pastEvents = userTimes.filter(lv => {
            const isDePast = lv.level >= 7000 && lv.level < 8000 && lv.level < currentEventLevelId;
            const isEnPast = lv.level >= 17000 && lv.level < 18000 && lv.level < currentEventLevelIdEn;
            return isDePast || isEnPast;
        });

        const unlockedIds: number[] = [];
        
        for (const ut of pastEvents) {
            const { data: topTime } = await supabase
                .from('level_times')
                .select('player_uuid')
                .eq('level', ut.level)
                .order('time_ms', { ascending: true })
                .limit(1)
                .maybeSingle();
                
            if (topTime && topTime.player_uuid === player_uuid) {
                 unlockedIds.push(ut.level);
            }
        }
        return unlockedIds;
    } catch (e) {
        console.error("Failed to check unlocked effects:", e);
        return [];
    }
};

export const applyActiveEffectToRecords = async (player_uuid: string, actualUsername: string, effectLevelId: number | null) => {
    try {
        const supabase = getSupabase();
        
        const updateLeaderboard = supabase.from('leaderboard').update({ nickname: actualUsername, active_effect: effectLevelId ? effectLevelId.toString() : null }).eq('player_uuid', player_uuid);
        const updateLevelTimes = supabase.from('level_times').update({ nickname: actualUsername, active_effect: effectLevelId ? effectLevelId.toString() : null }).eq('player_uuid', player_uuid);
        
        let [res1, res2] = await Promise.allSettled([updateLeaderboard, updateLevelTimes]);
        
        // Check for missing column error and fallback
        if ((res1.status === 'rejected' && res1.reason?.code === '42703') || 
            (res2.status === 'rejected' && res2.reason?.code === '42703') ||
            (res1.status === 'fulfilled' && res1.value?.error?.code === '42703')) {
            const fb1 = supabase.from('leaderboard').update({ nickname: actualUsername }).eq('player_uuid', player_uuid);
            const fb2 = supabase.from('level_times').update({ nickname: actualUsername }).eq('player_uuid', player_uuid);
            [res1, res2] = await Promise.allSettled([fb1, fb2]);
        }

        if (res1.status === 'rejected') throw res1.reason;
        if (res1.status === 'fulfilled' && res1.value.error) throw res1.value.error;
        if (res2.status === 'rejected') throw res2.reason;
        if (res2.status === 'fulfilled' && res2.value.error) throw res2.value.error;

        return true;
    } catch (e) {
        console.error("Failed to apply active effect to records:", e);
        throw e;
    }
};

export const updateNicknameAcrossTables = async (player_uuid: string, nickname: string) => {
    try {
        const supabase = getSupabase();
        
        const updateLeaderboard = supabase
            .from('leaderboard')
            .update({ nickname })
            .eq('player_uuid', player_uuid);
            
        const updateLevelTimes = supabase
            .from('level_times')
            .update({ nickname })
            .eq('player_uuid', player_uuid);

        // Also update a central users table if it exists
        const updateUsersTable = supabase
            .from('users')
            .upsert({ id: player_uuid, username: nickname });
            
        const [res1, res2, res3] = await Promise.allSettled([updateLeaderboard, updateLevelTimes, updateUsersTable]);
        
        // We consider it a success if at least the core updates tried. 
        // We throw if res1 or res2 failed significantly (but updateUsersTable might fail if table not exist)
        if (res1.status === 'rejected') throw res1.reason;
        if (res2.status === 'rejected') throw res2.reason;
        
        return true;
    } catch (e) {
        console.error("Failed to update nickname in tables:", e);
        throw e;
    }
};

export const syncUserNickname = async (player_uuid: string, nickname: string) => {
    try {
        const supabase = getSupabase();
        // Upsert into users table to track current username for uniqueness checks
        await supabase
            .from('users')
            .upsert({ id: player_uuid, username: nickname });
    } catch (e) {
        console.warn("Failed to sync nickname to users table (might not exist):", e);
    }
};

export const deleteAccountData = async () => {
    try {
        const supabase = getSupabase();
        
        // Call the secure RPC function to delete the authenticated user
        // We only attempt to call it. The RPC will fail safely if constraints exist.
        const { error } = await supabase.rpc('delete_current_user');
        
        if (error) {
            console.error("RPC Error:", error);
            throw new Error("Account deletion is not configured safely.");
        }
        
        return true;
    } catch (e: any) {
        console.error("Failed to delete account data:", e);
        if (e.message !== "Account deletion is not configured safely.") {
            throw new Error("Account deletion is not configured safely.");
        }
        throw e;
    }
};

export const checkUsernameExists = async (username: string, excludeUuid?: string) => {
    try {
        const supabase = getSupabase();
        
        // Match exact or with effect suffix
        const searchPattern = `${username.trim()}###%`;
        
        let queryUsers = supabase
            .from('users')
            .select('id, username')
            .or(`username.ilike.${username.trim()},username.ilike.${searchPattern}`);
            
        if (excludeUuid) {
            queryUsers = queryUsers.neq('id', excludeUuid);
        }
        
        const { data: usersData, error } = await queryUsers;
        
        if (usersData && usersData.length > 0) {
            // Need to exact match the base name, in case someone searched "Den" and matched "Dennis" (though we used exact search pattern so wouldn't happen, but good practice)
            const exactSearch = username.trim().toLowerCase();
            const exists = usersData.some(row => {
                const parts = row.username.split('###');
                return parts[0].toLowerCase() === exactSearch;
            });
            if (exists) return true;
        }
            
        if (error && error.code !== 'PGRST116') { 
            let queryLB = supabase
                .from('leaderboard')
                .select('player_uuid, nickname')
                .or(`nickname.ilike.${username.trim()},nickname.ilike.${searchPattern}`);
                
            if (excludeUuid) {
                queryLB = queryLB.neq('player_uuid', excludeUuid);
            }
                
            const { data: lbData } = await queryLB;
            
            // Allow exact match or match with effect suffix
            const exactSearch = username.trim().toLowerCase();
            const existsInLB = (lbData || []).some(row => {
                const parts = row.nickname.split('###');
                return parts[0].toLowerCase() === exactSearch;
            });
            
            return existsInLB;
        }
        
        return false;
    } catch (e) {
        console.error("Failed to check username existence:", e);
        return false;
    }
};

export const fetchUserPublicStats = async (player_uuid: string) => {
    try {
        const supabase = getSupabase();
        
        let xp = 0;
        const { data: userData } = await supabase
            .from('users')
            .select('xp')
            .eq('id', player_uuid)
            .maybeSingle();

        if (userData && 'xp' in userData) {
            xp = userData.xp || 0;
        }

        const { data: scoreData } = await supabase
            .from('leaderboard')
            .select('score, level')
            .eq('player_uuid', player_uuid)
            .order('score', { ascending: false })
            .limit(1)
            .maybeSingle();

        const { count: completedQuests } = await supabase
            .from('user_quests')
            .select('*', { count: 'exact', head: true })
            .eq('player_uuid', player_uuid)
            .eq('completed', true);
            
        const timesData = await fetchAllUserLevelTimes(player_uuid);

        return {
            xp,
            marathonScore: scoreData?.score || 0,
            maxLevel: scoreData?.level || 1,
            completedQuests: completedQuests || 0,
            levelTimes: timesData.filter(lv => lv.level > 0).sort((a, b) => a.level - b.level)
        };
    } catch (err) {
        console.error("Failed to fetch public stats:", err);
        return null;
    }
};

export const awardXP = async (player_uuid: string, amount: number) => {
    if (player_uuid?.startsWith('guest_')) return;
    try {
        const supabase = getSupabase();

        // XP is only awarded server-side: the Edge Function validates the amount and
        // derives the user from the JWT. increment_xp is not executable by clients.
        const { data, error } = await supabase.functions.invoke('award-xp', {
            body: { amount }
        });

        if (error) {
            console.warn("Failed to award XP via Edge Function:", error);
        } else if (data?.error) {
            console.warn("Edge Function returned custom error:", data.error);
        }
    } catch (e) {
        console.warn("Failed to award XP:", e);
    }
};

export const fetchCommunityLevels = async (language: string = 'de', limit: number = 20) => {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('community_levels')
            .select('*')
            .eq('language', language)
            .order('created_at', { ascending: false })
            .limit(limit);
            
        if (error) {
            console.warn("Community levels fetch error (table might not exist yet):", error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error("fetchCommunityLevels error:", err);
        return [];
    }
};

export const createCommunityLevel = async (levelDetails: {creator_uuid: string, creator_username: string, seed: string, title: string, wpm: number, length: number, language: string, theme_color?: string}) => {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('community_levels')
            .insert([levelDetails])
            .select()
            .single();
            
        if (error) throw error;
        return { success: true, data };
    } catch (err) {
        console.error("createCommunityLevel error:", err);
        return { success: false, error: err };
    }
};

export const fetchCommunityLevelLeaderboard = async (level_id: string) => {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('community_level_times')
            .select('player_uuid, nickname, time_ms, created_at')
            .eq('level_id', level_id)
            .order('time_ms', { ascending: true })
            .limit(20);
            
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error("fetchCommunityLevelLeaderboard error:", err);
        return [];
    }
};

export const submitCommunityLevelTime = async (level_id: string, player_uuid: string, nickname: string, time_ms: number) => {
    if (player_uuid?.startsWith('guest_')) return null;
    try {
        const supabase = getSupabase();
        
        let { data: existingData } = await supabase
            .from('community_level_times')
            .select('*')
            .eq('player_uuid', player_uuid)
            .eq('level_id', level_id)
            .limit(1)
            .maybeSingle();

        let isNewBest = false;
        let previousBest = existingData?.time_ms;

        if (existingData) {
            if (time_ms < existingData.time_ms) {
               isNewBest = true;
               await supabase.from('community_level_times').update({ time_ms, nickname }).eq('id', existingData.id);
            } else {
               await supabase.from('community_level_times').update({ nickname }).eq('id', existingData.id);
            }
        } else {
            isNewBest = true;
            await supabase.from('community_level_times').insert([{ level_id, player_uuid, nickname, time_ms }]);
        }
            
        // Increment play count
        await supabase.rpc('increment_play_count', { row_id: level_id });
        
        return { isNewBest, previousBest };
    } catch (err) {
        console.error("submitCommunityLevelTime error:", err);
        return null;
    }
};
