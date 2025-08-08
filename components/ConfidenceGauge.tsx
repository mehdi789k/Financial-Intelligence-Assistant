
import React from 'react';

interface ConfidenceGaugeProps {
  value: number; // 0-100
}

export const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({ value }) => {
  const normalizedValue = Math.max(0, Math.min(100, value));
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;

  const getColor = (val: number) => {
    if (val > 75) return '#34d399'; // Emerald
    if (val > 40) return '#fbbf24'; // Amber
    return '#f87171'; // Red
  };

  const color = getColor(normalizedValue);

  return (
    <div className="relative h-24 w-24 mx-auto mt-2">
      <svg className="w-full h-full" viewBox="0 0 120 120">
        <circle
          className="text-gray-700/50"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
        />
        <circle
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="url(#confidenceGradient)"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
        />
         <defs>
            <linearGradient id="confidenceGradient" gradientTransform="rotate(90)">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="40%" stopColor="#fbbf24" />
                <stop offset="75%" stopColor="#34d399" />
            </linearGradient>
        </defs>
        <text
          x="60"
          y="65"
          className="text-2xl font-bold"
          textAnchor="middle"
          fill={color}
          style={{ transition: 'fill 0.5s ease-in-out' }}
        >
          {`${normalizedValue}%`}
        </text>
      </svg>
    </div>
  );
};