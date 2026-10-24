import React from 'react';
import { ChevronLeft, Keyboard, AlertTriangle, Trophy, TrendingUp, Eye } from 'lucide-react';
import { Language, TRANSLATIONS } from '../lib/i18n';

interface InstructionsProps {
    language: Language;
    onClose: () => void;
}

export function Instructions({ language, onClose }: InstructionsProps) {
    const t = TRANSLATIONS[language];
    return (
        <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto text-left relative z-10 glass-panel p-6 sm:p-10 rounded-2xl bg-slate-900/60 border border-slate-700/50 shadow-2xl backdrop-blur-md">
            <button 
                onClick={onClose}
                className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full"
            >
                <ChevronLeft className="w-5 h-5 absolute opacity-0" />
                <span className="text-xl leading-none">&times;</span>
            </button>
            <div className="flex flex-col mb-4 border-b border-slate-800/80 pb-6">
                <h2 className="text-3xl font-black text-white uppercase tracking-wider">{t.tutorialHeader}</h2>
                <p className="text-slate-400 font-medium tracking-wide mt-2">{t.tutorialSubText}</p>
            </div>

            <div className="flex flex-col gap-8 flex-1 overflow-y-auto pr-2 no-scrollbar">
                
                <section className="flex flex-col gap-3 group">
                    <div className="flex items-center gap-3 text-blue-400 mb-1">
                        <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                            <Keyboard className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold uppercase tracking-widest text-slate-200">{t.tutPrincipleTitle}</h3>
                    </div>
                    <ul className="text-slate-300 text-sm leading-relaxed max-w-xl list-disc list-inside space-y-2">
                        <li><strong className="text-blue-300">{t.tutPrincipleType}</strong> {t.tutPrinciple1}</li>
                        <li><strong className="text-blue-300">{t.tutPrincipleDodge}</strong> {t.tutPrinciple2}</li>
                        <li><strong className="text-blue-300">{t.tutPrincipleJump}</strong> {t.tutPrinciple3}</li>
                    </ul>
                </section>

                <section className="flex flex-col gap-3 group">
                    <div className="flex items-center gap-3 text-red-500 mb-1">
                        <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold uppercase tracking-widest text-slate-200">{t.tutSuddenDeathTitle}</h3>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                        {t.tutSuddenDeathDescPart1} <strong className="text-red-400">{t.tutSuddenDeathDescPart2}</strong> {t.tutSuddenDeathDescPart3}
                    </p>
                </section>

                {/* New Section */}
                <section className="flex flex-col gap-3 group">
                    <div className="flex items-center gap-3 text-emerald-400 mb-1">
                        <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                            <Eye className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold uppercase tracking-widest text-slate-200">{t.tutSpecialTitle as any}</h3>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                        {t.tutSpecialDesc as any}
                    </p>
                </section>

                <section className="flex flex-col gap-3 group">
                    <div className="flex items-center gap-3 text-pink-400 mb-1">
                        <div className="p-2 bg-pink-500/10 rounded-lg group-hover:bg-pink-500/20 transition-colors">
                            <Trophy className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold uppercase tracking-widest text-slate-200">{t.tutMarathonTitle}</h3>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                        {t.tutMarathonDesc}
                    </p>
                </section>

                <section className="flex flex-col gap-3 group">
                    <div className="flex items-center gap-3 text-purple-400 mb-1">
                        <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold uppercase tracking-widest text-slate-200">{t.tutEventTitle}</h3>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                        {t.tutEventDesc}
                    </p>
                </section>

                <div className="mt-4 p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none"></div>
                    <p className="text-center font-black uppercase text-sm tracking-widest text-slate-400">{t.tutGoodLuck}</p>
                </div>

            </div>

            <button 
                onClick={onClose}
                className="mt-2 w-full py-4 rounded-xl border border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-300 font-bold uppercase tracking-widest transition-all"
            >
                {t.back}
            </button>
        </div>
    );
}
