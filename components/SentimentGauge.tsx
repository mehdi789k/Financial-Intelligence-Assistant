import React from 'react';

interface SentimentGaugeProps {
  score: number; // -100 to 100
  text: string;
}

const scoreToAngle = (score: number) => {
  // Map score from [-100, 100] to angle [0, 180]
  return (score + 100) / 200 * 180;
};

const scoreToColor = (score: number) => {
    if (score > 50) return '#10b981'; // Strong Buy / Greed
    if (score > 15) return '#34d399'; // Buy / Greed
    if (score < -50) return '#f43f5e'; // Strong Sell / Fear
    if (score < -15) return '#f87171'; // Sell / Fear
    return '#fbbf24'; // Neutral / Hold
};

export const SentimentGauge: React.FC<SentimentGaugeProps> = ({ score, text }) => {
  const angle = scoreToAngle(score);
  const color = scoreToColor(score);
  
  return (
    <div className="w-full max-w-[250px] mx-auto text-center">
      <div className="relative">
        <svg viewBox="0 0 200 100" className="w-full">
          {/* Background arc */}
          <defs>
            <linearGradient id="sentimentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" /> 
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <path
            d="M 10 100 A 90 90 0 0 1 190 100"
            stroke="url(#sentimentGradient)"
            strokeWidth="20"
            strokeLinecap="round"
            fill="none"
            opacity="0.3"
          />
          {/* Ticks */}
          {[...Array(11)].map((_, i) => {
              const tickAngle = i * 18;
              return (
                 <line
                    key={i}
                    x1="100"
                    y1="10"
                    x2="100"
                    y2="20"
                    stroke="#6b7280"
                    strokeWidth="1.5"
                    transform={`rotate(${tickAngle} 100 100)`}
                 />
              );
          })}
          {/* Needle */}
          <g style={{ transition: 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }} transform={`rotate(${angle} 100 100)`}>
            <polygon points="100,25 96,100 104,100" fill={color} style={{ transition: 'fill 0.5s' }} />
            <circle cx="100" cy="100" r="8" fill={color} stroke="#1f2937" strokeWidth="3" style={{ transition: 'fill 0.5s' }} />
          </g>
        </svg>
      </div>
      <div 
        className="w-full text-center text-2xl font-bold -mt-4" 
        style={{ color: color, transition: 'color 0.5s' }}
      >
        {text}
      </div>
       <div className="flex justify-between text-xs text-gray-500 mt-2 px-2">
            <span>ترس شدید</span>
            <span>طمع شدید</span>
        </div>
    </div>
  );
};