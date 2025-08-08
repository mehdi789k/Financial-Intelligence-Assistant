
import React from 'react';
import type { Timeframe } from '../types';
import { timeframes } from '../types';
import { Timer } from 'lucide-react';

interface TimeframeSelectorProps {
  timeframe: Timeframe;
  setTimeframe: (timeframe: Timeframe) => void;
  disabled?: boolean;
}

export const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({ timeframe, setTimeframe, disabled = false }) => {
  return (
    <div>
      <label htmlFor="timeframe" className="block text-sm font-medium text-gray-300 mb-2">
        تایم فریم
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 z-10">
          <Timer className="h-5 w-5 text-gray-500" />
        </div>
        <select
          id="timeframe"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as Timeframe)}
          disabled={disabled}
          className="appearance-none block w-full bg-gray-900/50 border border-gray-600/80 rounded-lg shadow-sm py-3 pr-10 pl-3 focus:outline-none focus:ring-2 focus:ring-sky-500/80 focus:border-sky-500 transition disabled:bg-gray-800/50 disabled:cursor-not-allowed"
        >
          {timeframes.map((tf) => (
            <option key={tf} value={tf} className="bg-gray-800 text-gray-200">
              {tf}
            </option>
          ))}
        </select>
      </div>
       <p className="mt-2 text-xs text-gray-500">تایم فریم تحلیل را مشخص کنید.</p>
    </div>
  );
};