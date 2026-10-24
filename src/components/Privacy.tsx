import { Language } from '../lib/i18n';

export function Privacy({ language, onClose }: { language: Language; onClose: () => void }) {
    if (language === 'en') {
        return (
            <div className="glass-panel p-5 md:p-8 rounded-2xl flex flex-col gap-6 bg-slate-900/60 border border-slate-700/50 shadow-2xl backdrop-blur-md relative overflow-hidden w-[calc(100%-2rem)] md:w-full max-w-3xl max-h-[85vh] overflow-y-auto mx-auto text-left">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
                <div className="z-10 flex flex-col gap-6">
                    <div className="flex justify-between items-start sticky top-0 bg-slate-900/80 backdrop-blur-md py-4 -my-4 z-20 border-b border-slate-800">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Privacy Policy</h2>
                        <button onClick={onClose} className="text-slate-500 hover:text-white uppercase tracking-widest text-xs font-bold transition-colors">Close</button>
                    </div>
                    
                    <div className="text-slate-300 text-sm leading-relaxed space-y-8 mt-4">
                        <section>
                            <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-sm text-blue-400">1. Data Protection at a Glance</h3>
                            <p>The following notes provide a simple overview of what happens to your personal data when you visit this website. Personal data means all data with which you can be personally identified.</p>
                        </section>

                        <section>
                            <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-sm text-blue-400">2. Responsible Entity</h3>
                            <p className="mb-2">The responsible entity for data processing on this website is:</p>
                            <p className="bg-slate-950 p-4 rounded-lg font-mono text-xs border border-slate-800 mb-2">
                            Dennis Sapia<br />
                            Dionysoft<br />
                            Am Kirchenbach 24<br />
                            73441 Bopfingen<br />
                            Email: dennis@dionysoft-webdesign.de
                            </p>
                            <p>The responsible entity is the natural or legal person who alone or jointly with others decides on the purposes and means of processing personal data.</p>
                        </section>

                        <section>
                            <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-sm text-blue-400">3. Hosting and Content Delivery</h3>
                            <p className="mb-2">We host the contents of our website with the following provider:</p>
                            <p className="font-bold text-white mb-2">Hostinger International Ltd.</p>
                            <p className="mb-2">61 Lordou Vironos Street, 6023 Larnaca, Cyprus</p>
                            <p className="mb-2">When you visit our website, our hosting provider records various log files including your IP address.</p>
                            <p className="mb-2">We use the hoster for the purpose of fulfilling the contract with our potential and existing customers (Art. 6 Para. 1 lit. b GDPR) and in the interest of secure, fast and efficient provision of our online offer by a professional provider (Art. 6 Para. 1 lit. f GDPR).</p>
                            <p>We have concluded an order processing agreement (DPA) with the provider mentioned above.</p>
                        </section>

                        <section>
                            <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-sm text-blue-400">4. Data Collection on this Website</h3>
                            
                            <h4 className="text-white font-bold mb-2 uppercase tracking-widest text-xs mt-4">a) Server Log Files</h4>
                            <p className="mb-2">The provider of the pages automatically collects and stores information in so-called server log files, which your browser automatically transmits to us. These are in particular:</p>
                            <ul className="list-disc list-inside bg-slate-950 p-4 border border-slate-800 rounded-lg mb-2">
                                <li>Browser type and browser version</li>
                                <li>used operating system</li>
                                <li>Referrer URL</li>
                                <li>Host name of the accessing computer</li>
                                <li>Time of the server request</li>
                                <li>IP address</li>
                            </ul>
                            <p className="mb-2">This data is not merged with other data sources.</p>
                            <p>This data is collected on the basis of Art. 6 para. 1 lit. f GDPR. The website operator has a legitimate interest in the technically error-free presentation and the optimization of his website.</p>

                            <h4 className="text-white font-bold mb-2 uppercase tracking-widest text-xs mt-4">b) Language Selection</h4>
                            <p>In order to display our website to you in the appropriate language, your browser automatically evaluates the set system language the first time you visit it. This information is only used for automatic forwarding to the appropriate language version (/de or /en) and is not permanently stored or used for profiling purposes.</p>

                        </section>

                        <section>
                            <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-sm text-blue-400">5. Fonts</h3>
                            <p>For the uniform representation of fonts, this page uses web fonts provided directly by our server. A connection to Google servers (Google Fonts) does not take place.</p>
                        </section>

                        <section>
                            <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-sm text-blue-400">6. Local Storage / Technically necessary data</h3>
                            <p className="mb-2">This website completely foregoes the use of cookies for analysis, tracking, or marketing purposes. We also do not use Google Analytics, Meta Pixel, or similar tracking tools.</p>
                            <p>Our database provider Supabase solely uses your browser's "Local Storage" for login functions and session management (Authentication Tokens). This is technically indispensable to keep you logged in and to save your highscores (legitimate interest according to Art. 6 Para. 1 lit. f GDPR or fulfillment of a contract according to Art. 6 Para. 1 lit. b GDPR).</p>
                        </section>

                        <section>
                            <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-sm text-blue-400">7. SSL or TLS Encryption</h3>
                            <p>This site uses SSL or TLS encryption for security reasons and to protect the transmission of confidential content. You can recognize an encrypted connection by the fact that the address line of the browser changes from "http://" to "https://".</p>
                        </section>

                        <section>
                            <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-sm text-blue-400">8. Your Rights</h3>
                            <p className="mb-2">You have the following rights within the scope of the applicable legal provisions:</p>
                            <ul className="list-disc list-inside bg-slate-950 p-4 border border-slate-800 rounded-lg mb-2">
                                <li>Right to information (Art. 15 GDPR)</li>
                                <li>Right to rectification (Art. 16 GDPR)</li>
                                <li>Right to erasure (Art. 17 GDPR)</li>
                                <li>Right to restriction of processing (Art. 18 GDPR)</li>
                                <li>Right to data portability (Art. 20 GDPR)</li>
                                <li>Right to object to the processing (Art. 21 GDPR)</li>
                            </ul>
                            <p className="mb-2">If data processing is based on your consent, you have the right to revoke this consent at any time.</p>
                            <p className="font-bold text-white mb-2">Right to lodge a complaint with the competent supervisory authority:</p>
                             <p>In the event of violations of data protection law, you have the right to lodge a complaint with a supervisory authority. The competent authority is usually the data protection authority of your usual place of residence or our company's headquarters.</p>
                        </section>

                        <section>
                            <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-sm text-blue-400">9. Use of Supabase (Database & Authentication)</h3>
                            <p className="mb-2">We use the service provider <strong>Supabase Inc.</strong> (9701 Apollo Dr Suite 399, Largo, MD 20774, USA) for maintaining user accounts (registration and login) and for displaying highscores and player statistics (leaderboards).</p>
                            <p className="mb-2">By creating an account, we process data to set up your profile and enable the game. For your privacy, we rely on data minimization and pseudonymization. The specific data processed:</p>
                            <ul className="list-disc list-inside bg-slate-950 p-4 border border-slate-800 rounded-lg mb-2">
                                <li>Chosen username / nickname (displayed publicly on the leaderboard)</li>
                                <li>Cryptographically hashed password (not stored in plain text)</li>
                                <li>Game data (e.g., maximum level, points reached, record times)</li>
                            </ul>
                            <p className="mb-2 font-bold text-emerald-400">Important note on pseudonyms: We consciously do NOT collect real email addresses. To use the Supabase system, our application automatically generates a dummy email address (based on your username). Thus, we have no means to contact you outside the game, track you, or identify you personally.</p>
                            <p className="mb-2">The legal basis for this is the performance of a contract (Art. 6 Para. 1 lit. b GDPR), as this data is required to grant you access to our interactive web application and leaderboard.</p>
                            <p className="mb-2">The servers are mostly located within the European Union. Should data transfers to the USA or other third countries occur, we rely on the standard contractual clauses of the EU Commission or the adequacy decision under the EU-US Data Privacy Framework. We have concluded a Data Processing Agreement (DPA) with Supabase.</p>
                            <p>Player data in the leaderboard (username and highscore) are publicly visible to other web app users. Further information on Supabase's data privacy can be found at: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline font-bold">https://supabase.com/privacy</a>.</p>
                        </section>
                        <section>
                            <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-sm text-blue-400">10. Processing of Presence Data (Online Players)</h3>
                            <p className="mb-2">Our application uses the real-time features ("Realtime Presence") of Supabase to provide a display of currently online players.</p>
                            <p className="mb-2">When you open our website, a real-time connection to the server is established. The following data is temporarily captured and transmitted to other players:</p>
                            <ul className="list-disc list-inside bg-slate-950 p-4 border border-slate-800 rounded-lg mb-2">
                                <li>Your current connection status (Online)</li>
                                <li>Your chosen username or "Guest"</li>
                                <li>Your current game state (e.g., in menu, playing level X)</li>
                            </ul>
                            <p className="mb-2">These real-time data are processed exclusively ephemerally in the active connection instance (Presence Channel) and are used for community features.</p>
                            <p>The legal basis for the real-time processing of registered players is the provision of interactive game functions and fulfillment of a contract (Art. 6 Para. 1 lit. b GDPR). If you use the app as a guest, the (pseudonymous) processing is based on our legitimate interest (Art. 6 Para. 1 lit. f GDPR) in a smooth community experience.</p>
                        </section>
                        <section>
                            <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-sm text-blue-400">11. Storage of Game Replays (Ghost Mode)</h3>
                            <p className="mb-2">To enable the "Ghost Challenge" feature and verify highscores, we record and store replay data of your successful game sessions. This data includes:</p>
                            <ul className="list-disc list-inside bg-slate-950 p-4 border border-slate-800 rounded-lg mb-2">
                                <li>Keystrokes and their precise timing during a level</li>
                            </ul>
                            <p>This data is tied to your pseudonym (username) if you are logged in, or stored anonymously for guests. Other players can watch these replays to compete against your time (Ghost Mode). The processing and publication in the leaderboard are based on the performance of a contract (Art. 6 Para. 1 lit. b GDPR) and our legitimate interest in providing a competitive gaming experience (Art. 6 Para. 1 lit. f GDPR).</p>
                        </section>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-panel p-5 md:p-8 rounded-2xl flex flex-col gap-6 bg-slate-900/60 border border-slate-700/50 shadow-2xl backdrop-blur-md relative overflow-hidden w-[calc(100%-2rem)] md:w-full max-w-3xl max-h-[85vh] overflow-y-auto mx-auto text-left">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
            <div className="z-10 flex flex-col gap-6">
                <div className="flex justify-between items-start sticky top-0 bg-slate-900/80 backdrop-blur-md py-4 -my-4 z-20 border-b border-slate-800">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Datenschutzerklärung</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white uppercase tracking-widest text-xs font-bold transition-colors">Schließen</button>
                </div>
                
                <div className="text-slate-300 text-sm leading-relaxed space-y-8 mt-4">
                    <section>
                        <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-sm text-blue-400">1. Datenschutz auf einen Blick</h3>
                        <p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.</p>
                    </section>
                    <section>
                        <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-sm text-blue-400">2. Verantwortliche Stelle</h3>
                        <p className="mb-2">Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:</p>
                        <p className="bg-slate-950 p-4 rounded-lg font-mono text-xs border border-slate-800 mb-2">
                        Dennis Sapia<br />
                        Dionysoft<br />
                        Am Kirchenbach 24<br />
                        73441 Bopfingen<br />
                        E-Mail: dennis@dionysoft-webdesign.de
                        </p>
                        <p>Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten entscheidet.</p>
                    </section>
                    <section>
                        <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-sm text-blue-400">3. Hosting und Content Delivery</h3>
                        <p className="mb-2">Wir hosten die Inhalte unserer Website bei folgendem Anbieter:</p>
                        <p className="font-bold text-white mb-2">Hostinger International Ltd.</p>
                        <p className="mb-2">61 Lordou Vironos Street, 6023 Larnaca, Zypern</p>
                        <p className="mb-2">Beim Besuch unserer Website erfasst unser Hosting-Anbieter verschiedene Logfiles einschließlich Ihrer IP-Adressen.</p>
                        <p className="mb-2">Die Verwendung des Hosters erfolgt zum Zwecke der Vertragserfüllung gegenüber unseren potenziellen und bestehenden Kunden (Art. 6 Abs. 1 lit. b DSGVO) sowie im Interesse einer sicheren, schnellen und effizienten Bereitstellung unseres Online-Angebots durch einen professionellen Anbieter (Art. 6 Abs. 1 lit. f DSGVO).</p>
                        <p>Wir haben mit dem oben genannten Anbieter einen Vertrag zur Auftragsverarbeitung (AVV) geschlossen.</p>
                    </section>
                    <section>
                        <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-sm text-blue-400">4. Datenerfassung auf dieser Website</h3>
                        <h4 className="text-white font-bold mb-2 uppercase tracking-widest text-xs mt-4">a) Server-Log-Dateien</h4>
                        <p className="mb-2">Der Provider der Seiten erhebt und speichert automatisch Informationen in sogenannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind insbesondere:</p>
                        <ul className="list-disc list-inside bg-slate-950 p-4 border border-slate-800 rounded-lg mb-2">
                            <li>Browsertyp und Browserversion</li>
                            <li>verwendetes Betriebssystem</li>
                            <li>Referrer URL</li>
                            <li>Hostname des zugreifenden Rechners</li>
                            <li>Uhrzeit der Serveranfrage</li>
                            <li>IP-Adresse</li>
                        </ul>
                        <p className="mb-2">Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen.</p>
                        <p>Die Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein berechtigtes Interesse an der technisch fehlerfreien Darstellung und Optimierung seiner Website.</p>
                        <h4 className="text-white font-bold mb-2 uppercase tracking-widest text-xs mt-4">b) Sprachauswahl</h4>
                        <p>Um Ihnen unsere Website in der passenden Sprache anzuzeigen, wertet Ihr Browser beim ersten Aufruf automatisch die eingestellte Systemsprache aus. Diese Information wird lediglich zur automatischen Weiterleitung auf die entsprechende Sprachversion (/de oder /en) genutzt und nicht dauerhaft gespeichert oder für Profiling-Zwecke verwendet.</p>
                    </section>
                    <section>
                        <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-sm text-blue-400">5. Schriftarten</h3>
                        <p>Diese Website nutzt zur einheitlichen Darstellung von Schriftarten sogenannte Web Fonts, die lokal auf unserem Server gehostet werden. Eine Verbindung zu Servern von Google (Google Fonts) findet nicht statt.</p>
                    </section>
                    <section>
                        <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-sm text-blue-400">6. Local Storage / Technisch notwendige Daten</h3>
                        <p className="mb-2">Diese Website verzichtet vollständig auf Cookies zu Analyse-, Tracking- oder Marketingzwecken. Wir setzen auch kein Google Analytics, Meta Pixel oder ähnliche Tracking-Tools ein.</p>
                        <p>Lediglich für die Funktion des Logins und zur Verwaltung Ihrer Spieler-Session (Authentication-Tokens) nutzt unser Datenbankanbieter Supabase den sogenannten "Local Storage" Ihres Browsers. Dies ist technisch zwingend erforderlich, damit Sie eingeloggt bleiben und Ihre Highscores speichern können (berechtigtes Interesse gem. Art. 6 Abs. 1 lit. f DSGVO bzw. Vertragserfüllung gem. Art. 6 Abs. 1 lit. b DSGVO).</p>
                    </section>
                    <section>
                        <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-sm text-blue-400">7. SSL- bzw. TLS-Verschlüsselung</h3>
                        <p>Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von „http://“ auf „https://“ wechselt.</p>
                    </section>
                    <section>
                        <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-sm text-blue-400">8. Ihre Rechte</h3>
                        <p className="mb-2">Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen folgende Rechte:</p>
                        <ul className="list-disc list-inside bg-slate-950 p-4 border border-slate-800 rounded-lg mb-2">
                            <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
                            <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
                            <li>Recht auf Löschung (Art. 17 DSGVO)</li>
                            <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                            <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
                            <li>Recht auf Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
                        </ul>
                        <p className="mb-2">Wenn die Datenverarbeitung auf Ihrer Einwilligung beruht, haben Sie das Recht, diese Einwilligung jederzeit zu widerrufen.</p>
                        <p className="font-bold text-white mb-2">Beschwerderecht bei der zuständigen Aufsichtsbehörde:</p>
                         <p>Im Falle datenschutzrechtlicher Verstöße steht Ihnen ein Beschwerderecht bei einer Aufsichtsbehörde zu. Zuständig ist in der Regel die Datenschutzbehörde Ihres üblichen Aufenthaltsortes oder des Sitzes unseres Unternehmens.</p>
                    </section>
                    <section>
                        <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-sm text-blue-400">9. Nutzung von Supabase (Datenbank & Authentifizierung)</h3>
                        <p className="mb-2">Für das Vorhalten von Nutzer-Accounts (Registrierung und Login) sowie zur Darstellung von Highscores und Spielerstatistiken (Leaderboards) setzen wir den Dienstleister <strong>Supabase Inc.</strong> (9701 Apollo Dr Suite 399, Largo, MD 20774, USA) ein.</p>
                        <p className="mb-2">Mit der Erstellung eines Accounts verarbeiten wir Daten, um Ihr Profil anzulegen und das Spiel zu ermöglichen. Zur Wahrung Ihrer Privatsphäre setzen wir dabei auf das Prinzip der Datensparsamkeit und Pseudonymität. Welche Daten konkret verarbeitet werden:</p>
                        <ul className="list-disc list-inside bg-slate-950 p-4 border border-slate-800 rounded-lg mb-2">
                            <li>Gewählter Nutzername / Nickname (wird öffentlich im Leaderboard angezeigt)</li>
                            <li>Kryptografisch gehashtes Passwort (wird nicht im Klartext gespeichert)</li>
                            <li>Spieldaten (z. B. Maximales Level, erreichte Punkte, Rekordzeiten)</li>
                        </ul>
                        <p className="mb-2 font-bold text-emerald-400">Wichtiger Hinweis zur Pseudonymität: Wir erheben bewusst KEINE echten E-Mail-Adressen. Um das technische System von Supabase zu nutzen, generiert unsere Anwendung automatisch eine nicht-existente Dummy-E-Mail-Adresse (aus Ihrem Nutzernamen). Wir haben dadurch keine Möglichkeit, Sie außerhalb des Spiels zu kontaktieren, zu tracken oder persönlich zu identifizieren.</p>
                        <p className="mb-2">Rechtsgrundlage hierfür ist die Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO), da diese Daten erforderlich sind, um Ihnen die Nutzung unserer interaktiven Web-Anwendung und des Leaderboard-Systems zu ermöglichen.</p>
                        <p className="mb-2">Die Server, auf denen die Datenbank betrieben wird, befinden sich überwiegend innerhalb der Europäischen Union. Sollte jedoch in manchen Fällen eine Datenübermittlung in die USA oder andere Drittländer stattfinden, stützen wir diese auf die Standardvertragsklauseln der EU-Kommission bzw. auf den Angemessenheitsbeschluss im Rahmen des EU-US Data Privacy Frameworks. Wir haben mit Supabase einen Vertrag zur Auftragsverarbeitung (AVV) geschlossen, in dem sich der Anbieter verpflichtet, die Daten unserer Nutzer gemäß der DSGVO zu schützen.</p>
                        <p>Die Spielerdaten im Leaderboard (Nutzername und Punktehöchststand) sind öffentlich für andere Nutzer der Web-Anwendung sichtbar. Weitere Informationen zum Datenschutz bei Supabase finden Sie unter: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline font-bold">https://supabase.com/privacy</a>.</p>
                    </section>
                    <section>
                        <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-sm text-blue-400">10. Verarbeitung von Präsenzdaten (Online-Spieler)</h3>
                        <p className="mb-2">Unsere Anwendung nutzt die Echtzeit-Funktionen („Realtime Presence“) von Supabase, um eine Anzeige der aktuell online befindlichen Spieler bereitzustellen.</p>
                        <p className="mb-2">Wenn Sie unsere Website öffnen, wird eine Echtzeitverbindung zum Server aufgebaut. Dabei werden folgende Daten temporär erfasst und ggf. an andere Spieler übermittelt:</p>
                        <ul className="list-disc list-inside bg-slate-950 p-4 border border-slate-800 rounded-lg mb-2">
                            <li>Ihr aktueller Verbindungsstatus (Online)</li>
                            <li>Ihr gewählter Nutzername oder „Gast“</li>
                            <li>Ihr aktueller Spielstatus (z. B. im Menü, spielt Level X)</li>
                        </ul>
                        <p className="mb-2">Diese Echtzeitdaten werden ausschließlich flüchtig in der aktiven Verbindungsinstanz (Presence Channel) verarbeitet und für Community-Features genutzt.</p>
                        <p>Die Rechtsgrundlage für die Echtzeit-Verarbeitung von registrierten Spielern ist die Bereitstellung der interaktiven Spielfunktionen und Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO). Sofern Sie die Anwendung als Gast nutzen, erfolgt die (pseudonyme) Verarbeitung auf Basis unseres berechtigten Interesses (Art. 6 Abs. 1 lit. f DSGVO) an einem reibungslosen Community-Erlebnis.</p>
                    </section>
                    <section>
                        <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-sm text-blue-400">11. Speicherung von Spiel-Replays (Ghost-Modus)</h3>
                        <p className="mb-2">Um das „Ghost Challenge“-Feature zu ermöglichen und Highscores zu verifizieren, erfassen und speichern wir Aufzeichnungen (Replays) Ihrer erfolgreichen Spielsitzungen. Diese Daten umfassen:</p>
                        <ul className="list-disc list-inside bg-slate-950 p-4 border border-slate-800 rounded-lg mb-2">
                            <li>Ihre Tasteneingaben (Keystrokes) und deren exaktes Timing während eines Levels</li>
                        </ul>
                        <p>Diese Daten werden bei eingeloggten Nutzern verknüpft mit Ihrem Pseudonym (Nutzername) gespeichert, oder für Gäste anonym abgelegt. Andere Spieler können sich diese Replays ansehen, um gegen Ihre Zeit anzutreten (Ghost-Modus). Die Verarbeitung und Veröffentlichung im Leaderboard erfolgt auf Basis der Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO) bzw. unseres berechtigten Interesses an einem kompetitiven Spielerlebnis (Art. 6 Abs. 1 lit. f DSGVO).</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
