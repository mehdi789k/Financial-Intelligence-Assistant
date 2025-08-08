
import React from 'react';
import type { Timezone } from '../types';
import { timezones } from '../data/timezones';
import { Globe } from 'lucide-react';

interface TimezoneSelectorProps {
  timezone: Timezone;
  setTimezone: (timezone: Timezone) => void;
  disabled?: boolean;
}

export const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({ timezone, setTimezone, disabled = false }) => {
  return (
    <div>
      <label htmlFor="timezone" className="block text-sm font-medium text-gray-300 mb-2">
        منطقه زمانی
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 z-10">
          <Globe className="h-5 w-5 text-gray-500" />
        </div>
        <select
          id="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value as Timezone)}
          disabled={disabled}
          className="appearance-none block w-full bg-gray-900/50 border border-gray-600/80 rounded-lg shadow-sm py-3 pr-10 pl-3 focus:outline-none focus:ring-2 focus:ring-sky-500/80 focus:border-sky-500 transition disabled:bg-gray-800/50 disabled:cursor-not-allowed"
        >
          {timezones.map((tz) => (
            <option key={tz.value} value={tz.value} className="bg-gray-800 text-gray-200">
              {tz.label}
            </option>
          ))}
        </select>
      </div>
       <p className="mt-2 text-xs text-gray-500">منطقه زمانی برای نمایش و تحلیل داده‌ها.</p>
    </div>
  );
};