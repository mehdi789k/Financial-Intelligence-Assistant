
import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center my-16 animate-fade-in">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-2 border-sky-500/30 rounded-full animate-ping"></div>
        <div className="absolute inset-2 border-2 border-emerald-500/30 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-emerald-400 rounded-full shadow-lg shadow-sky-500/50 animate-pulse"></div>
        </div>
      </div>
      <p className="mt-6 text-lg text-gray-300">هوش مصنوعی در حال تحلیل است...</p>
      <p className="text-sm text-gray-500">این فرآیند ممکن است چند لحظه طول بکشد.</p>
    </div>
  );
};