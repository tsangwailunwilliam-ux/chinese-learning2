import React, { useState, useEffect, useRef } from 'react';
import CharacterCard from './components/CharacterCard';
import { GameMode } from './types';
import { segmentText } from './services/geminiService';

declare const QRCode: any;

const App: React.FC = () => {
  const [inputText, setInputText] = useState('打掃');
  const [words, setWords] = useState<string[]>([]);
  const [stars, setStars] = useState(0);
  const [mode, setMode] = useState<GameMode>(GameMode.NORMAL);
  const [isLoading, setIsLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const qrcodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace('#', ''));
    const q = params.get('q');
    if (q) {
      const decoded = decodeURIComponent(q);
      setInputText(decoded);
      handleGenerate(decoded);
    }
  }, []);

  const handleGenerate = async (textToUse?: string) => {
    const text = textToUse || inputText.trim();
    if (!text) return;
    
    setIsLoading(true);
    let segments: string[] = [];
    
    try {
      // 使用 AI 進行智能分詞
      segments = await segmentText(text);
      
      // 過濾掉空字串或非中文字元
      segments = segments.filter(s => s.trim().length > 0 && /[\u4e00-\u9fa5]/.test(s));
    } catch (e) {
      console.error("AI 分詞失敗，使用備用方案", e);
      // Fallback: 如果 AI 失敗，使用簡單分割
      segments = text.split(/[、，；。 \n]/).filter(s => s.length > 0 && /[\u4e00-\u9fa5]/.test(s));
    }
    
    setWords(segments);
    setIsLoading(false);
    window.location.hash = `q=${encodeURIComponent(text)}`;
  };

  const generateQR = () => {
    setShowQR(true);
    setTimeout(() => {
      if (qrcodeRef.current) {
        qrcodeRef.current.innerHTML = '';
        new QRCode(qrcodeRef.current, {
          text: window.location.href,
          width: 200,
          height: 200,
          colorDark: "#E65100",
          colorLight: "#ffffff",
        });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <header className="sticky top-4 z-50 w-full max-w-6xl bg-white/90 backdrop-blur-md rounded-full shadow-lg border-2 border-orange-100 p-3 mb-10 flex flex-wrap justify-between items-center px-8 no-print">
        <h1 className="text-2xl font-black text-orange-500 tracking-wider">📘 中文識字通 AI</h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setMode(mode === GameMode.NORMAL ? GameMode.OVERVIEW : GameMode.NORMAL)}
            className={`px-6 py-2 rounded-full font-bold transition-all ${mode === GameMode.OVERVIEW ? 'bg-orange-500 text-white shadow-md' : 'border-2 border-orange-400 text-orange-500 hover:bg-orange-50'}`}
          >
            {mode === GameMode.OVERVIEW ? '👁️ 全覽模式：開' : '👁️ 全覽模式：關'}
          </button>
          <button 
            onClick={() => window.print()}
            className="px-6 py-2 bg-gray-800 text-white rounded-full font-bold hover:bg-gray-900 transition-all shadow-md"
          >
            🖨️ 列印作業紙
          </button>
          <div className="flex items-center gap-2 bg-white border-2 border-yellow-400 px-5 py-1.5 rounded-full font-black text-yellow-600 shadow-sm">
            <span className="animate-bounce">⭐</span> <span>{stars}</span>
          </div>
        </div>
      </header>

      <div className="w-full max-w-2xl bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-orange-200 mb-12 no-print">
        <label className="block text-2xl font-black text-orange-700 mb-6 text-center">請輸入生字或詞語</label>
        <div className="flex flex-col sm:flex-row gap-4">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            className="flex-1 text-2xl px-6 py-4 border-4 border-orange-50 rounded-2xl text-center focus:border-orange-500 focus:outline-none transition-all font-bold"
            placeholder="例如：熱烈 努力 (或：中文開發土耳其)"
          />
          <button 
            onClick={() => handleGenerate()}
            className="px-10 py-4 bg-orange-500 text-white text-2xl font-black rounded-2xl shadow-[0_6px_0_#E65100] active:translate-y-1 active:shadow-none transition-all"
          >
            🔍 開始
          </button>
        </div>
        <div className="mt-6 flex justify-center">
          <button onClick={generateQR} className="text-orange-600 font-bold hover:underline">📲 生成分享 QR Code</button>
        </div>
        {showQR && (
          <div className="mt-6 flex flex-col items-center p-6 bg-orange-50 rounded-3xl border-4 border-dashed border-orange-200 fade-in">
            <div ref={qrcodeRef} className="bg-white p-3 rounded-2xl shadow-sm mb-4"></div>
            <p className="font-black text-orange-800">讓學生掃描即可同步練習</p>
            <button onClick={() => setShowQR(false)} className="mt-3 text-xs text-gray-500 hover:underline">關閉</button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center gap-6 mt-12 no-print">
          <div className="w-20 h-20 border-8 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-orange-600 font-black text-2xl animate-pulse">⏳ AI 正在準備教材...</p>
        </div>
      ) : (
        <div className={`w-full max-w-7xl flex gap-10 mb-20 ${mode === GameMode.OVERVIEW ? 'flex-row flex-wrap justify-center items-stretch' : 'flex-col items-center'}`}>
          {words.map((w, i) => (
            <CharacterCard 
              key={w + i} 
              word={w} 
              mode={mode}
              onStarAdded={() => setStars(s => s + 1)} 
              onAddWord={(newWord) => setWords(prev => [newWord, ...prev])}
            />
          ))}
        </div>
      )}

      <footer className="mt-auto py-12 text-gray-400 font-bold text-center no-print">
        © 2025 中文識字通 AI | 課堂實戰版 V18.2
      </footer>
    </div>
  );
};

export default App;