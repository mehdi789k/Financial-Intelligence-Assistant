
import React from 'react';
import { X, TrendingUp, BarChart, FileText } from 'lucide-react';
import type { HotSymbol } from '../types';

interface SymbolHotlistModalProps {
  isOpen: boolean;
  symbolData: HotSymbol | null;
  onClose: () => void;
  onAnalyze: (symbol: string) => void;
}

export const SymbolHotlistModal: React.FC<SymbolHotlistModalProps> = ({ isOpen, symbolData, onClose, onAnalyze }) => {
  if (!isOpen || !symbolData) {
    return null;
  }

  const handleAnalyzeClick = () => {
      onAnalyze(symbolData.symbol);
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex justify-center items-start z-[70] animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700 w-full max-w-2xl p-6 my-8 animate-slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 border-b border-gray-700/70 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-sky-300 flex items-center gap-3">
              {symbolData.symbol}
            </h2>
            <p className="text-gray-400 text-sm">{symbolData.name}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
            <div className="bg-gray-900/30 p-4 rounded-xl border border-gray-700/50">
                <h4 className="text-lg font-semibold mb-3 flex items-center text-amber-300">
                    <BarChart className="w-5 h-5 ml-2" />
                    متریک‌های کلیدی
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    {symbolData.keyMetrics.map((metric, index) => (
                        <div key={index} className="bg-gray-800/50 p-3 rounded-lg text-center">
                            <p className="text-gray-400 text-xs">{metric.metric}</p>
                            <p className="font-bold text-gray-100 mt-1">{metric.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-gray-900/30 p-4 rounded-xl border border-gray-700/50">
                <h4 className="text-lg font-semibold mb-3 flex items-center text-sky-300">
                    <FileText className="w-5 h-5 ml-2" />
                    تحلیل و چشم‌انداز
                </h4>
                <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-line">{symbolData.detailedAnalysis}</p>
            </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
            <button
                onClick={onClose}
                className="px-6 py-2 text-sm font-semibold text-gray-300 bg-gray-700/50 rounded-lg hover:bg-gray-600/50 border border-gray-600 transition"
            >
                بستن
            </button>
            <button
                onClick={handleAnalyzeClick}
                className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-emerald-600 rounded-lg shadow-lg hover:from-sky-600 hover:to-emerald-700 transition-all duration-300"
            >
                <TrendingUp size={18} />
                تحلیل این نماد
            </button>
        </div>
      </div>
    </div>
  );
};
