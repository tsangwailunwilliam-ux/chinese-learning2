
import React, { useEffect, useRef } from 'react';

declare const HanziWriter: any;

interface HanziCanvasProps {
  char: string;
  type: 'demo' | 'quiz';
  size?: number;
  onComplete?: () => void;
  onMistake?: () => void;
  showGrid?: boolean;
}

const HanziCanvas: React.FC<HanziCanvasProps> = ({ 
  char, 
  type, 
  size = 260, 
  onComplete, 
  onMistake, 
  showGrid = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    writerRef.current = HanziWriter.create(containerRef.current, char, {
      width: size,
      height: size,
      padding: size * 0.05,
      showOutline: true,
      strokeAnimationSpeed: 1.2,
      delayBetweenStrokes: 150,
      strokeColor: '#5D4037',
      highlightColor: '#4CAF50',
      outlineColor: '#DDD',
      drawingWidth: size * 0.08,
      showHintAfterMisses: 3 // Default behavior
    });

    if (type === 'quiz') {
      writerRef.current.quiz({
        onComplete: () => {
          if (onComplete) onComplete();
        },
        onMistake: () => {
          if (onMistake) onMistake();
        }
      });
    }

    return () => {
      if (writerRef.current) {
        writerRef.current.target.innerHTML = '';
      }
    };
  }, [char, type, size]);

  const handleAnimate = () => {
    if (writerRef.current && type === 'demo') {
      writerRef.current.animateCharacter();
    }
  };

  const handleReset = () => {
    if (writerRef.current && type === 'quiz') {
      writerRef.current.quiz({
        onComplete: () => {
          if (onComplete) onComplete();
        },
        onMistake: () => {
          if (onMistake) onMistake();
        }
      });
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div 
        ref={containerRef} 
        style={{ width: size, height: size }}
        className={`bg-white rounded-3xl border-4 border-orange-400 shadow-xl relative transition-all ${showGrid ? 'hanzi-grid' : ''}`}
      />
      <div className="mt-4 flex gap-3 no-print">
        {type === 'demo' ? (
          <button 
            onClick={handleAnimate}
            className="px-8 py-2 bg-orange-500 text-white rounded-full font-black shadow-[0_4px_0_#E65100] hover:bg-orange-600 active:translate-y-1 active:shadow-none transition-all"
          >
            ▶ 播放動畫
          </button>
        ) : (
          <button 
            onClick={handleReset}
            className="px-8 py-2 bg-red-100 text-red-600 border-2 border-red-200 rounded-full font-black hover:bg-red-200 transition-all"
          >
            ↺ 重寫
          </button>
        )}
      </div>
    </div>
  );
};

export default HanziCanvas;
