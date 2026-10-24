import { getSupabase } from './supabase';

export interface QuestDefinition {
  id: string;
  type: 'make_mistakes' | 'type_letters' | 'marathon_level' | 'wpm_any' | 'finish_levels' | 'finish_words_levels';
  target: number;
  xpReward: number;
  getTitle: (target: number, lang: string) => string;
}

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  {
    id: "fehler_3",
    type: "make_mistakes",
    target: 3,
    xpReward: 500,
    getTitle: (target, lang) => lang === 'de' ? `Sammle ${target} Fehlerpunkte` : `Accumulate ${target} mistakes`
  },
  {
    id: "fehler_10",
    type: "make_mistakes",
    target: 10,
    xpReward: 1200,
    getTitle: (target, lang) => lang === 'de' ? `Sammle ${target} Fehlerpunkte` : `Accumulate ${target} mistakes`
  },
  {
    id: "fehler_50",
    type: "make_mistakes",
    target: 50,
    xpReward: 3500,
    getTitle: (target, lang) => lang === 'de' ? `Sammle ${target} Fehlerpunkte` : `Accumulate ${target} mistakes`
  },
  {
    id: "buchstaben_300",
    type: "type_letters",
    target: 300,
    xpReward: 1000,
    getTitle: (target, lang) => lang === 'de' ? `Tippe ${target} Buchstaben (in einer fehlerfreien Combo)` : `Type ${target} letters (in a flawless combo)`
  },
  {
    id: "buchstaben_1000",
    type: "type_letters",
    target: 1000,
    xpReward: 3000,
    getTitle: (target, lang) => lang === 'de' ? `Tippe ${target} Buchstaben (in einer fehlerfreien Combo)` : `Type ${target} letters (in a flawless combo)`
  },
  {
    id: "buchstaben_5000",
    type: "type_letters",
    target: 5000,
    xpReward: 15000,
    getTitle: (target, lang) => lang === 'de' ? `Tippe ${target} Buchstaben (in einer fehlerfreien Combo)` : `Type ${target} letters (in a flawless combo)`
  },
  {
    id: "marathon_3",
    type: "marathon_level",
    target: 3,
    xpReward: 2000,
    getTitle: (target, lang) => lang === 'de' ? `Schaffe es im Marathon bis Level ${target}` : `Reach Level ${target} in Marathon`
  },
  {
    id: "marathon_6",
    type: "marathon_level",
    target: 6,
    xpReward: 30000,
    getTitle: (target, lang) => lang === 'de' ? `Schaffe es im Marathon bis Level ${target}` : `Reach Level ${target} in Marathon`
  },
  {
    id: "marathon_5",
    type: "marathon_level",
    target: 5,
    xpReward: 10000,
    getTitle: (target, lang) => lang === 'de' ? `Schaffe es im Marathon bis Level ${target}` : `Reach Level ${target} in Marathon`
  },
  {
    id: "wpm_100",
    type: "wpm_any",
    target: 100,
    xpReward: 2000,
    getTitle: (target, lang) => lang === 'de' ? `Erziele über ${target} WPM (außer Wörter)` : `Achieve over ${target} WPM (except Words)`
  },
  {
    id: "wpm_120",
    type: "wpm_any",
    target: 120,
    xpReward: 5000,
    getTitle: (target, lang) => lang === 'de' ? `Erziele über ${target} WPM (außer Wörter)` : `Achieve over ${target} WPM (except Words)`
  },
  {
    id: "wpm_150",
    type: "wpm_any",
    target: 150,
    xpReward: 15000,
    getTitle: (target, lang) => lang === 'de' ? `Erziele über ${target} WPM (außer Wörter)` : `Achieve over ${target} WPM (except Words)`
  },
  {
    id: "levels_5",
    type: "finish_levels",
    target: 5,
    xpReward: 1500,
    getTitle: (target, lang) => lang === 'de' ? `Schließe ${target} Level ab` : `Complete ${target} levels`
  },
  {
    id: "levels_15",
    type: "finish_levels",
    target: 15,
    xpReward: 4000,
    getTitle: (target, lang) => lang === 'de' ? `Schließe ${target} Level ab` : `Complete ${target} levels`
  },
  {
    id: "words_5",
    type: "finish_words_levels",
    target: 5,
    xpReward: 2500,
    getTitle: (target, lang) => lang === 'de' ? `Schließe ${target}x ein "Wörter" Level ab` : `Complete ${target}x a "Words" level`
  },
  {
    id: "words_10",
    type: "finish_words_levels",
    target: 10,
    xpReward: 7500,
    getTitle: (target, lang) => lang === 'de' ? `Schließe ${target}x ein "Wörter" Level ab` : `Complete ${target}x a "Words" level`
  }
];

export interface UserQuest {
  player_uuid: string;
  quest_id: string;
  target: number;
  progress: number;
  completed: boolean;
  assigned_date: string;
  xp_reward: number;
}

// Ensure the date is strictly YYYY-MM-DD in UTC
const getTodayString = () => new Date().toISOString().split('T')[0];

export const fetchDailyQuests = async (player_uuid: string): Promise<UserQuest[]> => {
  const supabase = getSupabase();
  const today = getTodayString();
  
  const { data, error } = await supabase
    .from('user_quests')
    .select('*')
    .eq('player_uuid', player_uuid)
    .eq('assigned_date', today);

  if (error) {
    console.warn("Failed to fetch quests, maybe table is missing:", error);
    return [];
  }

  // If no quests for today, roll random quests and insert
  if (!data || data.length === 0) {
    // Pick 3 random
    const shuffled = [...QUEST_DEFINITIONS].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    
    const newQuests: UserQuest[] = selected.map(q => ({
      player_uuid,
      quest_id: q.id,
      target: q.target,
      progress: 0,
      completed: false,
      assigned_date: today,
      xp_reward: q.xpReward
    }));

    const { error: insertError } = await supabase
      .from('user_quests')
      .insert(newQuests);
      
    if (insertError) {
       console.error("Failed to assign new quests:", insertError);
       return [];
    }
    return newQuests;
  }

  return data;
};

export const updateQuestProgress = async (
  player_uuid: string, 
  quest: UserQuest, 
  progressAcc: number,
  isAbsolute: boolean = false
): Promise<boolean> => {     // returns true if newly completed
  if (quest.completed) return false;
  const newProgress = isAbsolute ? progressAcc : quest.progress + progressAcc;
  if (newProgress <= quest.progress && !isAbsolute) return false; // Optimization

  const cappedProgress = Math.min(newProgress, quest.target);
  const newlyCompleted = cappedProgress >= quest.target;

  const supabase = getSupabase();
  const today = getTodayString();

  await supabase
    .from('user_quests')
    .update({ 
      progress: cappedProgress, 
      completed: newlyCompleted 
    })
    .eq('player_uuid', player_uuid)
    .eq('quest_id', quest.quest_id)
    .eq('assigned_date', today);

  return newlyCompleted;
};
