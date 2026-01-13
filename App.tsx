
import React, { useState, useEffect, useRef } from 'react';
import CharacterCard from './components/CharacterCard';
import Worksheet from './components/Worksheet';
import AssessmentGame from './components/AssessmentGame';
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
  const [showWorksheet, setShowWorksheet] = useState(false);
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

  const handleReset = () => {
    setInputText('');
    setWords([]);
    setStars(0);
    window.location.hash = '';
    setMode(GameMode.NORMAL);
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

  // If in worksheet mode, render only the worksheet component
  if (showWorksheet) {
    return <Worksheet words={words} onClose={() => setShowWorksheet(false)} />;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <header className="sticky top-4 z-50 w-full max-w-6xl bg-white/90 backdrop-blur-md rounded-full shadow-lg border-2 border-orange-100 p-2 mb-8 flex flex-wrap justify-between items-center px-6 no-print">
        <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-black text-orange-500 tracking-wider hidden md:block font-kaiti">📘 中文識字通 AI</h1>
            <div className="flex gap-2">
                <button 
                  onClick={() => setMode(mode === GameMode.OVERVIEW ? GameMode.NORMAL : GameMode.OVERVIEW)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all border-2 font-kaiti ${mode === GameMode.OVERVIEW ? 'bg-green-500 text-white border-green-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                >
                  全覽
                </button>
                <button 
                  onClick={() => setMode(mode === GameMode.ASSESSMENT ? GameMode.NORMAL : GameMode.ASSESSMENT)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all border-2 font-kaiti ${mode === GameMode.ASSESSMENT ? 'bg-green-500 text-white border-green-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                >
                  評估
                </button>
            </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 mt-2 md:mt-0">
          <button 
            onClick={() => setShowWorksheet(true)}
            className="px-4 py-1.5 md:px-6 md:py-2 text-sm md:text-base bg-gray-800 text-white rounded-full font-bold hover:bg-gray-900 transition-all shadow-md flex items-center gap-2 font-kaiti"
          >
             <span>🖨️</span> 列印
          </button>
          <div className="flex items-center gap-2 bg-white border-2 border-yellow-400 px-4 py-1 rounded-full font-black text-yellow-600 shadow-sm">
            <span className="animate-bounce">⭐</span> <span>{stars}</span>
          </div>
        </div>
      </header>

      {/* Input Section - Significantly Reduced Size */}
      <div className="w-full max-w-2xl bg-white p-5 rounded-[1.5rem] shadow-lg border-2 border-orange-200 mb-8 no-print transform transition-all hover:scale-[1.005]">
        <label className="block text-lg font-black text-orange-800 mb-3 text-center tracking-wide font-kaiti">
          請輸入生字或詞語
        </label>
        
        <div className="flex flex-col gap-3">
          <textarea 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            rows={1}
            className="w-full text-lg px-4 py-2 border border-orange-200 rounded-xl text-center focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all font-bold text-gray-700 resize-none shadow-inner placeholder-orange-200 leading-relaxed font-kaiti"
            placeholder="在此輸入課文內容或詞語..."
          />
          
          <div className="flex justify-center gap-3">
            <button 
              onClick={() => handleGenerate()}
              className="px-6 py-2 bg-orange-500 text-white text-base font-bold rounded-full shadow-[0_3px_0_#E65100] active:translate-y-0.5 active:shadow-none hover:bg-orange-600 transition-all flex items-center gap-2 font-kaiti"
            >
              <span>🔍</span> 開始學習
            </button>
            <button 
               onClick={handleReset} 
               className="px-6 py-2 bg-red-100 text-red-600 border border-red-200 text-base font-bold rounded-full hover:bg-red-200 transition-all flex items-center gap-2 font-kaiti"
            >
               <span>↺</span> 重置
            </button>
            <button 
               onClick={generateQR} 
               className="px-5 py-2 bg-white text-orange-600 border border-orange-200 text-base font-bold rounded-full hover:bg-orange-50 transition-all font-kaiti"
            >
               📲 分享
            </button>
          </div>
        </div>

        {showQR && (
          <div className="mt-4 flex flex-col items-center p-4 bg-orange-50 rounded-xl border-2 border-dashed border-orange-200 fade-in animate-in slide-in-from-top-4">
            <div ref={qrcodeRef} className="bg-white p-2 rounded-lg shadow-sm mb-2 scale-90"></div>
            <button onClick={() => setShowQR(false)} className="mt-2 px-4 py-1 bg-gray-200 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-300 font-kaiti">關閉</button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center gap-6 mt-12 no-print">
          <div className="w-24 h-24 border-8 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-orange-600 font-black text-3xl animate-pulse font-kaiti">⏳ AI 正在準備教材...</p>
        </div>
      ) : (
        <>
          {mode === GameMode.ASSESSMENT ? (
            <AssessmentGame words={words} />
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
              {words.length === 0 && !isLoading && (
                <div className="text-center text-gray-400 mt-10">
                  <p className="text-xl font-kaiti">👆 請在上方輸入文字開始</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <footer className="mt-auto py-12 text-center no-print">
        <div className="text-gray-400 font-bold font-kaiti">© 2025 中文識字通 AI | 課堂實戰版 V18.7</div>
        <div className="mt-2 text-gray-500 font-bold font-kaiti">順德聯誼總會李金小學 曾偉倫老師設計</div>
      </footer>
    </div>
  );
};

export default App;
