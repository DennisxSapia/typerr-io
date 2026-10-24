import React from 'react';
import { Share2, Swords } from 'lucide-react';

interface GhostChallengeModalProps {
    challenge: {username: string, level: number, ghostData: any, language: string} | null;
    language: string;
    onAccept: (ghost: any) => void;
    onDecline: () => void;
}

export function GhostChallengeModal({ challenge, language, onAccept, onDecline }: GhostChallengeModalProps) {
    if (!challenge) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4 pointer-events-auto">
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-[fadeIn_0.3s_ease-out]">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <Share2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">{challenge.username}</h2>
                <p className="text-slate-400 mb-2 font-medium">
                    {language === 'de' ? 'hat dich herausgefordert, seine Zeit zu schlagen!' : 'challenged you to beat their time!'}
                </p>
                <div className="inline-block bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 mb-8">
                    <p className="text-emerald-400 text-sm font-bold tracking-widest uppercase">
                        {challenge.level === 0 ? 'Marathon' : `Level ${challenge.level}`}
                    </p>
                    <p className="text-slate-300 font-mono text-lg font-bold mt-1">
                        {(challenge.ghostData.time_ms / 1000).toFixed(2)}s
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <button onClick={() => onAccept(challenge)} className="w-full py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-emerald-950 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-[0_4px_14px_rgba(52,211,153,0.3)] flex items-center justify-center gap-2">
                        <Swords className="w-5 h-5" />
                        {language === 'de' ? 'Annehmen' : 'Accept'}
                    </button>
                    <button onClick={onDecline} className="w-full py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors">
                        {language === 'de' ? 'Ablehnen' : 'Decline'}
                    </button>
                </div>
            </div>
        </div>
    );
}
