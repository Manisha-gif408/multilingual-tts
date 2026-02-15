
import React, { useState, useRef, useEffect } from 'react';
import { Play, Download, Trash2, Wand2, Languages, Volume2, Info, Loader2, Sparkles, Languages as LangIcon, Search } from 'lucide-react';
import { LANGUAGES, VOICES, TTSHistoryItem, User } from '../types';
import { generateTTS, translateText, decode, decodeAudioData, audioBufferToWav } from '../services/ttsService';
import VoiceVisualizer from '../components/VoiceVisualizer';

interface MainProps {
  user: User;
}

const Main: React.FC<MainProps> = ({ user }) => {
  const [text, setText] = useState('');
  const [translatedPreview, setTranslatedPreview] = useState('');
  const [selectedLang, setSelectedLang] = useState('en');
  const [langSearch, setLangSearch] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');
  const [currentAudio, setCurrentAudio] = useState<{ buffer: AudioBuffer; base64: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const filteredLanguages = LANGUAGES.filter(l => 
    l.name.toLowerCase().includes(langSearch.toLowerCase()) || 
    l.code.toLowerCase().includes(langSearch.toLowerCase())
  );

  const handleConvert = async () => {
    if (!text.trim()) return;
    setError(null);
    setCurrentAudio(null);
    setTranslatedPreview('');
    
    try {
      // Step 1: Translate
      setIsTranslating(true);
      const langName = LANGUAGES.find(l => l.code === selectedLang)?.name || 'English';
      const translated = await translateText(text, langName);
      setTranslatedPreview(translated);
      setIsTranslating(false);

      // Step 2: Generate TTS
      setIsGenerating(true);
      const base64 = await generateTTS(translated, selectedVoice);
      const audioBytes = decode(base64);
      
      if (audioContextRef.current) {
        const buffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
        setCurrentAudio({ buffer, base64 });
        
        // Save to history with user context
        const newItem: TTSHistoryItem = {
          id: Date.now().toString(),
          userEmail: user.email,
          originalText: text,
          translatedText: translated,
          language: selectedLang,
          voice: selectedVoice,
          timestamp: Date.now(),
          audioBase64: base64,
        };
        const existingHistory = JSON.parse(localStorage.getItem('ttsHistory') || '[]');
        localStorage.setItem('ttsHistory', JSON.stringify([newItem, ...existingHistory]));
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during translation or speech generation.');
      setIsTranslating(false);
      setIsGenerating(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlay = () => {
    if (!currentAudio || !audioContextRef.current) return;

    if (isPlaying) {
      sourceRef.current?.stop();
      setIsPlaying(false);
      return;
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = currentAudio.buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => setIsPlaying(false);
    
    sourceRef.current = source;
    source.start(0);
    setIsPlaying(true);
  };

  const handleDownload = () => {
    if (!currentAudio) return;
    const blob = audioBufferToWav(currentAudio.buffer);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-${Date.now()}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clear = () => {
    setText('');
    setTranslatedPreview('');
    setCurrentAudio(null);
    setError(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Sidebar: Languages & Info */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col max-h-[700px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Languages className="text-purple-600" /> Target Language
            </h2>
            <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500 font-bold uppercase">{LANGUAGES.length} Total</span>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Search languages..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              value={langSearch}
              onChange={(e) => setLangSearch(e.target.value)}
            />
          </div>

          <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar space-y-2">
            <div className="grid grid-cols-1 gap-1.5">
              {filteredLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLang(lang.code)}
                  className={`flex items-center justify-between p-3 rounded-xl text-sm transition-all border ${
                    selectedLang === lang.code 
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md' 
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{lang.flag}</span>
                    <span className="font-semibold">{lang.name}</span>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${selectedLang === lang.code ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {lang.code}
                  </span>
                </button>
              ))}
              {filteredLanguages.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">
                  No languages match your search.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
          <div className="relative z-10">
            <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Sparkles size={20} className="text-yellow-400" /> Auto-Translator
            </h2>
            <p className="text-sm opacity-90 leading-relaxed">
              We translate your message instantly into the native script of your selected destination.
            </p>
          </div>
          <div className="absolute -bottom-10 -right-10 opacity-10">
            <Volume2 size={120} />
          </div>
        </div>
      </div>

      {/* Main Converter */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Translate & Speak
            </h1>
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Voice Tone:</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              >
                {VOICES.map(v => (
                  <option key={v.name} value={v.name}>{v.name} ({v.gender})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative mb-6">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Source Text (Any Language)</label>
            <textarea
              className="w-full h-40 md:h-48 p-6 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all resize-none text-lg"
              placeholder="Enter text to translate..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
            />
            <div className="absolute bottom-4 right-4 text-xs text-gray-400">
              {text.length}/1000
            </div>
          </div>

          {translatedPreview && (
            <div className="mb-6 p-5 bg-blue-50 border border-blue-100 rounded-2xl animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-widest mb-2">
                <LangIcon size={14} /> Translation to {LANGUAGES.find(l => l.code === selectedLang)?.name}
              </div>
              <p className="text-gray-800 font-medium italic">"{translatedPreview}"</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-2">
              <Info size={16} /> {error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={handleConvert}
              disabled={isTranslating || isGenerating || !text.trim()}
              className="flex-1 min-w-[240px] bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-purple-200 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-3"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Translating...
                </>
              ) : isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Generating Voice...
                </>
              ) : (
                <>
                  <Wand2 size={20} /> Translate & Generate
                </>
              )}
            </button>
            <button
              onClick={clear}
              className="px-6 py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all flex items-center gap-2"
            >
              <Trash2 size={20} /> Clear
            </button>
          </div>

          {currentAudio && (
            <div className="mt-8 p-6 bg-purple-50 rounded-2xl border border-purple-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-purple-700 uppercase tracking-wider">Audio Playback</span>
                <VoiceVisualizer isPlaying={isPlaying} />
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePlay}
                  className="w-14 h-14 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg hover:bg-purple-700 transition-all hover:scale-105"
                >
                  {isPlaying ? <span className="text-xl font-bold">II</span> : <Play fill="currentColor" size={24} />}
                </button>
                <div className="flex-1 h-3 bg-purple-200 rounded-full overflow-hidden">
                  <div className={`h-full bg-purple-600 transition-all duration-300 ${isPlaying ? 'w-full' : 'w-0'}`} />
                </div>
                <button
                  onClick={handleDownload}
                  className="p-4 rounded-2xl bg-white text-purple-600 hover:bg-purple-100 transition-colors border border-purple-200 shadow-sm"
                  title="Download File"
                >
                  <Download size={24} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default Main;
