import React from 'react';
import type { Indicator, LearnedTechnique } from '../types';
import { indicators } from '../types';
import { BarChart2, BrainCircuit } from 'lucide-react';

interface IndicatorSelectorProps {
  selectedIndicators: string[];
  setSelectedIndicators: (indicators: string[]) => void;
  learnedIndicators: LearnedTechnique[];
  disabled?: boolean;
}

const IndicatorButton: React.FC<{
    name: string;
    description: string;
    icon: React.ReactNode;
    isSelected: boolean;
    onToggle: () => void;
    disabled?: boolean;
}> = ({ name, description, icon, isSelected, onToggle, disabled }) => (
     <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={`relative text-center p-3 rounded-lg transition-all duration-300 border-2 disabled:cursor-not-allowed
            ${
            isSelected
                ? 'bg-purple-900/50 border-purple-600 shadow-lg'
                : 'bg-gray-800/50 border-gray-700/80 hover:border-gray-600'
        }`}
        aria-pressed={isSelected}
        title={description}
    >
        {isSelected && (
            <div className="absolute top-2 left-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
            </div>
        )}
        <div className="flex flex-col items-center justify-center h-full">
            {icon}
            <span className={`text-xs sm:text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>{name}</span>
        </div>
    </button>
);


export const IndicatorSelector: React.FC<IndicatorSelectorProps> = ({ selectedIndicators, setSelectedIndicators, learnedIndicators, disabled = false }) => {

  const handleToggleIndicator = (indicator: string) => {
    const isSelected = selectedIndicators.includes(indicator);
    let newSelection;

    if (isSelected) {
        newSelection = selectedIndicators.filter(s => s !== indicator);
    } else {
        newSelection = [...selectedIndicators, indicator];
    }
    
    // Allow empty selection
    setSelectedIndicators(newSelection);
  };

  return (
    <div className={`transition-opacity ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
        <label className="block text-sm font-medium text-gray-300 mb-2">
            اندیکاتورهای مورد نظر برای تحلیل
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {indicators.map((indicatorName) => (
                <IndicatorButton
                    key={indicatorName}
                    name={indicatorName}
                    description={`تحلیل با تمرکز بر ${indicatorName}`}
                    icon={<BarChart2 className={`w-8 h-8 mb-2 transition-colors ${selectedIndicators.includes(indicatorName) ? 'text-purple-300' : 'text-gray-500'}`} />}
                    isSelected={selectedIndicators.includes(indicatorName)}
                    onToggle={() => handleToggleIndicator(indicatorName)}
                    disabled={disabled}
                />
            ))}
             {learnedIndicators.map((tech) => (
                <IndicatorButton
                    key={tech.id}
                    name={tech.name}
                    description={tech.description}
                    icon={<BrainCircuit className={`w-8 h-8 mb-2 transition-colors ${selectedIndicators.includes(tech.name) ? 'text-purple-400' : 'text-gray-500'}`} />}
                    isSelected={selectedIndicators.includes(tech.name)}
                    onToggle={() => handleToggleIndicator(tech.name)}
                    disabled={disabled}
                />
            ))}
        </div>
         <p className="mt-2 text-xs text-gray-500">اندیکاتورهایی که می‌خواهید AI در تحلیل خود بیشتر به آن‌ها توجه کند را انتخاب کنید.</p>
    </div>
  );
};
