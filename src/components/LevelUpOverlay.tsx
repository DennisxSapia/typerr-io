import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';

interface LevelUpOverlayProps {
  totalXp: number | null;
  earnedXpSession?: number;
  visible?: boolean;
  inline?: boolean;
}

export const getLevelFromXp = (xp: number) => Math.floor(Math.sqrt(xp / 100)) + 1;
export const getXpForLevel = (level: number) => 100 * Math.pow(level - 1, 2);

export function LevelUpOverlay({ totalXp, earnedXpSession = 0, visible = true, inline = false }: LevelUpOverlayProps) {
  const [displayedXp, setDisplayedXp] = useState<number | null>(null);
  const [prevLevel, setPrevLevel] = useState<number | null>(null);
  const [levelUpTrigger, setLevelUpTrigger] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const hasStartedAnimationRef = useRef(false);

  useEffect(() => {
    if (totalXp === null) return;
    
    if (displayedXp === null) {
      setDisplayedXp(Math.max(0, totalXp - earnedXpSession));
    }
  }, [totalXp, earnedXpSession, displayedXp]);

  useEffect(() => {
    if (totalXp === null || displayedXp === null || !visible) return;

    if (totalXp > displayedXp && !hasStartedAnimationRef.current) {
        hasStartedAnimationRef.current = true;
        setIsAnimating(true);
        const startXp = displayedXp;
        const targetXp = totalXp;
        const duration = 2500;
        const startTime = performance.now();
        
        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // easeOutQuart
            const ease = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(startXp + (targetXp - startXp) * ease);
            setDisplayedXp(current);

            // trigger level up during animation if we passed a boundary
            const currentLevel = getLevelFromXp(current);
            setPrevLevel((prev) => {
                if (prev !== null && currentLevel > prev) {
                    setLevelUpTrigger(Date.now());
                    confetti({
                        particleCount: 200,
                        spread: 120,
                        origin: { y: 0.6 },
                        colors: ['#4f46e5', '#8b5cf6', '#ec4899', '#ffffff'],
                        zIndex: 9999
                    });
                }
                return currentLevel;
            });
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setDisplayedXp(targetXp);
                setIsAnimating(false);
                hasStartedAnimationRef.current = false; // Reset for next time
            }
        };
        requestAnimationFrame(animate);
    }
  }, [totalXp, displayedXp, visible]);

  // Initial set of prevLevel
  useEffect(() => {
      if (displayedXp !== null && prevLevel === null) {
          setPrevLevel(getLevelFromXp(displayedXp));
      }
  }, [displayedXp, prevLevel]);

  if (!visible || displayedXp === null) return null;

  const currentLevel = getLevelFromXp(displayedXp);
  const nextLevel = currentLevel + 1;
  const currentLevelXp = getXpForLevel(currentLevel);
  const nextLevelXp = getXpForLevel(nextLevel);
  
  const xpIntoCurrentLevel = displayedXp - currentLevelXp;
  const xpNeededForNextLevel = nextLevelXp - currentLevelXp;
  const progressPercent = Math.min(100, Math.max(0, (xpIntoCurrentLevel / xpNeededForNextLevel) * 100));

  return (
    <div className={`${inline ? 'w-full max-w-sm mx-auto mt-6 relative' : 'fixed bottom-4 right-4 sm:bottom-8 sm:right-8 w-[300px] z-50 pointer-events-none'} animate-[fadeInUp_0.5s_ease-out]`}>
      {inline && <div className={`absolute inset-0 blur-2xl rounded-full transition-all duration-700 pointer-events-none ${isAnimating ? 'bg-indigo-500/40 opacity-100 scale-110' : 'bg-indigo-500/10 opacity-50 scale-100'}`} />}
      <div className={`relative bg-slate-900/90 backdrop-blur-xl border rounded-2xl p-5 shadow-2xl flex flex-col gap-3 pb-6 transition-all duration-500 transform ${isAnimating ? 'border-indigo-400/80 scale-105 shadow-[0_0_40px_rgba(99,102,241,0.4)]' : 'border-slate-700/50 scale-100'} ${inline && !isAnimating ? 'border-t-indigo-500/30' : ''}`}>
        
        <div className={`flex items-center justify-between px-1 ${isAnimating && !inline ? "scale-105 transition-transform" : ""}`}>
          <div className="flex items-center gap-2">
            <span className={`font-bold uppercase tracking-widest transition-colors duration-300 ${isAnimating ? 'text-indigo-300 text-sm drop-shadow-md' : 'text-slate-400 text-xs'}`}>Level</span>
            <div 
                key={levelUpTrigger}
                className={`flex items-center justify-center font-black shadow-[0_0_15px_rgba(79,70,229,0.2)] transition-all duration-300 ${isAnimating ? 'w-12 h-12 text-xl bg-indigo-500/40 border-indigo-400/80 text-white animate-pulse rounded-xl drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'w-10 h-10 text-base bg-indigo-500/20 border-indigo-500/50 text-indigo-400 rounded-lg'} border`}
            >
              {currentLevel}
            </div>
          </div>
          <div className="text-right">
             <span className={`font-mono font-bold transition-all duration-300 ${isAnimating ? 'text-white text-3xl drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]' : 'text-indigo-300 text-xl'}`}>
                 {displayedXp.toLocaleString()}
             </span>
             <span className={`font-mono font-bold ml-1 transition-colors duration-300 ${isAnimating ? 'text-indigo-200 text-sm' : 'text-slate-500 text-xs'}`}>XP</span>
          </div>
        </div>

        {/* XP Bar */}
        <div className={`relative w-full rounded-full overflow-hidden mt-1 transition-all duration-500 ${isAnimating ? 'h-6 bg-slate-900 shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]' : 'h-3 bg-slate-800 shadow-inner'}`}>
          {!isAnimating && <div className="absolute inset-0 bg-slate-900/50 rounded-full" />}
          <div 
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-[30ms] ease-linear ${isAnimating ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_20px_rgba(168,85,247,0.8)]' : 'bg-gradient-to-r from-indigo-600 via-indigo-400 to-indigo-300 shadow-[0_0_10px_rgba(129,140,248,0.5)]'}`}
            style={{ 
                width: `${progressPercent}%`,
            }}
          >
            <div className={`absolute top-0 right-0 bottom-0 w-10 border-r-2 border-white/20 bg-gradient-to-r from-transparent ${isAnimating ? 'to-white/80 animate-pulse' : 'to-white/40'}`} />
            
            {/* Shimmer effect when animating */}
            {isAnimating && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-[50%] animate-[shimmer_1s_infinite] skew-x-[-20deg]" />
            )}
          </div>
        </div>

        <div className="flex justify-between items-center px-1">
            <span className={`font-bold uppercase tracking-widest transition-all duration-300 ${isAnimating ? 'text-xs text-indigo-200 drop-shadow-[0_0_5px_rgba(99,102,241,0.8)]' : 'text-[10px] text-slate-500'}`}>
                {Math.floor(xpIntoCurrentLevel).toLocaleString()} <span className={isAnimating ? "text-pink-400" : "text-slate-600"}>/</span> {Math.floor(xpNeededForNextLevel).toLocaleString()}
            </span>
            <span className={`font-bold uppercase tracking-widest transition-all duration-300 ${isAnimating ? 'text-xs text-pink-300 drop-shadow-[0_0_5px_rgba(236,72,153,0.8)]' : 'text-[10px] text-indigo-400'}`}>
                Next: {nextLevel}
            </span>
        </div>
      </div>
    </div>
  );
}
