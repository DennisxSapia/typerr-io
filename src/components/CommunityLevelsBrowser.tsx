import { useState, useEffect } from "react";
import { fetchCommunityLevels, createCommunityLevel, fetchCommunityLevelLeaderboard } from "../lib/supabase";
import { CommunityLevelDefinition } from "../lib/communityLevels";
import { motion } from "motion/react";
import { THEMES } from "../lib/levels";
import { RefreshCcw, Search, Plus, Trophy, Play, User as UserIcon, X, Info } from "lucide-react";

export function CommunityLevelsBrowser({ 
    language, 
    onClose, 
    onPlay, 
    user 
}: { 
    language: string, 
    onClose: () => void, 
    onPlay: (level: CommunityLevelDefinition) => void,
    user: {uuid: string, username: string} | null
}) {
    const [levels, setLevels] = useState<CommunityLevelDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'create'>('list');
    
    // Create Mode Form
    const [title, setTitle] = useState('');
    const [seed, setSeed] = useState('');
    const [wpm, setWpm] = useState(60);
    const [length, setLength] = useState(10);
    const [themeColor, setThemeColor] = useState('0');
    const [creating, setCreating] = useState(false);
    
    const t = {
        title: language === 'de' ? 'Level Generator' : 'Level Generator',
        create: language === 'de' ? 'Level erstellen' : 'Create Level',
        refresh: language === 'de' ? 'Aktualisieren' : 'Refresh',
        length: language === 'de' ? 'Länge (Wörter)' : 'Length (Words)',
        wpm: language === 'de' ? 'Ziel-WPM' : 'Target WPM',
        seed: language === 'de' ? 'Seed (Wort-ID)' : 'Seed (Word-ID)',
        play: language === 'de' ? 'Spielen' : 'Play',
        name: language === 'de' ? 'Name des Levels' : 'Level Name',
        empty: language === 'de' ? 'Keine Level gefunden. Sei der Erste!' : 'No levels found. Be the first!',
        createBtn: language === 'de' ? 'Speichern & Veröffentlichen' : 'Save & Publish',
        loginParams: language === 'de' ? 'Du musst eingeloggt sein, um Level zu erstellen.' : 'You must be logged in to create levels.',
        playCount: language === 'de' ? 'Gespielt' : 'Played',
        leaderboardParamsError: language === 'de' ? 'Level Generator Ranking wird demnächst hinzugefügt!' : 'Level Generator Ranking will be added soon!'
    };

    const loadLevels = async () => {
        setLoading(true);
        const data = await fetchCommunityLevels(language, 30);
        setLevels(data);
        setLoading(false);
    };

    useEffect(() => {
        loadLevels();
    }, [language]);
    
    const generateRandomSeed = () => {
        setSeed(Math.random().toString(36).substring(2, 8).toUpperCase());
    };

    const handleCreate = async () => {
        if (!user || user.uuid.startsWith('guest_')) return;
        if (!title.trim() || !seed.trim()) return;
        
        setCreating(true);
        const res = await createCommunityLevel({
            creator_uuid: user.uuid,
            creator_username: user.username,
            title: title.trim(),
            seed: seed.trim(),
            wpm,
            length,
            language,
            theme_color: themeColor
        });
        
        setCreating(false);
        if (res.success) {
            setView('list');
            loadLevels();
        } else {
            alert(language === 'de' ? 'Fehler beim Erstellen. Bitte prüfe, ob die Datenbank-Tabelle existiert.' : 'Error creating level. Check if DB table exists.');
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-3xl flex flex-col overflow-hidden"
        >
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent_50%)]" />
            
            {/* Header */}
            <div className="flex items-center justify-center p-6 md:p-8 border-b border-white/5 relative z-10 bg-slate-900/50 flex-shrink-0">
                <div className="flex flex-col items-center justify-center">
                    <img 
                        src="/levelgenerator-überschrift.png" 
                        alt="Level Generator"
                        className="h-16 md:h-20 object-contain drop-shadow-[0_0_15px_rgba(0,150,255,0.8)] mb-2 mt-4"
                    />
                </div>
                <button 
                    onClick={onClose}
                    className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 transition-all flex items-center justify-center shrink-0 z-20 shadow-lg"
                >
                    <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-12 relative z-10">
                <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col gap-6">
                    {view === 'list' ? (
                        <>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                                <h3 className="text-xl font-bold text-white uppercase tracking-widest">{t.title}</h3>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <button onClick={loadLevels} className="flex-1 sm:flex-none p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300 flex justify-center border-2 border-slate-700 hover:border-slate-500">
                                        <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setView('create');
                                            generateRandomSeed();
                                        }} 
                                        className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 backdrop-blur-sm font-bold text-white uppercase text-sm tracking-widest transition-all flex items-center justify-center gap-2 border-[1px] border-indigo-400/30 hover:border-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                                    >
                                        <Plus className="w-5 h-5" />
                                        {t.create}
                                    </button>
                                </div>
                            </div>
                            {loading ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-4">
                                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-slate-400 uppercase tracking-widest text-xs font-bold font-mono">Loading Neural Data...</p>
                            </div>
                        ) : levels.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-4 opacity-50">
                                <Info className="w-12 h-12 text-slate-500" />
                                <p className="text-slate-400 text-sm">{t.empty}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {levels.map(level => (
                                    <div key={level.id} className="relative overflow-hidden bg-slate-800/80 border border-slate-700 hover:border-slate-500 p-5 rounded-2xl transition-all duration-300 group flex flex-col gap-4 shadow-lg hover:shadow-xl hover:-translate-y-1">
                                        {level.theme_color && THEMES[parseInt(level.theme_color)]?.bg && (
                                            <div className="absolute top-0 right-0 w-32 h-32 blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none rounded-full" style={{ background: THEMES[parseInt(level.theme_color)]?.bg }}></div>
                                        )}
                                        {level.theme_color && THEMES[parseInt(level.theme_color)]?.bg && (
                                            <div className="absolute left-0 top-0 bottom-0 w-2 opacity-80" style={{ background: THEMES[parseInt(level.theme_color)]?.bg }}></div>
                                        )}
                                        <div className="flex justify-between items-start relative z-10">
                                            <div>
                                                <h3 className="text-lg font-black text-white mb-1 group-hover:text-indigo-300 transition-colors tracking-wide">{level.title}</h3>
                                                <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                                    <UserIcon className="w-3 h-3 text-slate-500" />
                                                    {level.creator_username}
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <div className="text-sm font-black text-white px-2 py-1 bg-slate-950/50 rounded drop-shadow-md border border-slate-700/50">
                                                    {level.wpm} <span className="text-[9px] text-slate-500 uppercase tracking-widest">WPM</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1 pr-1">{level.length} Worte</div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between border-t border-slate-700/50 pt-4 mt-auto relative z-10">
                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                <Play className="w-3 h-3 text-indigo-400" />
                                                {level.play_count || 0} <span className="text-slate-500">{t.playCount}</span>
                                            </div>
                                            <button
                                                onClick={() => onPlay(level)}
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] active:scale-95"
                                            >
                                                {t.play}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        </>
                    ) : (
                        <div className="max-w-xl mx-auto flex flex-col gap-6">
                            {(!user || user.uuid.startsWith('guest_')) ? (
                                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                                    <p className="text-red-400 font-bold">{t.loginParams}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">{t.name}</label>
                                        <input 
                                            type="text" 
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            placeholder="z.B. Mein Schweres Level"
                                            className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors placeholder-slate-600"
                                            maxLength={30}
                                        />
                                    </div>
                                    
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2 flex justify-between">
                                            <span>{t.seed}</span>
                                            <button onClick={generateRandomSeed} className="text-indigo-400 hover:text-indigo-300">Neu würfeln</button>
                                        </label>
                                        <input 
                                            type="text" 
                                            value={seed}
                                            onChange={e => setSeed(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                                            className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors font-mono uppercase tracking-widest"
                                            maxLength={8}
                                        />
                                        <p className="text-[10px] text-slate-500 pl-2">Der Seed bestimmt exakt zusammen mit der Länge die generierten Wörter.</p>
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1 flex flex-col gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.wpm}</label>
                                                <span className="text-3xl font-black text-indigo-400 drop-shadow-md">{wpm} <span className="text-[12px] text-slate-500 uppercase font-sans">WPM</span></span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min={10} max={300} step={5}
                                                value={wpm}
                                                onChange={e => setWpm(parseInt(e.target.value))}
                                                className="w-full h-4 bg-slate-950 rounded-full appearance-none cursor-pointer border-2 border-slate-800 focus:outline-none accent-indigo-500"
                                            />
                                            <div className="flex justify-between text-[10px] text-slate-500 font-bold px-1 uppercase tracking-widest">
                                                <span>10 WPM (Easy)</span>
                                                <span>300 WPM (EXTREM)</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 flex flex-col gap-4 justify-between">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">{t.length}</label>
                                                <select 
                                                    value={length}
                                                    onChange={e => setLength(parseInt(e.target.value))}
                                                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors font-bold uppercase tracking-widest text-sm"
                                                >
                                                    <option value={2}>2 Wörter</option>
                                                    <option value={10}>10 Wörter</option>
                                                    <option value={20}>20 Wörter</option>
                                                    <option value={50}>50 Wörter</option>
                                                    <option value={100}>100 Wörter (Schwer)</option>
                                                    <option value={200}>200 Wörter (Marathon)</option>
                                                </select>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2 flex items-center justify-between">
                                                    <span>Hintergrundfarbe</span>
                                                    <div className="w-4 h-4 rounded-full border border-slate-700" style={{ background: THEMES[parseInt(themeColor)]?.bg }}></div>
                                                </label>
                                                <div className="flex flex-wrap gap-2 bg-slate-950 border-2 border-slate-800 rounded-xl p-3">
                                                    {THEMES.map((theme, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={(e) => { e.preventDefault(); setThemeColor(idx.toString()); }}
                                                            className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 shadow-md ${themeColor === idx.toString() ? 'border-indigo-500 scale-110 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'border-slate-700'}`}
                                                            style={{ background: theme.bg }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 flex gap-4">
                                        <button 
                                            onClick={() => setView('list')}
                                            className="flex-1 px-4 py-4 rounded-xl border-2 border-slate-700 text-slate-400 font-bold uppercase tracking-widest hover:text-white hover:bg-slate-800 transition-all font-sans text-sm"
                                        >
                                            Abbrechen
                                        </button>
                                        <button 
                                            onClick={handleCreate}
                                            disabled={!title.trim() || !seed.trim() || creating}
                                            className="flex-1 px-4 py-4 rounded-xl bg-indigo-600 text-white font-bold uppercase tracking-widest hover:bg-indigo-500 transition-all font-sans text-sm shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {creating ? '...' : t.createBtn}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
