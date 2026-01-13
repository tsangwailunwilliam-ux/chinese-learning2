
import React from 'react';
import StrokeBreakdown from './StrokeBreakdown';

interface WorksheetProps {
  words: string[];
  onClose: () => void;
}

const Worksheet: React.FC<WorksheetProps> = ({ words, onClose }) => {
  return (
    <div className="min-h-screen bg-white text-black p-0 md:p-8">
      {/* Control Bar - Hidden when printing */}
      <div className="no-print fixed top-0 left-0 right-0 bg-white/90 backdrop-blur border-b border-gray-200 p-4 flex justify-between items-center shadow-md z-50">
        <h2 className="text-xl font-black text-gray-800 font-kaiti">🖨️ 作業紙預覽</h2>
        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full font-bold hover:bg-gray-200 transition-all font-kaiti"
          >
            返回練習
          </button>
          <button 
            onClick={() => window.print()}
            className="px-6 py-2 bg-orange-500 text-white rounded-full font-bold hover:bg-orange-600 transition-all shadow-md flex items-center gap-2 font-kaiti"
          >
            <span>🖨️</span> 確認列印
          </button>
        </div>
      </div>

      <div className="max-w-[210mm] mx-auto bg-white pt-20 md:pt-10 print:pt-0 print:w-full">
        <div className="text-center border-b-2 border-black pb-4 mb-8 print:mb-4">
          <h1 className="text-3xl font-black tracking-widest font-kaiti">中文生詞練習</h1>
          <div className="mt-4 flex justify-between text-lg font-kaiti">
            <span>姓名：________________</span>
            <span>日期：________________</span>
            <span>班別：________________</span>
          </div>
        </div>

        {words.length === 0 && (
          <div className="text-center text-gray-400 py-20 font-kaiti">請先在主頁面輸入並生成生詞</div>
        )}

        <div className="space-y-8 print:space-y-6">
          {words.map((word, wordIndex) => (
            <div key={wordIndex} className="break-inside-avoid border-b-2 border-gray-800 pb-8 mb-6 print:pb-4">
              <div className="flex items-center gap-3 mb-6 print:mb-4 bg-gray-100 p-2 rounded-lg print:bg-transparent print:p-0">
                 <span className="flex items-center justify-center w-8 h-8 bg-black text-white rounded-full font-bold text-sm print:border print:border-black print:text-black print:bg-transparent font-kaiti">
                   {wordIndex + 1}
                 </span>
                 <h3 className="text-2xl font-bold font-kaiti">詞語：{word}</h3>
              </div>

              <div className="flex flex-col gap-6 print:gap-4 pl-0 md:pl-4">
                {/* Section 1: Stroke Analysis */}
                <div className="flex flex-col gap-4">
                  {word.split('').map((char, charIndex) => (
                    <div key={charIndex} className="flex items-start gap-4">
                      {/* Large Reference Char */}
                      <div className="w-20 h-20 border-2 border-black flex items-center justify-center bg-gray-50 flex-shrink-0">
                         <span className="text-5xl font-kaiti">{char}</span>
                      </div>
                      
                      {/* Stroke Breakdown */}
                      <div className="flex-1">
                        <div className="mb-1 text-xs font-bold text-gray-500 font-kaiti">筆順：</div>
                        <StrokeBreakdown char={char} isPrint={true} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Section 2: Writing Practice (Grouped by Word) */}
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-2">
                     <span className="text-sm font-bold bg-black text-white px-2 py-0.5 rounded print:border print:border-black print:text-black print:bg-white font-kaiti">書寫練習</span>
                     <span className="text-xs text-gray-500 font-kaiti">(請將詞語連著寫)</span>
                  </div>
                  
                  {/* Practice Grids Container */}
                  <div className="flex flex-wrap gap-y-3 gap-x-6">
                    {/* Generate multiple instances of the word for practice */}
                    {/* We render 10 repetitions or until space fills (flex-wrap handles layout) */}
                    {[...Array(10)].map((_, groupIndex) => (
                      <div key={groupIndex} className="flex gap-1">
                        {word.split('').map((char, charIndex) => (
                          <div 
                            key={charIndex} 
                            className="w-16 h-16 border border-gray-400 hanzi-grid relative flex items-center justify-center overflow-hidden"
                          >
                            {/* Optional: Add gray trace for the first group */}
                            {groupIndex === 0 && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
                                <span className="text-6xl font-thin font-kaiti">{char}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center text-xs text-gray-400 font-kaiti print:block hidden">
          由「中文識字通 AI」生成
        </div>
      </div>
    </div>
  );
};

export default Worksheet;
