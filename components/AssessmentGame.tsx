
import React, { useState } from 'react';
import { AssessmentDifficulty, AssessmentQuestion } from '../types';
import { generateAssessment } from '../services/geminiService';

declare const confetti: any;

interface AssessmentGameProps {
  words: string[];
}

const AssessmentGame: React.FC<AssessmentGameProps> = ({ words }) => {
  // Setup State
  const [hasStarted, setHasStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<AssessmentDifficulty>('EASY');
  const [questionCount, setQuestionCount] = useState<number>(words.length);
  const [isGenerating, setIsGenerating] = useState(false);

  // Game State
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDropped, setIsDropped] = useState(false);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');

  const currentQuestion = questions[currentIndex];

  const handleStart = async () => {
    if (questionCount <= 0) {
        alert("題目數量必須大於 0");
        return;
    }
    setIsGenerating(true);
    const generatedQuestions = await generateAssessment(words, questionCount, difficulty);
    
    // Randomize the questions
    const shuffledQuestions = [...generatedQuestions].sort(() => Math.random() - 0.5);
    
    setQuestions(shuffledQuestions);
    setHasStarted(true);
    setIsGenerating(false);
  };

  const playSound = (type: 'correct' | 'wrong') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      if (type === 'correct') {
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
      } else {
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(200, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {}
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedWord = e.dataTransfer.getData("text/plain");
    
    if (draggedWord === currentQuestion.targetWord) {
      setIsDropped(true);
      setFeedback('correct');
      playSound('correct');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } else {
      setFeedback('wrong');
      playSound('wrong');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsDropped(false);
      setFeedback('none');
    } else {
      alert("恭喜！已完成所有評估題目。");
      // Optional: Reset to setup
      setHasStarted(false);
      setCurrentIndex(0);
      setIsDropped(false);
      setFeedback('none');
    }
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center gap-6 mt-20 animate-in fade-in">
        <div className="w-20 h-20 border-8 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-indigo-800 text-2xl font-black animate-pulse">🤖 AI 正在出題中...</p>
        <p className="text-gray-500">正在根據「{difficulty === 'EASY' ? '容易' : difficulty === 'MEDIUM' ? '適中' : '困難'}」難度生成 {questionCount} 條題目</p>
      </div>
    );
  }

  // Setup Screen
  if (!hasStarted) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4 animate-in zoom-in-95">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border-b-[10px] border-indigo-200 p-8 md:p-12 text-center">
          <h2 className="text-4xl font-black text-indigo-800 mb-8 tracking-wider">📝 評估設定</h2>
          
          <div className="space-y-8 text-left">
            <div>
              <label className="block text-xl font-bold text-gray-700 mb-4">1. 選擇難易度</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'EASY', label: '容易', sub: '小一至小二' },
                  { id: 'MEDIUM', label: '適中', sub: '小三至小四' },
                  { id: 'HARD', label: '困難', sub: '小五至小六' }
                ].map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setDifficulty(level.id as AssessmentDifficulty)}
                    className={`p-6 rounded-2xl border-4 transition-all relative overflow-hidden group ${
                      difficulty === level.id 
                        ? 'border-indigo-500 bg-indigo-50 shadow-md transform scale-105' 
                        : 'border-gray-100 bg-white hover:border-indigo-200'
                    }`}
                  >
                    <div className="relative z-10">
                        <div className={`text-2xl font-black mb-1 ${difficulty === level.id ? 'text-indigo-700' : 'text-gray-500'}`}>{level.label}</div>
                        <div className="text-sm text-gray-400 font-bold">{level.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xl font-bold text-gray-700 mb-4">2. 題目數量</label>
              <div className="flex items-center gap-4">
                  <input 
                    type="number" 
                    min="1"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value) || 0)}
                    className="w-full text-3xl font-black text-center p-4 border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:outline-none"
                  />
                  <div className="text-gray-400 font-bold whitespace-nowrap">
                      ( 搜尋詞彙: {words.length} 個 )
                  </div>
              </div>
              <p className="mt-2 text-sm text-gray-400 font-bold">* 如題目數量多於搜尋詞彙，AI 將會重複使用詞彙生成不同題目。</p>
            </div>
          </div>

          <button 
            onClick={handleStart}
            className="mt-12 w-full py-5 bg-indigo-600 text-white text-2xl font-black rounded-full shadow-[0_6px_0_#312e81] hover:bg-indigo-700 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
          >
            <span>🚀</span> 開始評估
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) return <div>No questions generated.</div>;

  // Game Screen
  return (
    <div className="w-full max-w-6xl mx-auto p-4 flex flex-col gap-6 animate-in fade-in">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border-b-4 border-indigo-100 shadow-sm">
        <div className="flex items-center gap-3">
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg font-black text-sm">
                {difficulty === 'EASY' ? '容易' : difficulty === 'MEDIUM' ? '適中' : '困難'}
            </span>
            <h2 className="text-xl font-black text-gray-700">題目 {currentIndex + 1} / {questions.length}</h2>
        </div>
        <button onClick={() => setHasStarted(false)} className="text-gray-400 font-bold hover:text-red-500 transition-colors">退出評估</button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Question Area (Main) */}
        <div className="flex-1 w-full">
            <div className="bg-white rounded-[2.5rem] shadow-xl border-4 border-indigo-50 p-8 md:p-12 min-h-[400px] flex flex-col items-center justify-center relative">
                
                {/* Sentence Container: Justified Alignment, Relaxed Spacing */}
                <div className="w-full max-w-4xl leading-[4.5rem] text-justify font-kaiti">
                    <span className="text-3xl md:text-5xl text-gray-800">
                      {currentQuestion.sentenceParts[0]}
                    </span>
                    
                    {/* Drop Zone: Inline Flex to sit on baseline, No transforms */}
                    <div 
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      className={`inline-flex items-center justify-center min-w-[160px] h-[3.2rem] px-4 mx-2 rounded-xl border-b-4 border-dashed transition-all align-bottom
                        ${isDropped 
                          ? 'bg-green-100 border-green-500 text-green-700' 
                          : 'bg-indigo-50 border-indigo-300'
                        }
                      `}
                    >
                      {isDropped ? (
                        <span className="text-3xl md:text-4xl font-black animate-in zoom-in spin-in-1 font-kaiti">{currentQuestion.targetWord}</span>
                      ) : (
                        <span className="text-indigo-200 font-bold text-xl">?</span>
                      )}
                    </div>

                    <span className="text-3xl md:text-5xl text-gray-800">
                      {currentQuestion.sentenceParts[1]}
                    </span>
                </div>

                {/* Feedback */}
                {feedback === 'correct' && (
                    <div className="mt-12 animate-bounce">
                         <div className="bg-green-100 text-green-800 px-8 py-3 rounded-full text-2xl font-black flex items-center gap-2 shadow-sm font-kaiti">
                            <span>🎉</span> 答對了！
                         </div>
                    </div>
                )}
                {feedback === 'wrong' && (
                    <div className="mt-12 animate-shake">
                         <div className="bg-red-100 text-red-600 px-8 py-3 rounded-full text-2xl font-black flex items-center gap-2 shadow-sm font-kaiti">
                            <span>❌</span> 答案不正確，請再試一次！
                         </div>
                    </div>
                )}

                {feedback === 'correct' && (
                    <button 
                    onClick={handleNext}
                    className="mt-8 px-12 py-4 bg-indigo-600 text-white text-2xl font-black rounded-full shadow-[0_6px_0_#312e81] hover:bg-indigo-700 active:translate-y-1 active:shadow-none transition-all flex items-center gap-3 animate-in slide-in-from-bottom-4 font-kaiti"
                    >
                    下一題 ➡
                    </button>
                )}
            </div>
        </div>

        {/* Word Bank (Side) - Always visible */}
        <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-indigo-900 rounded-[2rem] p-6 shadow-xl sticky top-24">
                <h3 className="text-white font-black text-xl mb-6 flex items-center gap-2 border-b border-indigo-700 pb-4 font-kaiti">
                    <span>📦</span> 詞語庫
                </h3>
                <div className="flex flex-wrap gap-3 justify-center">
                    {words.map((word, i) => (
                        <div 
                            key={i}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData("text/plain", word)}
                            className="bg-white text-indigo-900 px-4 py-3 rounded-xl font-bold text-xl cursor-grab active:cursor-grabbing hover:scale-105 active:scale-95 transition-all shadow-[0_4px_0_#c7d2fe] font-kaiti"
                        >
                            {word}
                        </div>
                    ))}
                </div>
                <p className="text-indigo-300 text-xs text-center mt-6 font-bold font-kaiti">
                    請將詞語拖拉至空格中
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentGame;
