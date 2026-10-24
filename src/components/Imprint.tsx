export function Imprint({ onClose }: { onClose: () => void }) {
    return (
        <div className="glass-panel p-5 md:p-8 rounded-2xl flex flex-col gap-6 bg-slate-900/60 border border-slate-700/50 shadow-2xl backdrop-blur-md relative overflow-hidden w-[calc(100%-2rem)] md:w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-auto text-left">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
            <div className="z-10 flex flex-col gap-6">
                <div className="flex justify-between items-start">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight">Impressum</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white uppercase tracking-widest text-xs font-bold transition-colors">Schließen</button>
                </div>
                
                <div className="text-slate-300 text-sm leading-relaxed space-y-6">
                    <section>
                        <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-xs">Angaben gemäß § 5 TMG</h3>
                        <p>Dennis Sapia<br />
                        Dionysoft<br />
                        Am Kirchenbach 24<br />
                        73441 Bopfingen</p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-xs">Kontakt</h3>
                        <p>Telefon: +49 172 5652031<br />
                        E-Mail: dennis@dionysoft-webdesign.de</p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-xs">Umsatzsteuer</h3>
                        <p>Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).</p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-xs">Redaktionell verantwortlich</h3>
                        <p>Dennis Sapia<br />
                        Am Kirchenbach 24<br />
                        73441 Bopfingen</p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-xs">EU-Streitschlichtung</h3>
                        <p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">https://ec.europa.eu/consumers/odr/</a>.<br />
                        Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-xs">Hinweis</h3>
                        <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
