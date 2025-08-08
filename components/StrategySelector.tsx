import React from 'react';
import type { Strategy, LearnedTechnique } from '../types';
import { strategies } from '../types';
import { Bot, Zap, Waves, Moon, Book, BrainCircuit } from 'lucide-react';

interface StrategySelectorProps {
  selectedStrategies: string[];
  setSelectedStrategies: (strategies: string[]) => void;
  learnedStrategies: LearnedTechnique[];
  disabled?: boolean;
}

const strategyOptions: { name: Strategy; icon: React.ElementType, description: string }[] = [
    { name: 'تحلیل تکنیکال کلاسیک', icon: Bot, description: 'استفاده از اندیکاتورهای متداول و الگوهای کلاسیک.' },
    { name: 'تحلیل بر اساس پرایس اکشن', icon: Zap, description: 'تمرکز بر حرکات قیمت و کندل‌ها بدون اندیکاتور.' },
    { name: 'تحلیل با امواج الیوت', icon: Waves, description: 'شناسایی امواج محرک و اصلاحی در روند قیمت.' },
    { name: 'نوسان‌گیری روزانه (Day Trading)', icon: Bot, description: 'معاملات کوتاه‌مدت در طول یک روز.' },
    { name: 'نوسان‌گیری میان‌مدت (Swing Trading)', icon: Bot, description: 'معاملات برای چند روز تا چند هفته.' },
    { name: 'اسکالپینگ (Scalping)', icon: Bot, description: 'سودهای کوچک از معاملات بسیار سریع.' },
    { name: 'معامله‌گری موقعیتی (Position)', icon: Bot, description: 'نگهداری موقعیت برای مدت طولانی.' },
    { name: 'سرمایه‌گذاری ارزشی (Value)', icon: Bot, description: 'خرید دارایی‌های زیر ارزش ذاتی.' },
    { name: 'سرمایه‌گذاری بر رشد (Growth)', icon: Bot, description: 'تمرکز بر دارایی‌های با پتانسیل رشد بالا.' },
    { name: 'معامله بر اساس اخبار', icon: Bot, description: 'واکنش سریع به اخبار و رویدادهای اقتصادی.' },
    { name: 'معامله‌گری مخالف روند (Contrarian)', icon: Bot, description: 'حرکت بر خلاف جهت بازار.' },
    { name: 'تحلیل بر اساس آسترولوژی', icon: Moon, description: 'دیدگاه غیرمتعارف مبتنی بر رویدادهای نجومی.' },
];

const StrategyButton: React.FC<{
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
                ? 'bg-sky-900/50 border-sky-600 shadow-lg'
                : 'bg-gray-800/50 border-gray-700/80 hover:border-gray-600'
        }`}
        aria-pressed={isSelected}
        title={description}
    >
        {isSelected && (
            <div className="absolute top-2 left-2 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center">
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


export const StrategySelector: React.FC<StrategySelectorProps> = ({ selectedStrategies, setSelectedStrategies, learnedStrategies, disabled = false }) => {

  const handleToggleStrategy = (strategy: string) => {
    const isSelected = selectedStrategies.includes(strategy);
    let newSelection;

    if (isSelected) {
        newSelection = selectedStrategies.filter(s => s !== strategy);
    } else {
        newSelection = [...selectedStrategies, strategy];
    }
    
    // Ensure at least one strategy is always selected
    if (newSelection.length > 0) {
        setSelectedStrategies(newSelection);
    }
  };

  return (
    <div className={`transition-opacity ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
        <label className="block text-sm font-medium text-gray-300 mb-2">
            استراتژی‌های تحلیل (حداقل یک مورد)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {strategyOptions.map((option) => (
                <StrategyButton
                    key={option.name}
                    name={option.name}
                    description={option.description}
                    icon={<option.icon className={`w-8 h-8 mb-2 transition-colors ${selectedStrategies.includes(option.name) ? 'text-sky-300' : 'text-gray-500'}`} />}
                    isSelected={selectedStrategies.includes(option.name)}
                    onToggle={() => handleToggleStrategy(option.name)}
                    disabled={disabled}
                />
            ))}
             {learnedStrategies.map((tech) => (
                <StrategyButton
                    key={tech.id}
                    name={tech.name}
                    description={tech.description}
                    icon={<BrainCircuit className={`w-8 h-8 mb-2 transition-colors ${selectedStrategies.includes(tech.name) ? 'text-purple-400' : 'text-gray-500'}`} />}
                    isSelected={selectedStrategies.includes(tech.name)}
                    onToggle={() => handleToggleStrategy(tech.name)}
                    disabled={disabled}
                />
            ))}
        </div>
         <p className="mt-2 text-xs text-gray-500">می‌توانید چند استراتژی (پیش‌فرض یا سفارشی) را برای تحلیل ترکیبی انتخاب کنید.</p>
    </div>
  );
};
