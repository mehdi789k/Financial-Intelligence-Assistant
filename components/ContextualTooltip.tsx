import React from 'react';
import { HelpCircle } from 'lucide-react';

interface ContextualTooltipProps {
  text: string;
  children: React.ReactNode;
}

export const ContextualTooltip: React.FC<ContextualTooltipProps> = ({ text, children }) => {
  return (
    <div className="flex items-center gap-2 group relative">
      <span>{children}</span>
      <HelpCircle className="w-4 h-4 text-gray-500 cursor-help transition-colors group-hover:text-sky-400" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 border border-gray-600 rounded-lg shadow-xl text-xs text-gray-300 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-gray-900"></div>
      </div>
    </div>
  );
};
