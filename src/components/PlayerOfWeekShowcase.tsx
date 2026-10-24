import React, { useState, useEffect, useRef, useMemo } from "react";
import { fetchLevelTimes } from "../lib/supabase";
import { parseLevelText } from "../App";
import { MiniGameRenderer } from "./MiniGameRenderer";
import { Language, TRANSLATIONS } from "../lib/i18n";
import { getLevels } from "../lib/levels";

interface Props {
  language: Language;
}

export const PlayerOfWeekShowcase = ({ language }: Props) => {
  const defaultLevels = useMemo(() => getLevels(language), [language]);
  const [currentLevel, setCurrentLevel] = useState(defaultLevels[6]);
  const [bestPlayer, setBestPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Playback state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isFinished, setIsFinished] = useState(false);

  // Reference for the timeout to allow cleanup
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadBest = async () => {
      try {
        let data = await fetchLevelTimes(7, false, language);
        let usedLanguage = language;
        if (!data || data.length === 0 || !data.find((d: any) => d.replay_data && d.replay_data.length > 0)) {
            // Fallback to German scores if no English score exists
            data = await fetchLevelTimes(7, false, 'de');
            usedLanguage = 'de';
        }
        
        if (data && data.length > 0) {
          // Find the first valid one with replay data
          const best = data.find((d: any) => d.replay_data && d.replay_data.length > 0);
          if (best) {
            if (usedLanguage !== language) {
                setCurrentLevel(getLevels('de')[6]);
            } else {
                setCurrentLevel(defaultLevels[6]);
            }
            setBestPlayer(best);
          }
        }
      } catch (e) {
        console.error("Failed to load best player", e);
      } finally {
        setLoading(false);
      }
    };
    loadBest();
  }, []);

  const currentLevelText = currentLevel.text;
  const currentTokens = parseLevelText(currentLevelText);

  useEffect(() => {
    if (!bestPlayer || !bestPlayer.replay_data || bestPlayer.replay_data.length === 0) return;

    let isActive = true;
    const replayData = bestPlayer.replay_data;

    let pIndex = 0;
    
    const playNext = () => {
        if (!isActive) return;
        if (pIndex >= replayData.length || pIndex >= currentTokens.length) {
            setIsFinished(true);
            
            // Loop the replay after 3 seconds
            timeoutRef.current = setTimeout(() => {
                if (!isActive) return;
                pIndex = 0;
                setCurrentIndex(0);
                setIsFinished(false);
                playNext();
            }, 3000);
            return;
        }

        const delta = Math.abs(replayData[pIndex]); // use absolute to handle mistakes smoothly in visual
        // if delta is negative, it meant a mistake in game, but for visual maybe we just pause and move on,
        // or we could show a red flash? To keep it simple, just delay and proceed.
        // Also wait, replayData has same length as tokens? Yes, minus mistakes. Wait, mistakes are added as negative delta!
        // A mistake means the index DID NOT advance in the actual game!
        // So wait, if a mistake happened, we should just wait, and NOT advance the token index.
        const actualDelta = Math.abs(replayData[pIndex]);
        const isMistake = replayData[pIndex] < 0;

        timeoutRef.current = setTimeout(() => {
            if (!isActive) return;
            
            if (!isMistake) {
              setCurrentIndex(prev => prev + 1);
            }
            pIndex++;
            playNext();
        }, actualDelta);
    };

    // start
    timeoutRef.current = setTimeout(() => {
        playNext();
    }, 1000);

    return () => {
        isActive = false;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [bestPlayer]);

  if (loading || !bestPlayer) return null;

  return (
    <div className="hidden lg:flex flex-col items-center justify-center w-[350px] xl:w-[420px] shrink-0 pt-0">
      <div className="relative w-full h-[450px] xl:h-[520px] flex flex-col items-center justify-start overflow-hidden group transition-transform duration-700 hover:scale-[1.02] rounded-[3rem] shadow-[0_0_80px_rgba(56,189,248,0.15)] ring-1 ring-blue-500/10">
        
        {/* Deep background for the 3D scene */}
        <div className="absolute inset-0 z-0 opacity-50" style={{ background: 'radial-gradient(circle at 50% 30%, rgb(0, 0, 0) 0%, rgb(17, 17, 17) 70%, rgb(0, 0, 0) 100%)' }}></div>
        
        <div className="absolute inset-0 z-0 opacity-80 mix-blend-screen scale-110">
          <MiniGameRenderer tokens={currentTokens} currentIndex={currentIndex} theme={currentLevel.theme} />
        </div>
        
        {/* Soft blackout from top so text is readable */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/80 via-black/20 to-transparent pointer-events-none h-1/2"></div>

        <div className="relative z-20 flex flex-col items-center text-center pt-10 pb-4 w-full px-8">
            <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20 backdrop-blur-md">
              <span className="text-[9px] font-black text-cyan-400/90 uppercase tracking-[0.2em] drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">{TRANSLATIONS[language].weeklyEventBest}</span>
            </div>
            
            <h3 className="text-3xl xl:text-4xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,1)] truncate w-full my-1 z-20 font-sans tracking-tight" title={bestPlayer.nickname}>{bestPlayer.nickname}</h3>
            
            <span className="text-base font-bold text-blue-300 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] font-mono z-20 mb-6">
                {(bestPlayer.time_ms / 1000).toFixed(2)}s
            </span>
            
            <div className="w-[80%] flex flex-col items-center gap-4">
              <div className="w-full h-1 bg-slate-800/80 rounded-full overflow-hidden shadow-inner border border-white/5">
                  <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-100 shadow-[0_0_12px_rgba(56,189,248,1)]" 
                      style={{ width: `${(currentIndex / currentTokens.length) * 100}%` }} 
                  />
              </div>
              <div className="flex items-center justify-center z-20 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/5">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-[pulse_1s_ease-in-out_infinite] shadow-[0_0_10px_rgba(239,68,68,1)]"></div>
              </div>
            </div>
        </div>

        {isFinished && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-[fadeIn_0.5s_ease-out]">
              <span className="text-cyan-400 font-black uppercase tracking-[0.3em] text-sm drop-shadow-[0_0_15px_rgba(56,189,248,1)]">{TRANSLATIONS[language].replayFinished}</span>
            </div>
        )}
      </div>
    </div>
  );
};
