import React, { useState, useEffect, useMemo } from 'react';
import { WordData, GameMode } from '../types';
import HanziCanvas from './HanziCanvas';
import RadicalModal from './RadicalModal';
import StrokeBreakdown from './StrokeBreakdown';
import { generateWordExplanation } from '../services/geminiService';

declare const cnchar: any;
declare const confetti: any;

interface CharacterCardProps {
  word: string;
  mode: GameMode;
  onStarAdded: () => void;
  onAddWord: (word: string) => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ word, mode, onStarAdded, onAddWord }) => {
  const [data, setData] = useState<WordData | null>(null);
  const [activeCharIndex, setActiveCharIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showRadicalModal, setShowRadicalModal] = useState(false);
  const chars = word.split('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await generateWordExplanation(word);
      setData(res);
      setLoading(false);
    };
    fetchData();
  }, [word]);

  const displayRadical = useMemo(() => {
    const currentChar = chars[activeCharIndex];
    if (!currentChar) return "";
    try {
      const radicalResult = cnchar.radical(currentChar);
      if (radicalResult && radicalResult.length > 0) return radicalResult[0].radical;
    } catch {}
    if (activeCharIndex === 0 && data?.radical) return data.radical;
    return "";
  }, [chars, activeCharIndex, data]);

  const playSound = (type: 'correct' | 'complete' | 'wrong') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      if (type === 'correct') {
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.start(); osc.stop(audioCtx.currentTime + 0.2);
      } else if (type === 'wrong') {
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(200, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start(); osc.stop(audioCtx.currentTime + 0.15);
      } else {
        [440, 554, 659].forEach((f, i) => {
          const o = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          o.connect(g); g.connect(audioCtx.destination);
          o.frequency.value = f;
          g.gain.setValueAtTime(0.1, audioCtx.currentTime + i * 0.1);
          o.start(audioCtx.currentTime + i * 0.1);
          o.stop(audioCtx.currentTime + i * 0.1 + 0.3);
        });
      }
    } catch (e) { console.debug('Audio not supported or blocked'); }
  };

  const handleQuizComplete = () => {
    playSound('complete');
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
    onStarAdded();
  };

  const speak = (lang: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  };

  if (loading) {
    return (
      <div className={`${mode === GameMode.OVERVIEW ? 'w-80' : 'w-full max-w-5xl'} p-8 bg-white rounded-[2.5rem] shadow-xl border-b-8 border-orange-100 animate-pulse`}>
        <div className="h-12 bg-gray-100 rounded-full w-2/3 mb-6"></div>
        <div className="h-64 bg-gray-50 rounded-3xl mb-6"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-100 rounded w-full"></div>
          <div className="h-4 bg-gray-100 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (mode === GameMode.OVERVIEW) {
    return (
      <div className="w-80 p-6 bg-white rounded-[2.5rem] shadow-xl border-b-[6px] border-orange-300 transition-all hover:scale-105">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-4xl font-black text-orange-600 truncate">{word}</h2>
          <button onClick={() => speak('zh-HK')} className="p-2 bg-orange-50 rounded-full border-2 border-orange-200 text-xl">🔊</button>
        </div>
        <div className="flex gap-2 justify-center mb-4">
          {chars.map((char, i) => (
            <HanziCanvas key={i} char={char} type="demo" size={80} showGrid={true} />
          ))}
        </div>
        <div className="p-4 bg-green-50 rounded-2xl border-2 border-green-100">
          <h4 className="text-sm font-black text-green-700 mb-1">📖 解釋</h4>
          <p className="text-sm text-gray-700 line-clamp-3">{data?.definition}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl p-8 md:p-12 bg-white rounded-[3rem] shadow-2xl border-b-[12px] border-orange-300 transition-all no-print relative fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div className="flex items-center gap-6 flex-wrap">
          <h2 className="text-6xl md:text-8xl font-black text-orange-600">{word}</h2>
          <div className="flex gap-2 items-center flex-wrap">
            {data?.pos.map((p, i) => (
              <span key={i} className="px-4 py-1 bg-sky-500 text-white text-lg rounded-full font-black shadow-md">{p}</span>
            ))}
            {displayRadical && (
              <button 
                onClick={() => setShowRadicalModal(true)}
                className="px-4 py-1 bg-red-50 border-2 border-red-200 text-red-600 text-lg rounded-full font-black shadow-md hover:bg-red-100 transition-all flex items-center gap-2"
              >
                部首：{displayRadical} 🔍
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => speak('zh-CN')} className="px-6 py-2 bg-orange-50 text-orange-700 rounded-full border-2 border-orange-200 hover:bg-orange-100 font-black text-lg transition-all">🔊 普通話</button>
          <button onClick={() => speak('zh-HK')} className="px-6 py-2 bg-orange-50 text-orange-700 rounded-full border-2 border-orange-200 hover:bg-orange-100 font-black text-lg transition-all">🔊 粵語</button>
        </div>
      </div>

      <div className="flex gap-3 mb-10 flex-wrap justify-center bg-gray-50 p-4 rounded-3xl border-2 border-gray-100 shadow-inner">
        {chars.map((char, i) => (
          <button
            key={i}
            onClick={() => setActiveCharIndex(i)}
            className={`px-8 py-3 text-3xl font-black rounded-2xl transition-all duration-300 ${
              activeCharIndex === i 
                ? 'bg-orange-500 text-white shadow-xl scale-110' 
                : 'bg-white text-gray-400 border-2 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {char}
          </button>
        ))}
      </div>

      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-orange-500 text-3xl">🔢</span>
          <h3 className="text-2xl font-black text-gray-700">筆劃拆解</h3>
        </div>
        <div key={activeCharIndex} className="tab-content-enter">
            <StrokeBreakdown char={chars[activeCharIndex]} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-orange-50/50 p-8 rounded-[2.5rem] border-4 border-orange-100 shadow-sm">
        <div className="flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black border-l-8 border-orange-500 pl-4 text-orange-800">👀 筆順演示</h3>
            <button 
              onClick={() => setShowGrid(!showGrid)}
              className="px-4 py-1 bg-white border-2 border-gray-200 rounded-full text-sm font-bold text-gray-500 hover:bg-gray-100"
            >
              {showGrid ? '隱藏格線' : '顯示格線'}
            </button>
          </div>
          <div key={activeCharIndex} className="tab-content-enter">
             <HanziCanvas char={chars[activeCharIndex]} type="demo" showGrid={showGrid} />
          </div>
        </div>
        
        <div className="flex flex-col items-center">
          <h3 className="text-2xl font-black border-l-8 border-red-500 pl-4 text-red-800 self-start mb-6">✏️ 學生練習</h3>
          <div key={activeCharIndex} className="tab-content-enter">
            <HanziCanvas 
                char={chars[activeCharIndex]} 
                type="quiz" 
                onComplete={handleQuizComplete} 
                onMistake={() => playSound('wrong')}
                showGrid={showGrid}
            />
          </div>
          <p className="mt-4 text-red-500 font-bold text-lg animate-pulse">請在格內寫字</p>
        </div>
      </div>

      {data && (
        <div className="mt-12 space-y-8">
          <div className="p-8 bg-green-50 rounded-[2.5rem] border-4 border-green-100 shadow-sm">
            <h4 className="text-2xl font-black text-green-700 mb-4 flex items-center gap-3">
              <span>📖</span> 解釋
            </h4>
            <p className="text-2xl leading-relaxed text-gray-700 font-medium">{data.definition}</p>
          </div>
          
          <div className="p-8 bg-amber-50 rounded-[2.5rem] border-4 border-amber-100 shadow-sm">
            <h4 className="text-2xl font-black text-amber-700 mb-4 flex items-center gap-3">
              <span>🗣️</span> 造句練習
            </h4>
            <ul className="space-y-6 text-2xl text-gray-700">
              {data.sentences.map((s, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="mt-2 w-3 h-3 bg-amber-400 rounded-full flex-shrink-0"></span>
                  <div>
                    <span dangerouslySetInnerHTML={{ 
                      __html: s.text.replace(
                        new RegExp(word, 'g'), 
                        `<span class="text-orange-600 font-black underline decoration-4 underline-offset-8">${word}</span><span class="mx-1 inline-block bg-orange-100 text-orange-700 text-base px-2 py-0.5 rounded-lg border border-orange-200 font-bold align-middle transform -translate-y-0.5">${s.posInSentence}</span>`
                      ) 
                    }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {data.etymology && (
            <div className="p-8 bg-purple-50 rounded-[2.5rem] border-4 border-purple-100 shadow-sm">
              <h4 className="text-2xl font-black text-purple-700 mb-4 flex items-center gap-3">
                <span>💡</span> 字源趣事
              </h4>
              <p className="text-xl text-gray-700 italic leading-relaxed bg-white/50 p-6 rounded-3xl">{data.etymology}</p>
            </div>
          )}
        </div>
      )}

      {showRadicalModal && displayRadical && (
        <RadicalModal 
          radical={displayRadical} 
          onClose={() => setShowRadicalModal(false)} 
          onSelectChar={(char) => {
            onAddWord(char);
            setShowRadicalModal(false);
          }}
        />
      )}
    </div>
  );
};

export default CharacterCard;