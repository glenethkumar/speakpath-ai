import React, { useState } from 'react';
import { X, Languages, Volume2, ArrowRight, Loader2, Trash2 } from 'lucide-react';
import { SpeechOutputAdapter } from '../modules/speechOutputAdapter';
import supportedLanguages from '../data/supportedLanguages.json';
import { apiUrl } from '../utils/apiConfig';

interface QuickTranslatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferredVoice?: string;
}

export const QuickTranslatorModal: React.FC<QuickTranslatorModalProps> = ({
  isOpen,
  onClose,
  preferredVoice = 'Google UK English Female',
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Hindi');
  const [inputText, setInputText] = useState<string>('');
  const [translation, setTranslation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const speechAdapter = new SpeechOutputAdapter({
    onStart: () => setIsSpeaking(true),
    onEnd: () => setIsSpeaking(false),
    onError: () => setIsSpeaking(false),
  });

  if (!isOpen) return null;

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(apiUrl('/api/translate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          userLanguage: selectedLanguage,
        }),
      });

      const data = await res.json();
      if (data.success && data.translation) {
        setTranslation(data.translation);
      } else {
        setErrorMessage(data.error || 'Translation failed. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Connection error while translating.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeakTranslation = () => {
    if (!translation) return;
    if (isSpeaking) {
      speechAdapter.stop();
      setIsSpeaking(false);
      return;
    }
    speechAdapter.speak(translation, {
      voiceName: preferredVoice,
      langCode: 'en-GB',
      rate: 0.95,
    });
  };

  const handleClear = () => {
    setInputText('');
    setTranslation('');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Quick Phrase Translator</h2>
              <p className="text-xs text-slate-400">Native Language to British English (86 Languages)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Language Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Translate From (Your First Language)
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {supportedLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Input Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Type word or short phrase
              </label>
              <span className="text-xs text-slate-500">{inputText.length} / 1000</span>
            </div>
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder={`Type how to say something in ${selectedLanguage}...`}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none pr-12"
              />
              {inputText && (
                <button
                  onClick={handleClear}
                  className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60"
                  title="Clear text"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleTranslate}
            disabled={isLoading || !inputText.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Translating...
              </>
            ) : (
              <>
                Translate to British English
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
              {errorMessage}
            </div>
          )}

          {/* Result Card */}
          {translation && (
            <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  British English Expression
                </span>
                <button
                  onClick={handleSpeakTranslation}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
                    isSpeaking
                      ? 'bg-purple-500 text-white animate-pulse'
                      : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  {isSpeaking ? 'Playing...' : 'Hear Pronunciation'}
                </button>
              </div>
              <p className="text-base font-medium text-white leading-relaxed">{translation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
