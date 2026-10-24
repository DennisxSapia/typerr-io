import React, { useEffect, useState } from 'react';
import { MultiplayerState } from '../lib/useMultiplayer';
import { Swords, Loader2, Play } from 'lucide-react';

interface MultiplayerModalsProps {
  mpState: MultiplayerState;
  incomingChallenge: { fromName: string, fromId: string } | null;
  onAccept: () => void;
  onDecline: () => void;
  onCancel: () => void;
  onSelectLevel: (levelIndex: number) => void;
  levels: { difficultyName: string; theme: { playerColor: string } }[];
}

export function MultiplayerModals({
  mpState,
  incomingChallenge,
  onAccept,
  onDecline,
  onCancel,
  onSelectLevel,
  levels
}: MultiplayerModalsProps) {
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    if (mpState.status === 'level-select') {
      setTimeLeft(10);
      const iv = setInterval(() => {
        setTimeLeft(t => {
           if (t <= 1) {
              clearInterval(iv);
              onSelectLevel(0); // fallback to level 0 on timeout
              return 0;
           }
           return t - 1;
        });
      }, 1000);
      return () => clearInterval(iv);
    }
  }, [mpState.status, onSelectLevel]);

  if (incomingChallenge) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4">
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-[fadeIn_0.3s_ease-out]">
          <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Swords className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">{incomingChallenge.fromName}</h2>
          <p className="text-slate-400 mb-8 font-medium">fordert dich zu einem 1v1 heraus!</p>
          <div className="flex gap-4">
            <button onClick={onDecline} className="flex-1 py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors">Ablehnen</button>
            <button onClick={onAccept} className="flex-1 py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-emerald-950 bg-emerald-400 hover:bg-emerald-300 transition-colors">Annehmen</button>
          </div>
        </div>
      </div>
    );
  }

  if (mpState.status === 'challenging' && mpState.opponent) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4">
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-[fadeIn_0.3s_ease-out]">
           <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-6" />
           <h2 className="text-xl font-bold text-white mb-2 tracking-wide">Warte auf {mpState.opponent.username}...</h2>
           <p className="text-slate-400 mb-8 font-medium text-sm">Die Herausforderung wurde gesendet.</p>
           <button onClick={onCancel} className="w-full py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-800 transition-colors">Abbrechen</button>
        </div>
      </div>
    );
  }

  if (mpState.status === 'level-select') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md px-4 py-8">
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 max-w-3xl w-full shadow-2xl animate-[fadeIn_0.3s_ease-out] flex flex-col h-full max-h-[80vh]">
          <div className="text-center mb-6">
             <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">1v1 gegen {mpState.opponent?.username}</h2>
             <p className="text-slate-400 font-medium">Wähle ein Level aus. Zeit: <span className="text-indigo-400 font-bold">{timeLeft}s</span></p>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 sm:grid-cols-2 gap-4">
             {levels.map((col, idx) => (
                <button
                    key={idx}
                    onClick={() => onSelectLevel(idx)}
                    className="flex flex-col text-left bg-slate-800/50 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-all group"
                >
                    <span className="text-xs text-slate-500 font-bold tracking-widest uppercase mb-1">Level {idx+1}</span>
                    <span className="text-lg text-slate-200 font-black group-hover:text-white" style={{color: col.theme.playerColor}}>{col.difficultyName}</span>
                </button>
             ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
