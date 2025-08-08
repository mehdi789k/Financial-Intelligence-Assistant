
import React, { useState, useMemo } from 'react';
import type { AnalysisResult } from '../types';
import { Lightbulb, GitBranch, ShieldCheck, ListChecks, History, AlertTriangle, AreaChart, BarChart, TrendingDown, Repeat, Calculator, DollarSign, Percent, Info } from 'lucide-react';

interface StrategyViewProps {
  analysis: AnalysisResult;
}

const InfoBlock: React.FC<{title: string, content: string | string[], icon: React.ReactNode, colorClass: string}> = ({title, content, icon, colorClass}) => (
    <div className={`p-4 rounded-lg border ${colorClass} bg-opacity-20 bg-clip-padding`}>
        <h4 className={`font-semibold text-md mb-3 flex items-center gap-2`}>
            {icon}
            {title}
        </h4>
        {Array.isArray(content) ? (
            <ul className="space-y-2 text-sm">
                {content.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-current flex-shrink-0"></div>
                        <span className="text-gray-300">{item}</span>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{content}</p>
        )}
    </div>
);

const BacktestStat: React.FC<{ label: string, value: string | number, colorClass?: string }> = ({ label, value, colorClass = 'text-gray-200' }) => (
    <div className="text-center bg-gray-900/40 p-3 rounded-lg">
        <div className="text-xs text-gray-400">{label}</div>
        <div className={`text-xl font-bold font-mono mt-1 ${colorClass}`}>{value}</div>
    </div>
);

const PositionSizingCalculator: React.FC<{ entryPrice?: number, stopLoss?: number }> = ({ entryPrice, stopLoss }) => {
    const [balance, setBalance] = useState('10000');
    const [riskPercent, setRiskPercent] = useState('1');

    const { positionSize, riskAmount, error } = useMemo(() => {
        const numBalance = parseFloat(balance);
        const numRisk = parseFloat(riskPercent);

        if (!entryPrice || !stopLoss || isNaN(numBalance) || isNaN(numRisk) || numBalance <= 0 || numRisk <= 0) {
            return { positionSize: null, riskAmount: null, error: null };
        }
        
        const priceDiff = Math.abs(entryPrice - stopLoss);
        if (priceDiff === 0) {
             return { positionSize: null, riskAmount: null, error: "قیمت ورود و حد ضرر نمی‌توانند یکسان باشند." };
        }

        const calculatedRiskAmount = numBalance * (numRisk / 100);
        const calculatedPositionSize = calculatedRiskAmount / priceDiff;

        return { 
            positionSize: calculatedPositionSize.toFixed(4), 
            riskAmount: calculatedRiskAmount.toFixed(2),
            error: null 
        };
    }, [balance, riskPercent, entryPrice, stopLoss]);

    return (
        <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-700/50 shadow-lg backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-4 flex items-center text-sky-300">
                <Calculator className="w-6 h-6 ml-2"/>
                محاسبه‌گر حجم معامله
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                 <div>
                    <label htmlFor="accountBalance" className="block text-sm font-medium text-gray-400 mb-1">موجودی حساب ($)</label>
                    <div className="relative">
                        <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input id="accountBalance" type="number" value={balance} onChange={e => setBalance(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 pr-3 pl-8 text-left focus:ring-sky-500 focus:border-sky-500"/>
                    </div>
                 </div>
                 <div>
                    <label htmlFor="riskPercent" className="block text-sm font-medium text-gray-400 mb-1">ریسک در هر معامله (%)</label>
                     <div className="relative">
                        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input id="riskPercent" type="number" value={riskPercent} onChange={e => setRiskPercent(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 pr-3 pl-8 text-left focus:ring-sky-500 focus:border-sky-500"/>
                    </div>
                 </div>
            </div>
            {error ? (
                 <div className="p-3 bg-red-900/30 text-red-300 text-sm rounded-lg text-center">{error}</div>
            ) : positionSize ? (
                <div className="p-4 bg-sky-900/40 border border-sky-700 rounded-lg text-center">
                    <p className="text-sm text-sky-200">حجم معامله پیشنهادی:</p>
                    <p className="text-2xl font-bold font-mono text-white my-1">{positionSize}</p>
                    <p className="text-xs text-gray-400">بر اساس ریسک ${riskAmount} در این معامله</p>
                </div>
            ) : (
                <div className="p-3 bg-gray-700/50 text-gray-400 text-sm rounded-lg text-center">اطلاعات ورود و حد ضرر برای محاسبه لازم است.</div>
            )}
        </div>
    );
};


export const StrategyView: React.FC<StrategyViewProps> = ({ analysis }) => {
  const { strategy, backtestResult } = analysis;

  if (!strategy) {
      return (
        <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-700/50 shadow-lg backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-emerald-400">
                هاب استراتژی معاملاتی
            </h3>
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                <Info size={40} className="mb-4" />
                <p className="font-semibold">استراتژی معاملاتی ارائه نشد</p>
                <p className="text-sm">هوش مصنوعی نتوانست استراتژی مشخصی برای این تحلیل تولید کند.</p>
            </div>
        </div>
      );
  }

  const { primary, alternative, riskManagement, simulatedBacktestNotes } = strategy;

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-emerald-400">
        هاب استراتژی معاملاتی
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Primary Strategy */}
        <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-700/50 shadow-lg backdrop-blur-sm space-y-4">
            <h3 className="text-xl font-semibold mb-2 flex items-center text-sky-300">
                <Lightbulb className="w-6 h-6 ml-2"/>
                استراتژی اصلی: {primary.title}
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed border-b border-gray-700/50 pb-4">{primary.description}</p>
            
            <InfoBlock 
                title="شروط ورود" 
                content={primary.entryConditions} 
                icon={<ListChecks size={18}/>} 
                colorClass="border-green-700/50 text-green-300 bg-green-500"
            />
            <InfoBlock 
                title="شروط خروج" 
                content={primary.exitConditions} 
                icon={<ListChecks size={18}/>} 
                colorClass="border-red-700/50 text-red-300 bg-red-500"
            />
        </div>

        {/* Risk and Alternative */}
        <div className="space-y-6">
             <PositionSizingCalculator entryPrice={analysis.buyTargets?.[0]} stopLoss={analysis.stopLoss} />
            {alternative && (
                <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-700/50 shadow-lg backdrop-blur-sm">
                    <h3 className="text-xl font-semibold mb-3 flex items-center text-purple-300">
                        <GitBranch className="w-6 h-6 ml-2"/>
                        استراتژی جایگزین: {alternative.title}
                    </h3>
                    <p className="text-sm text-gray-300 mb-3">{alternative.description}</p>
                    <div className="text-sm p-3 bg-gray-900/40 rounded-lg border border-gray-600/50">
                        <p className="flex items-center gap-2 font-semibold text-yellow-400">
                            <AlertTriangle size={16}/>
                            شرط فعال‌سازی:
                        </p>
                        <p className="text-gray-300 mt-1">{alternative.triggerCondition}</p>
                    </div>
                </div>
            )}
        </div>
      </div>
      
       {backtestResult && (
          <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-700/50 shadow-lg backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-200">
                <History className="w-6 h-6 ml-2 text-sky-400"/>
                نتایج بک‌تست کمی ({backtestResult.period})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <BacktestStat label="سود/زیان کل" value={`${backtestResult.totalProfitLoss.toFixed(2)}%`} colorClass={backtestResult.totalProfitLoss > 0 ? 'text-green-400' : 'text-red-400'} />
                <BacktestStat label="نرخ برد" value={`${backtestResult.winRate.toFixed(1)}%`} colorClass={backtestResult.winRate > 50 ? 'text-green-400' : 'text-yellow-400'} />
                <BacktestStat label="افت سرمایه" value={`${backtestResult.maxDrawdown.toFixed(2)}%`} colorClass="text-red-400" />
                <BacktestStat label="عامل سود" value={backtestResult.profitFactor.toFixed(2)} colorClass={backtestResult.profitFactor > 1 ? 'text-green-400' : 'text-red-400'} />
                <BacktestStat label="تعداد معاملات" value={backtestResult.tradesCount} />
            </div>
             {simulatedBacktestNotes && <p className="text-xs text-gray-500 mt-4 leading-relaxed">{simulatedBacktestNotes}</p>}
          </div>
      )}
    </div>
  );
};
