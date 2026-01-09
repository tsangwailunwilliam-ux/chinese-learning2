
import React, { useEffect, useState } from 'react';

interface StrokeBreakdownProps {
  char: string;
  isPrint?: boolean;
}

export const fetchCharData = async (char: string) => {
  const url = `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(char)}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return await res.json();
};

const StrokeBreakdown: React.FC<StrokeBreakdownProps> = ({ char, isPrint = false }) => {
  const [strokes, setStrokes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await fetchCharData(char);
        setStrokes(data.strokes);
      } catch (e) {
        console.error("Stroke fetch error:", e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [char]);

  if (loading) {
    return <div className="text-gray-400 text-sm animate-pulse">⏳ 正在載入筆劃...</div>;
  }

  if (error) {
    return <div className="text-red-400 text-sm">❌ 無法載入資料</div>;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${isPrint ? 'justify-start' : 'justify-center py-4 bg-white/50 rounded-xl border border-orange-100/50'}`}>
      {strokes.map((_, i) => (
        <div 
          key={i} 
          className={`relative bg-white border flex items-center justify-center overflow-hidden rounded-md
            ${isPrint ? 'w-12 h-12 border-black border-2' : 'w-14 h-14 md:w-16 md:h-16 border-gray-200'}
            ${!isPrint && i === strokes.length - 1 ? 'border-orange-400 ring-2 ring-orange-100' : ''}`}
        >
          <svg viewBox="0 0 1024 1024" className="w-full h-full">
            <g transform="scale(1, -1) translate(0, -900)">
              {strokes.slice(0, i + 1).map((path, j) => (
                <path
                  key={j}
                  d={path}
                  fill={j === i ? (isPrint ? '#000000' : '#FF9800') : '#555555'}
                />
              ))}
            </g>
          </svg>
          <span className={`absolute bottom-0 right-1 font-bold ${isPrint ? 'text-[8px] text-gray-800' : 'text-[9px] text-gray-300'}`}>
            {i + 1}
          </span>
        </div>
      ))}
    </div>
  );
};

export default StrokeBreakdown;
