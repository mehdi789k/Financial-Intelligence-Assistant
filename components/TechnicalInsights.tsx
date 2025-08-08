

import React, { useState, useMemo } from 'react';
import type { AnalysisResult, Pattern, PatternCategory, PatternImplication, PatternReliability } from '../types';
import { ChevronsRight, ArrowUp, ArrowDown, Minus, Rss, BarChartHorizontal, Wind, ChevronDown, CandlestickChart as CandlestickIcon, LineChart as ClassicIcon, GitCommit } from 'lucide-react';

interface TechnicalInsightsProps {
    patterns: AnalysisResult['patterns'];
    indicators: AnalysisResult['indicators'];
    highlightedPattern: Pattern | null;
    onPatternSelect: (pattern: Pattern | null) => void;
}

const PatternIcon: React.FC<{implication: PatternImplication}> = ({ implication }) => {
    switch (implication) {
        case 'Bullish': return <ArrowUp className="w-5 h-5 text-green-400 flex-shrink-0" />;
        case 'Bearish': return <ArrowDown className="w-5 h-5 text-red-400 flex-shrink-0" />;
        case 'Neutral':
        default: return <Minus className="w-5 h-5 text-yellow-400 flex-shrink-0" />;
    }
}

const CategoryInfo: Record<PatternCategory, { icon: React.ElementType, title: string, color: string }> = {
    'Classic Chart': { icon: ClassicIcon, title: 'الگوهای کلاسیک', color: 'text-sky-400' },
    'Candlestick': { icon: CandlestickIcon, title: 'الگوهای کندل استیک', color: 'text-amber-400' },
    'Harmonic': { icon: GitCommit, title: 'الگوهای هارمونیک', color: 'text-purple-400' }
};

