import { UserQuest, QUEST_DEFINITIONS } from "../lib/quests";
import { CheckCircle2, Circle } from "lucide-react";
import { Language } from "../lib/i18n";
import { motion } from "motion/react";

interface DailyQuestsPanelProps {
  quests: UserQuest[];
  language: Language;
}

export function DailyQuestsPanel({ quests, language }: DailyQuestsPanelProps) {
  if (!quests || quests.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-2 mt-2">
      <div className="flex items-center gap-2 mb-1 pl-1">
        <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs">
          {language === 'de' ? 'Tägliche Aufgaben' : 'Daily Quests'}
        </h3>
        <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
          {language === 'de' ? 'Setzt sich täglich zurück' : 'Resets daily'}
        </span>
      </div>
      
      {quests.map((q, idx) => {
        const def = QUEST_DEFINITIONS.find(d => d.id === q.quest_id);
        const title = def ? def.getTitle(q.target, language) : q.quest_id;
        const progressPct = Math.min(100, Math.max(0, (q.progress / q.target) * 100));
        const isDone = q.completed;
        
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={q.quest_id}
            className={`w-full relative overflow-hidden backdrop-blur-sm border rounded-lg p-3 transition-colors ${
              isDone 
                ? 'bg-emerald-900/20 border-emerald-500/30' 
                : 'bg-slate-900/40 border-slate-700/50'
            }`}
          >
            <div className="flex justify-between items-start gap-3 relative z-10">
              <div className="flex-1 flex flex-col gap-1">
                <span className={`text-sm font-bold leading-snug ${isDone ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {title}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-500/80">
                  +{q.xp_reward} XP
                </span>
              </div>
              <div className="shrink-0 flex items-center justify-center pt-0.5">
                 {isDone ? (
                   <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                 ) : (
                   <Circle className="w-5 h-5 text-slate-600" />
                 )}
              </div>
            </div>
            
            {!isDone && (
              <div className="w-full mt-3 flex items-center gap-3 relative z-10">
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full bg-blue-500 rounded-full"
                  />
                </div>
                <span className="text-xs font-mono font-bold text-slate-400 shrink-0 w-12 text-right">
                  {Math.floor(q.progress)}/{q.target}
                </span>
              </div>
            )}
            
            {/* Background shimmer if done */}
            {isDone && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
