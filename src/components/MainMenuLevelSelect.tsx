import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Play, Sparkles, X, Target, Zap, BookOpen, Lock } from 'lucide-react';
import { getLevels } from '../lib/levels';
import { Language, TRANSLATIONS } from '../lib/i18n';

interface MainMenuLevelSelectProps {
  language: Language;
  playerLevel: number;
  onClose: () => void;
  onStartGame: (levelIndex: number) => void;
  onReadText: (levelIndex: number) => void;
}

export function MainMenuLevelSelect({ language, playerLevel, onClose, onStartGame, onReadText }: MainMenuLevelSelectProps) {
  const LEVELS = useMemo(() => getLevels(language), [language]);
  const t = TRANSLATIONS[language];
  const [activeCategory, setActiveCategory] = useState<'classic' | 'event' | 'words' | 'unlockable'>('classic');

  const categories = useMemo(() => [
    { id: 'classic', label: language === 'en' ? 'Classic' : 'Klassisch' },
    { id: 'event', label: 'Event' },
    { id: 'words', label: language === 'en' ? 'Words' : 'Wörter' },
    { id: 'unlockable', label: language === 'en' ? 'Unlockable' : 'Freischaltbar' }
  ], [language]);

  const levelsWithIndex = useMemo(() => LEVELS.map((lvl, index) => ({ ...lvl, globalIndex: index })), [LEVELS]);
  const activeLevels = useMemo(() => levelsWithIndex.filter(l => (l.category || 'classic') === activeCategory), [levelsWithIndex, activeCategory]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-3xl flex flex-col overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent_50%)]" />
      
      {/* Header */}
      <div className="flex items-center justify-center p-6 md:p-8 border-b border-white/5 relative z-10 bg-slate-900/50">
          <div className="flex flex-col items-center justify-center">
              <img 
                 src={language === 'de' ? '/levelauswahl-de.png' : '/levelauswahl-en.png'} 
                 alt={language === 'de' ? 'Levelauswahl' : 'Level Select'}
                 className="h-16 md:h-20 object-contain drop-shadow-[0_0_15px_rgba(0,150,255,0.8)] mb-2"
              />
              <p className="text-slate-400 font-bold tracking-widest uppercase text-xs md:text-sm">{t.chooseLevel}</p>
          </div>
          <button 
              onClick={onClose}
              className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 transition-all flex items-center justify-center shrink-0 z-20 shadow-lg"
          >
              <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-6 md:p-12">
          <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col gap-6">
              {/* Category tabs */}
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 pb-4">
                  {categories.map(cat => (
                      <button
                          key={cat.id}
                          onClick={() => setActiveCategory(cat.id as any)}
                          className={`px-6 py-2.5 rounded-full font-bold uppercase tracking-widest text-sm transition-all border ${activeCategory === cat.id ? 'bg-blue-500 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-600'}`}
                      >
                          {cat.label}
                      </button>
                  ))}
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeLevels.map((col, idx) => {
                      const colorHex = col.theme.playerColor;
                      const hudClass = col.theme.hudColor;
                      const isSpecial = "isSpecialEvent" in col && col.isSpecialEvent;
                      const isUnlockable = col.category === 'unlockable';
                      const isLocked = isUnlockable && playerLevel < (col.unlockLevel || 0);

                      return (
                        <motion.div
                          key={col.globalIndex}
                          onClick={() => {
                              if (!isLocked) onStartGame(col.globalIndex);
                          }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          role={isLocked ? "presentation" : "button"}
                          tabIndex={isLocked ? -1 : 0}
                          className={`group relative flex flex-col items-start p-8 rounded-2xl bg-slate-900/60 border ${isLocked ? 'border-slate-800 opacity-60 cursor-not-allowed grayscale' : 'border-slate-800/80 hover:bg-slate-800/80 cursor-pointer'} transition-all text-left overflow-hidden h-[240px]`}
                          style={!isLocked ? {
                             '--hover-glow': `${colorHex}40`,
                             '--border-glow': colorHex,
                          } as React.CSSProperties : undefined}
                          whileHover={!isLocked ? { scale: 1.02, y: -4, borderColor: "var(--border-glow)", boxShadow: "0 10px 40px var(--hover-glow)" } : undefined}
                          whileTap={!isLocked ? { scale: 0.98 } : undefined}
                        >
                          {/* Background Effects */}
                          {!isLocked && (
                              <>
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br from-transparent to-[var(--border-glow)]" />
                                <div className="absolute right-0 bottom-0 opacity-10 blur-xl w-32 h-32 rounded-full transition-transform duration-700 group-hover:scale-150" style={{ backgroundColor: colorHex }} />
                              </>
                          )}
                          
                          {isSpecial && <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] bg-[length:10px_10px]" />}
                          
                          <div className="flex items-start justify-between w-full mb-auto z-10 relative">
                              <div className="flex flex-col gap-2">
                                  <span className={`font-black ${col.category === 'words' ? 'text-xl md:text-2xl' : 'text-3xl md:text-4xl'} text-white uppercase tracking-widest drop-shadow-md`}>
                                     {col.category === 'words' ? col.difficultyName : (col.level > 20 ? `Lvl ${col.level - 20}` : `Lvl ${col.level}`)}
                                  </span>
                                  <span className={`${hudClass} text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2`}>
                                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorHex, boxShadow: `0 0 10px ${colorHex}` }} />
                                      {col.category === 'words' ? (language === 'en' ? 'Words Challenge' : 'Wörter Herausforderung') : col.difficultyName}
                                  </span>
                              </div>
                              
                              {isSpecial && (
                                  <span className="bg-gradient-to-r from-pink-500 to-indigo-500 text-white text-[10px] sm:text-xs font-black px-2 py-1 rounded uppercase tracking-wider animate-pulse border border-pink-400 flex items-center gap-1 shadow-lg">
                                    <Sparkles className="w-3 h-3" /> EVENT
                                  </span>
                              )}
                          </div>

                          <div className="z-10 mt-6 relative w-full flex items-center justify-between pointer-events-none">
                              {isLocked ? (
                                  <div className="flex items-center gap-2 text-slate-500">
                                      <Lock className="w-4 h-4" />
                                      <span className="text-xs font-bold uppercase tracking-widest">
                                          {language === 'en' ? `Unlocks at Level ${col.unlockLevel}` : `Ab Lvl ${col.unlockLevel}`}
                                      </span>
                                  </div>
                              ) : (
                                  <>
                                      <div className="flex items-center gap-2 text-slate-400 group-hover:text-white transition-colors">
                                          <Zap className="w-4 h-4" />
                                          <span className="text-xs font-bold uppercase tracking-widest">{t.playNow}</span>
                                      </div>
                                      
                                      <div className="flex gap-2 pointer-events-auto">
                                          <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onReadText(col.globalIndex);
                                              }}
                                              title={t.readText}
                                              className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-700 bg-slate-800/50 hover:border-cyan-500 hover:bg-cyan-500/20 hover:text-cyan-400 text-slate-400 transition-all shrink-0 z-20 tooltip"
                                          >
                                              <BookOpen className="w-4 h-4" />
                                          </button>
                                          <div className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-700 group-hover:border-transparent group-hover:bg-white text-slate-500 group-hover:text-slate-900 transition-all shrink-0">
                                              <Play className="w-4 h-4 fill-current ml-1" />
                                          </div>
                                      </div>
                                  </>
                              )}
                          </div>
                        </motion.div>
                      );
                  })}
                </div>
              </div>
          </div>
      </div>
    </motion.div>
  );
}
