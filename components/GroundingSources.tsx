
import React from 'react';
import type { GroundingSource } from '../types';
import { Globe } from 'lucide-react';

interface GroundingSourcesProps {
  sources: GroundingSource[];
}

export const GroundingSources: React.FC<GroundingSourcesProps> = ({ sources }) => {
  const validSources = sources.filter(s => s.web?.uri && s.web?.title);

  if (validSources.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/50 shadow-lg backdrop-blur-sm">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <Globe className="w-6 h-6 ml-2 text-sky-400" />
        منابع استفاده شده در وب
      </h3>
      <ul className="space-y-3">
        {validSources.map((source, index) => (
          <li key={index} className="flex items-start">
            <span className="text-sky-400 mt-1 mr-2">&#8226;</span>
            <a
              href={source.web!.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-300 hover:text-sky-400 transition-colors hover:underline"
            >
              {source.web!.title}
            </a>
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-500 mt-4">
        این تحلیل با استفاده از اطلاعات لحظه‌ای از منابع فوق غنی شده است.
      </p>
    </div>
  );
};