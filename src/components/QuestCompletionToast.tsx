import { UserQuest, QUEST_DEFINITIONS } from "../lib/quests";
import { CheckCircle2, X } from "lucide-react";
import { Language } from "../lib/i18n";
import { motion, AnimatePresence } from "motion/react";
import { useEffect } from "react";

interface QuestCompletionToastProps {
  quests: UserQuest[];
  language: Language;
  onDismiss: (questId: string) => void;
}

export function QuestCompletionToast({ quests, language, onDismiss }: QuestCompletionToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {quests.map((q) => {
          const def = QUEST_DEFINITIONS.find((d) => d.id === q.quest_id);
          const title = def ? def.getTitle(q.target, language) : q.quest_id;

          return (
            <motion.div
              key={`toast-${q.quest_id}-${q.assigned_date}`}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              className="bg-slate-900 border border-emerald-500/30 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.15)] p-4 flex items-center gap-4 pointer-events-auto w-[300px]"
            >
              <div className="h-10 w-10 shrink-0 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/80">
                  {language === "de" ? "Aufgabe Abgeschlossen" : "Quest Completed"}
                </h4>
                <p className="text-sm font-bold text-slate-200 truncate">{title}</p>
                <p className="text-xs font-mono text-yellow-400 mt-0.5">+{q.xp_reward} XP</p>
              </div>
              <button
                onClick={() => onDismiss(q.quest_id)}
                className="shrink-0 text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
