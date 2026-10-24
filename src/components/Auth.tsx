import React, { useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { Language, TRANSLATIONS } from '../lib/i18n';

interface AuthProps {
    language: Language;
    onAuthSuccess: (username: string, uuid: string) => void;
    onShowPrivacy?: () => void;
}

export function Auth({ language, onAuthSuccess, onShowPrivacy }: AuthProps) {
    const t = TRANSLATIONS[language];
    const [isLogin, setIsLogin] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [honeypot, setHoneypot] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [privacyAccepted, setPrivacyAccepted] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        // Honeypot check: If the hidden field is filled, it's likely a bot
        if (honeypot) {
            console.warn("Honeypot filled, blocking request.");
            return;
        }

        if (!username || !password) {
            setError(t.authErrorEmptyFields);
            return;
        }

        if (!isLogin && !privacyAccepted) {
            setError(t.authErrorPrivacy);
            return;
        }

        if (username.includes(' ')) {
            setError(t.authErrorSpaces);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const supabase = getSupabase();
            // Wir verwenden .com anstelle von .invalid oder .internal, 
            // da Supabase strikt auf gültige Endungen (TLDs) prüft.
            const email = `${username.toLowerCase().trim()}@fake-typerr.com`;

            if (isLogin) {
                const { data, error: authError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (authError) throw authError;
                if (data.user) {
                    onAuthSuccess(username, data.user.id);
                }
            } else {
                // Check if username already exists
                const { checkUsernameExists } = await import('../lib/supabase');
                const exists = await checkUsernameExists(username);
                if (exists) {
                    throw new Error(t.authErrorUsernameTaken);
                }

                const { data, error: authError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            display_name: username
                        }
                    }
                });

                if (authError) throw authError;
                if (data.user) {
                    // Sync to users table for uniqueness checks
                    await import('../lib/supabase').then(m => m.syncUserNickname(data.user!.id, username));
                    onAuthSuccess(username, data.user.id);
                }
            }
        } catch (err: any) {
            console.error('Auth error:', err);
            setError(err.message === 'Invalid login credentials' ? t.authErrorLoginFailed : err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel p-8 rounded-2xl flex flex-col gap-6 bg-slate-900/60 border border-slate-700/50 shadow-2xl backdrop-blur-md relative overflow-hidden w-full max-w-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />
            
            <div className="z-10 flex flex-col gap-4">
                <div className="flex bg-slate-950/50 p-1 rounded-xl border border-slate-800">
                    <button 
                        onClick={() => { setIsLogin(false); setError(''); }}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${!isLogin ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        {t.register}
                    </button>
                    <button 
                        onClick={() => { setIsLogin(true); setError(''); }}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${isLogin ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        {t.login}
                    </button>
                </div>

                <div className="text-center">
                    <h3 className="text-2xl font-black tracking-tight text-white drop-shadow-md uppercase">
                        {isLogin ? t.authWelcomeBack : t.authNewAccount}
                    </h3>
                    <p className="text-slate-400 text-[10px] mt-1 uppercase tracking-[0.2em] font-bold">
                        {isLogin ? t.authLoginSubtitle : t.authRegisterSubtitle}
                    </p>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/20 border border-red-500/40 p-3 rounded-lg text-red-200 text-xs text-center animate-pulse z-10">
                    {error}
                </div>
            )}

            <form onSubmit={handleAuth} className="flex flex-col gap-4 z-10">
                {/* Honeypot field - hidden from users, but bots will fill it */}
                <div className="hidden" aria-hidden="true">
                    <input 
                        type="text" 
                        name="website" 
                        tabIndex={-1} 
                        autoComplete="off" 
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.authUsername}</label>
                        {!isLogin && <span className="text-[9px] text-slate-600 font-bold uppercase italic">{t.authNoSpaces}</span>}
                    </div>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-700 font-bold"
                        placeholder={isLogin ? t.authUsernamePlaceholderLogin : t.authUsernamePlaceholderRegister}
                        maxLength={20}
                    />
                </div>
                
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{t.authPassword}</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-700 font-bold"
                        placeholder="••••••••"
                        minLength={4}
                    />
                </div>

                {!isLogin && (
                    <div className="flex items-start gap-3 mt-2 px-1">
                        <input 
                            type="checkbox" 
                            id="privacyScale"
                            checked={privacyAccepted}
                            onChange={(e) => setPrivacyAccepted(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 shrink-0 cursor-pointer"
                        />
                        <label htmlFor="privacyScale" className="text-[10px] text-slate-400 text-left uppercase tracking-widest font-bold leading-relaxed cursor-pointer select-none">
                            {t.authPrivacyConsent1}{' '}
                            <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (onShowPrivacy) onShowPrivacy(); }}
                                className="text-blue-400 hover:text-blue-300 transition-colors underline cursor-pointer inline"
                            >
                                {t.privacy}
                            </button>
                            {' '}{t.authPrivacyConsent2}
                        </label>
                    </div>
                )}

                <button
                    disabled={loading}
                    className="mt-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all transform active:scale-95 uppercase tracking-widest text-sm border-b-4 border-blue-900"
                >
                    {loading ? t.authLoading : (isLogin ? t.authSubmitLogin : t.authSubmitRegister)}
                </button>
            </form>
        </div>
    );
}
