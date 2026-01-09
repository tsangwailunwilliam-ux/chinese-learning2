
import React, { useState, useEffect } from 'react';
import { getRadicalExamples } from '../services/geminiService';

interface RadicalModalProps {
  radical: string;
  onClose: () => void;
  onSelectChar: (char: string) => void;
}

const RadicalModal: React.FC<RadicalModalProps> = ({ radical, onClose, onSelectChar }) => {
  const [examples, setExamples] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExamples = async () => {
      setLoading(true);
      const res = await getRadicalExamples(radical);
      setExamples(res);
      setLoading(false);
    };
    fetchExamples();
  }, [radical]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border-4 border-orange-200 overflow-hidden">
        <div className="p-6 border-b border-orange-100 flex justify-between items-center bg-orange-50">
          <h3 className="text-2xl font-bold text-orange-800 flex items-center gap-2">
            🔍 部首字例：<span className="text-4xl text-red-500 font-serif">{radical}</span>
          </h3>
          <button onClick={onClose} className="text-3xl text-gray-400 hover:text-gray-600">×</button>
        </div>
        
        <div className="p-8">
          {loading ? (
            <div className="flex flex-col items-center py-10 gap-3">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-orange-600 font-medium">正在尋找關聯字...</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {examples.map((char, i) => (
                <button
                  key={i}
                  onClick={() => onSelectChar(char)}
                  className="h-16 flex items-center justify-center text-3xl font-serif bg-orange-50 rounded-xl border border-orange-100 hover:bg-orange-500 hover:text-white hover:scale-110 transition-all shadow-sm"
                >
                  {char}
                </button>
              ))}
              {examples.length === 0 && (
                <p className="col-span-4 text-center text-gray-400 py-10">未找到相關字例</p>
              )}
            </div>
          )}
          <p className="mt-6 text-center text-sm text-gray-400">點擊字例可將其加入練習清單</p>
        </div>
      </div>
    </div>
  );
};

export default RadicalModal;