const ReliabilityBadge: React.FC<{ reliability: PatternReliability }> = ({ reliability }) => {
    const styles: Record<PatternReliability, string> = {
        'High': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        'Medium': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        'Low': 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    return (
         <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border whitespace-nowrap ${styles[reliability]}`}>
            {reliability === 'High' ? 'اعتبار بالا' : reliability === 'Medium' ? 'اعتبار متوسط' : 'اعتبار پایین'}
        </span>
    );
}

const RsiGauge: React.FC<{ value: number }> = ({ value }) => {
    const percentage = Math.max(0, Math.min(100, value));
    let colorClass = 'bg-yellow-500';
    if (percentage > 70) colorClass = 'bg-red-500';
    else if (percentage < 30) colorClass = 'bg-green-500';

    return (
        <div className="w-full bg-gray-700 rounded-full h-2.5 my-1">
            <div className={`${colorClass} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
        </div>
    );
};

const getSignalTagStyle = (signal?: string) => {
    if (!signal) {
        return 'bg-gray-700/50 text-gray-400 border-gray-600/50';
    }
    const lowerSignal = signal.toLowerCase();
    if (lowerSignal.includes('bullish') || lowerSignal.includes('lower') || lowerSignal.includes('oversold')) {
        return 'bg-green-800/50 text-green-300 border-green-700/50';
    }
    if (lowerSignal.includes('bearish') || lowerSignal.includes('upper') || lowerSignal.includes('overbought')) {
        return 'bg-red-800/50 text-red-300 border-red-700/50';
    }
    return 'bg-yellow-800/50 text-yellow-300 border-yellow-700/50';
}

export const TechnicalInsights: React.FC<TechnicalInsightsProps> = ({ patterns, indicators, highlightedPattern, onPatternSelect }) => {
  
  const groupedPatterns = useMemo(() => {
    return (patterns || []).reduce((acc, pattern) => {
        const category = pattern.category || 'Classic Chart';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(pattern);
        return acc;
    }, {} as Record<PatternCategory, Pattern[]>);
  }, [patterns]);

  const [openCategories, setOpenCategories] = useState<Record<PatternCategory, boolean>>({
    'Classic Chart': true,
    'Candlestick': true,
    'Harmonic': true,
  });

  const toggleCategory = (category: PatternCategory) => {
      setOpenCategories(prev => ({...prev, [category]: !prev[category]}));
  }

  return (
    <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50 shadow-lg backdrop-blur-sm flex flex-col gap-6">
        <div>
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-semibold flex items-center text-gray-200">
                    <ChevronsRight className="w-6 h-6 ml-2 text-sky-400" />
                    الگوهای تکنیکال
                </h3>
                {highlightedPattern && (
                    <button 
                        onClick={() => onPatternSelect(null)}
                        className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors bg-sky-800/50 px-2 py-1 rounded-md"
                    >
                        پاک کردن هایلایت
                    </button>
                )}
            </div>
            <div className="space-y-2">
                {Object.entries(groupedPatterns).map(([category, patternsInCategory]) => {
                    const cat = category as PatternCategory;
                    const { icon: CategoryIcon, title, color } = CategoryInfo[cat];
                    const isOpen = openCategories[cat];
                    return (
                        <div key={cat}>
                             <button
                                onClick={() => toggleCategory(cat)}
                                className="w-full flex items-center justify-between p-2 rounded-md bg-gray-700/20 hover:bg-gray-700/40 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <CategoryIcon className={`w-5 h-5 ${color}`} />
                                    <span className={`font-semibold ${color}`}>{title}</span>
                                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{patternsInCategory.length}</span>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[500px]' : 'max-h-0'}`}>
                                <ul className="space-y-3 text-gray-400 text-sm p-2">
                                    {patternsInCategory.map((p, i) => (
                                        <li 
                                            key={i} 
                                            onClick={() => onPatternSelect(p)}
                                            className={`flex flex-col gap-2 p-3 rounded-md bg-gray-700/30 border transition-all duration-200 cursor-pointer 
                                            ${highlightedPattern?.name === p.name && highlightedPattern?.startDate === p.startDate 
                                                ? 'border-sky-500 ring-2 ring-sky-500/50' 
                                                : 'border-gray-700/50 hover:border-gray-600'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <PatternIcon implication={p.implication} />
                                                    <strong className="text-gray-200 block">{p.name}</strong>
                                                </div>
                                                <ReliabilityBadge reliability={p.reliability} />
                                            </div>
                                            <p className="text-xs text-gray-500 pr-8">{p.description}</p>
                                            {p.keyLevels && p.keyLevels.length > 0 && (
                                                <div className="text-xs text-purple-300 pr-8 font-mono">
                                                   سطوح کلیدی: {p.keyLevels.map(level => `${level.name}: ${level.value}`).join(', ')}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                             </div>
                        </div>
                    );
                })}
                {(patterns || []).length === 0 && <p className="text-gray-500 text-sm p-4 text-center">هیچ الگوی قابل توجهی شناسایی نشد.</p>}
            </div>
        </div>
        
        <div className="border-t border-gray-700/50"></div>

        <div>
             <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-200">
                <ChevronsRight className="w-6 h-6 ml-2 text-sky-400" />
                سیگنال اندیکاتورها
            </h3>
            <div className="space-y-4">
                <div className="p-3 rounded-md bg-gray-700/20 border border-gray-700/50">
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="font-semibold text-gray-300 flex items-center gap-2"><Rss className="w-4 h-4 text-sky-400"/>RSI ({indicators?.rsi?.value ?? 'N/A'})</h4>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getSignalTagStyle(indicators?.rsi?.signal)}`}>{indicators?.rsi?.signal ?? 'نامشخص'}</span>
                    </div>
                    {typeof indicators?.rsi?.value === 'number' && <RsiGauge value={indicators.rsi.value} />}
                    <p className="text-xs text-gray-500 mt-2">{indicators?.rsi?.description ?? 'داده‌ای برای RSI موجود نیست.'}</p>
                </div>
                <div className="p-3 rounded-md bg-gray-700/20 border border-gray-700/50">
                    <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-gray-300 flex items-center gap-2"><BarChartHorizontal className="w-4 h-4 text-sky-400"/>MACD</h4>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getSignalTagStyle(indicators?.macd?.signal)}`}>{indicators?.macd?.signal ?? 'نامشخص'}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{indicators?.macd?.description ?? 'داده‌ای برای MACD موجود نیست.'}</p>
                </div>
                <div className="p-3 rounded-md bg-gray-700/20 border border-gray-700/50">
                    <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-gray-300 flex items-center gap-2"><Wind className="w-4 h-4 text-sky-400"/>Bollinger Bands</h4>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getSignalTagStyle(indicators?.bollinger?.signal)}`}>{indicators?.bollinger?.signal ?? 'نامشخص'}</span>
                    </div>
                     <p className="text-xs text-gray-500 mt-2">{indicators?.bollinger?.description ?? 'داده‌ای برای Bollinger Bands موجود نیست.'}</p>
                </div>
            </div>
        </div>
    </div>
  );
};
