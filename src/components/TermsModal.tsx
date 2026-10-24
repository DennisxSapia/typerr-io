import React from 'react';
import { X } from 'lucide-react';
import { Language, TRANSLATIONS } from '../lib/i18n';

interface TermsModalProps {
  language: Language;
  onClose: () => void;
}

export function TermsModal({ language, onClose }: TermsModalProps) {
  const t = TRANSLATIONS[language];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-slate-900 border border-blue-500/30 rounded-2xl p-6 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span className="text-blue-500">📜</span> {t.termsTitle}
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 pb-4 text-sm text-slate-300 space-y-4 custom-scrollbar">
          <div>
            <h3 className="text-blue-400 font-bold mb-1">{t.terms1Title}</h3>
            <p className="leading-relaxed whitespace-pre-wrap">{t.terms1Desc}</p>
          </div>

          <div>
            <h3 className="text-blue-400 font-bold mb-1">{t.terms2Title}</h3>
            <p className="leading-relaxed">
              {t.terms2Desc}
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>{t.terms2L1}</li>
              <li>{t.terms2L2}</li>
              <li>{t.terms2L3}</li>
            </ul>
            <p className="leading-relaxed mt-2">
              {t.terms2Outro}
            </p>
          </div>

          <div>
            <h3 className="text-blue-400 font-bold mb-1">{t.terms3Title}</h3>
            <p className="leading-relaxed">
              {t.terms3Desc1}
              <br /><br />
              <strong className="text-red-400 font-bold">{t.terms3Important}</strong> {t.terms3Desc2}
            </p>
          </div>

          <div>
            <h3 className="text-blue-400 font-bold mb-1">{t.terms4Title}</h3>
            <p className="leading-relaxed">
              {t.terms4Desc}
            </p>
          </div>

          <div>
            <h3 className="text-blue-400 font-bold mb-1">{t.terms5Title}</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t.terms5L1}</li>
              <li>{t.terms5L2}</li>
              <li>{t.terms5L3}</li>
            </ul>
            <p className="leading-relaxed mt-2 text-red-400/90 font-medium">
              {t.terms5Outro}
            </p>
          </div>

          <div>
            <h3 className="text-blue-400 font-bold mb-1">{t.terms6Title}</h3>
            <p className="leading-relaxed">
              {t.terms6Desc}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
          >
            {t.understood}
          </button>
        </div>
      </div>
    </div>
  );
}
