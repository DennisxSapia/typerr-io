import React from 'react';
import { ChevronLeft, Users, User, Circle, Swords } from 'lucide-react';
import { TRANSLATIONS, Language } from '../lib/i18n';

interface OnlinePlayersListProps {
    onClose: () => void;
    users: {username: string, isUser: boolean, presenceId?: string, statusDesc?: string, uuid?: string}[];
    onChallenge?: (presenceId: string, username: string) => void;
    myPresenceId?: string;
    language: Language;
    onViewProfile?: (username: string, uuid: string) => void;
}

export function OnlinePlayersList({ onClose, users, onChallenge, myPresenceId, language, onViewProfile }: OnlinePlayersListProps) {
    const t = TRANSLATIONS[language];
    
    return (
        <div className="flex flex-col gap-6 w-full max-w-xl mx-auto text-left relative z-10 glass-panel p-6 sm:p-10 rounded-2xl bg-slate-900/60 border border-slate-700/50 shadow-2xl backdrop-blur-md">
            <button 
                onClick={onClose}
                className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full"
            >
                <span className="text-xl leading-none">&times;</span>
            </button>
            <div className="flex flex-col mb-4 border-b border-slate-800/80 pb-6">
                <h2 className="text-3xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                    <Users className="w-8 h-8 text-emerald-400" />
                    {t.playersOnlineTitle}
                </h2>
                <p className="text-slate-400 font-medium tracking-wide mt-2">{users.length} {t.playersPlayingNow}</p>
            </div>

            <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[50vh]">
                {users.length === 0 && (
                    <div className="text-center py-8 text-slate-500 font-medium tracking-widest uppercase">
                        {t.noPlayersOnline}
                    </div>
                )}
                {users.map((u, i) => {
                    const isAvailable = u.statusDesc?.includes(TRANSLATIONS.de.inMainMenu) || u.statusDesc?.includes(TRANSLATIONS.en.inMainMenu);
                    
                    return (
                    <div key={i} className="flex items-center justify-between bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                               <User className={`w-6 h-6 ${u.isUser ? 'text-blue-400' : 'text-slate-500'}`} />
                               <Circle className={`w-2.5 h-2.5 ${isAvailable ? 'text-emerald-500 fill-emerald-500' : 'text-amber-500 fill-amber-500'} absolute -bottom-0.5 -right-0.5`} />
                            </div>
                            <div className="flex flex-col">
                                <span className={`font-bold uppercase tracking-widest ${u.isUser ? 'text-slate-200' : 'text-slate-400'}`}>
                                    {u.isUser && onViewProfile && u.uuid ? (
                                        <button onClick={() => onViewProfile(u.username, u.uuid!)} className="hover:text-purple-400 transition-colors">
                                            {u.username}
                                        </button>
                                    ) : (
                                        <>{u.username}</>
                                    )}
                                    {myPresenceId && u.presenceId === myPresenceId && <span className="text-slate-500 ml-1">{t.youLabel}</span>}
                                </span>
                                <div className="flex flex-col gap-0.5 mt-0.5">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                                        {u.isUser ? t.registeredPlayer : t.guestPlayer}
                                    </span>
                                    {u.statusDesc && (
                                        <span className={`text-[10px] uppercase font-bold tracking-widest ${isAvailable ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            {u.statusDesc}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {onChallenge && u.presenceId && u.presenceId !== myPresenceId && u.isUser && isAvailable && (
                             <button
                                 onClick={() => onChallenge(u.presenceId!, u.username)}
                                 className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30 hover:border-indigo-500/60 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                             >
                                 <Swords className="w-3.5 h-3.5" />
                                 1v1
                             </button>
                        )}
                    </div>
                )})}
            </div>

            <button 
                onClick={onClose}
                className="mt-4 w-full py-4 rounded-xl border border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-300 font-bold uppercase tracking-widest transition-all"
            >
                {t.back}
            </button>
        </div>
    );
}
