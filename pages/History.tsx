
import React, { useState, useEffect, useRef } from 'react';
import { Play, Trash2, Search, Calendar, User as UserIcon, Download, Info, Clock, RotateCcw, Languages as LangIcon } from 'lucide-react';
import { TTSHistoryItem, LANGUAGES, User } from '../types';
import { decode, decodeAudioData, audioBufferToWav } from '../services/ttsService';
import VoiceVisualizer from '../components/VoiceVisualizer';

interface HistoryProps {
  user: User;
}

const History: React.FC<HistoryProps> = ({ user }) => {
  const [history, setHistory] = useState<TTSHistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const allHistory: TTSHistoryItem[] = JSON.parse(localStorage.getItem('ttsHistory') || '[]');
    const userHistory = allHistory.filter(item => item.userEmail === user.email);
    setHistory(userHistory);
    
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    return () => {
      audioContextRef.current?.close();
    };
  }, [user.email]);

  const deleteItem = (id: string) => {
    const allHistory: TTSHistoryItem[] = JSON.parse(localStorage.getItem('ttsHistory') || '[]');
    const updatedGlobal = allHistory.filter(item => item.id !== id);
    localStorage.setItem('ttsHistory', JSON.stringify(updatedGlobal));
    
    const updatedUserHistory = history.filter(item => item.id !== id);
    setHistory(updatedUserHistory);
  };

  const clearHistory = () => {
    if (!window.confirm("Are you sure you want to clear your entire conversion history?")) return;
    
    const allHistory: TTSHistoryItem[] = JSON.parse(localStorage.getItem('ttsHistory') || '[]');
    const otherUsersHistory = allHistory.filter(item => item.userEmail !== user.email);
    localStorage.setItem('ttsHistory', JSON.stringify(otherUsersHistory));
    setHistory([]);
  };

  const playItem = async (item: TTSHistoryItem) => {
    if (playingId === item.id) {
      sourceRef.current?.stop();
      setPlayingId(null);
      return;
    }

    if (!audioContextRef.current) return;

    try {
      const audioBytes = decode(item.audioBase64);
      const buffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setPlayingId(null);
      
      sourceRef.current = source;
      source.start(0);
      setPlayingId(item.id);
    } catch (err) {
      console.error("Playback failed", err);
    }
  };

  const downloadItem = async (item: TTSHistoryItem) => {
    if (!audioContextRef.current) return;
    const audioBytes = decode(item.audioBase64);
    const buffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
    const blob = audioBufferToWav(buffer);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-${item.id}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredHistory = history.filter(item => 
    item.originalText.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.translatedText.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.language.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-purple-600 font-bold uppercase tracking-widest text-xs">
            <Clock size={14} /> GlobalVoice Cloud
          </div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            Your Recordings
            <span className="text-sm font-medium bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
              {history.length} items
            </span>
          </h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by text, language..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="p-3 rounded-2xl bg-white border border-gray-100 text-red-500 hover:bg-red-50 transition-all shadow-sm flex items-center gap-2 text-sm font-semibold"
            >
              <RotateCcw size={18} /> Clear All
            </button>
          )}
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-50 text-purple-200 rounded-3xl mb-6">
            <Clock size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">No recordings found</h3>
          <p className="text-gray-500 mt-2 max-w-xs mx-auto">
            {searchTerm ? "Try adjusting your search filters." : "Start converting text to speech on the home page to see them here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHistory.map((item) => {
            const langObj = LANGUAGES.find(l => l.code === item.language);
            const isThisPlaying = playingId === item.id;
            
            return (
              <div 
                key={item.id} 
                className={`bg-white rounded-3xl p-6 shadow-sm border transition-all duration-300 group hover:shadow-xl hover:-translate-y-1 ${
                  isThisPlaying ? 'border-purple-300 ring-2 ring-purple-50' : 'border-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl bg-gray-50 w-12 h-12 flex items-center justify-center rounded-2xl">
                      {langObj?.flag || '🌐'}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{langObj?.name || item.language}</h4>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 uppercase tracking-widest font-black">
                        <UserIcon size={10} /> {item.voice}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Original Text</div>
                  <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 line-clamp-2 italic border border-gray-100">
                    "{item.originalText}"
                  </div>
                  
                  <div className="text-[10px] text-blue-400 uppercase font-black tracking-widest flex items-center gap-1">
                    <LangIcon size={10} /> Translated
                  </div>
                  <div className="bg-blue-50/50 rounded-xl p-3 min-h-[60px] line-clamp-3 text-sm text-gray-800 leading-relaxed font-semibold border border-blue-50">
                    "{item.translatedText}"
                  </div>
                  
                  {isThisPlaying && (
                    <div className="pt-2">
                      <VoiceVisualizer isPlaying={true} />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => playItem(item)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all ${
                      isThisPlaying 
                        ? 'bg-purple-600 text-white shadow-purple-200' 
                        : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                    }`}
                  >
                    {isThisPlaying ? (
                      <>Stop</>
                    ) : (
                      <>
                        <Play size={16} fill="currentColor" /> Play
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => downloadItem(item)}
                    className="p-3 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors shadow-sm"
                    title="Download"
                  >
                    <Download size={18} />
                  </button>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(item.timestamp).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Info size={12} />
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;
