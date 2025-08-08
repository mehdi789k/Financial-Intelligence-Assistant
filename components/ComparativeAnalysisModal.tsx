
import React, { useState, useCallback } from 'react';
import { X, GitCompareArrows, Loader2, AlertTriangle, ChevronsRight, ThumbsUp, ThumbsDown, BarChart } from 'lucide-react';
import { SymbolInput } from './SymbolInput';
import { TimeframeSelector } from './TimeframeSelector';
import { RiskProfileSelector } from './RiskProfileSelector';
import type { Timeframe, RiskProfile, ComparativeAnalysisResult } from '../types';
import { getComparativeAnalysis } from '../services/geminiService';
import { ProgressiveReveal } from './ProgressiveReveal';

interface ComparativeAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComparativeAnalysisModal: React.FC<ComparativeAnalysisModalProps> = ({ isOpen, onClose }) => {
  const [symbolA, setSymbolA] = useState('');
  const [symbolB, setSymbolB] = useState('');
  const [timeframe, setTimeframe] = useState<Timeframe>('روزانه');
  const [riskProfile, setRiskProfile] = useState<RiskProfile>('متعادل');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparativeAnalysisResult | null>(null);

  const handleCompare = useCallback(async () => {
    if (!symbolA || !symbolB) {
      setError('لطفاً هر دو نماد را برای مقایسه وارد کنید.');
      return;
    }
    if (symbolA.toLowerCase() === symbolB.toLowerCase()) {
        setError('لطفاً دو نماد متفاوت را برای مقایسه وارد کنید.');
        return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const analysisResult = await getComparativeAnalysis(symbolA, symbolB, timeframe, riskProfile);
      setResult(analysisResult);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'خطا در انجام تحلیل مقایسه‌ای';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [symbolA, symbolB, timeframe, riskProfile]);

  if (!isOpen) {
    return null;
  }
  
  const renderResult = () => {
    if (isLoading) {
        return (
             <div className="flex flex-col items-center justify-center my-16 text-center">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-2 border-sky-500/30 rounded-full animate-ping"></div>
                <div className="absolute inset-2 border-2 border-emerald-500/30 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
              </div>
              <p className="mt-6 text-lg text-gray-300">در حال مقایسه نمادها...</p>
              <p className="text-sm text-gray-500">این فرآیند ممکن است کمی طول بکشد.</p>
            </div>
        )
    }
    
    if (error) {
        return (
            <div className="my-8 p-4 text-center bg-red-900/50 border border-red-700 text-red-300 rounded-lg animate-fade-in">
                <AlertTriangle className="mx-auto w-8 h-8 mb-2" />
                <p>{error}</p>
            </div>
        )
    }
    
    if (!result) return null;

    return (
        <div className="mt-8 space-y-6 animate-fade-in">
            <h3 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-emerald-400">
                مقایسه {result.symbolA} در برابر {result.symbolB}
            </h3>

            <ProgressiveReveal delay={100} className="overflow-x-auto bg-gray-900/30 p-4 rounded-xl border border-gray-700/50">
                 <table className="w-full min-w-max text-center">
                    <thead>
                        <tr className="border-b border-gray-600">
                            <th className="p-3 text-sm font-semibold tracking-wide text-gray-300 text-right">متریک</th>
                            <th className="p-3 text-sm font-bold tracking-wide text-sky-300">{result.symbolA}</th>
                            <th className="p-3 text-sm font-bold tracking-wide text-emerald-300">{result.symbolB}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {result.keyMetrics && result.keyMetrics.length > 0 ? (
                            result.keyMetrics.map((metric, index) => (
                                <tr key={index} className="border-b border-gray-700/50 last:border-none">
                                    <td className="p-3 text-sm text-gray-400 text-right">{metric.metric}</td>
                                    <td className="p-3 text-base font-mono font-semibold text-gray-200">{metric.symbolAValue}</td>
                                    <td className="p-3 text-base font-mono font-semibold text-gray-200">{metric.symbolBValue}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="p-4 text-center text-gray-500">
                                    متریک‌های کلیدی برای مقایسه یافت نشد.
                                </td>
                            </tr>
                        )}
                    </tbody>
                 </table>
            </ProgressiveReveal>

             <ProgressiveReveal delay={200} className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/50">
                <h4 className="text-xl font-semibold mb-3 flex items-center text-gray-200">
                    <ChevronsRight className="w-6 h-6 ml-2 text-sky-400" />
                    خلاصه مقایسه‌ای
                </h4>
                <p className="text-gray-300 leading-relaxed text-sm">{result.comparativeSummary}</p>
            </ProgressiveReveal>

             <ProgressiveReveal delay={300} className="bg-gradient-to-br from-sky-900/40 to-gray-900/30 p-6 rounded-xl border border-sky-700/60">
                <h4 className="text-xl font-semibold mb-3 flex items-center text-sky-300">
                    <BarChart className="w-6 h-6 ml-2" />
                    توصیه نهایی
                </h4>
                <p className="text-gray-200 leading-relaxed font-semibold text-md mb-4">{result.recommendation}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-emerald-900/40 p-3 rounded-lg border border-emerald-700/50">
                        <h5 className="font-bold text-emerald-300 flex items-center gap-2 mb-1"><ThumbsUp size={16}/>نکات مثبت</h5>
                        <p className="text-gray-300">{result.proRecommendation}</p>
                    </div>
                     <div className="bg-red-900/40 p-3 rounded-lg border border-red-700/50">
                        <h5 className="font-bold text-red-300 flex items-center gap-2 mb-1"><ThumbsDown size={16}/>نکات منفی</h5>
                        <p className="text-gray-300">{result.conRecommendation}</p>
                    </div>
                </div>
            </ProgressiveReveal>
        </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex justify-center items-start z-[60] animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700 w-full max-w-4xl p-6 my-8 animate-slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-sky-300 flex items-center gap-3">
            <GitCompareArrows />
            تحلیل مقایسه‌ای
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        {!result && (
            <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                    <SymbolInput
                        id="compare-symbol-a"
                        symbol={symbolA}
                        setSymbol={setSymbolA}
                        label="نماد اول"
                        helperText={null} />
                    <SymbolInput
                        id="compare-symbol-b"
                        symbol={symbolB}
                        setSymbol={setSymbolB}
                        label="نماد دوم"
                        helperText={null} />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} />
                    <RiskProfileSelector riskProfile={riskProfile} setRiskProfile={setRiskProfile} />
                 </div>
                  <div className="text-center pt-4">
                    <button
                      onClick={handleCompare}
                      disabled={isLoading || !symbolA || !symbolB}
                      className="group relative inline-flex items-center justify-center w-full md:w-auto px-12 py-3 text-lg font-bold text-white bg-gradient-to-r from-sky-500 to-emerald-600 rounded-lg shadow-lg hover:shadow-sky-500/40 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                    >
                      <span className="relative flex items-center gap-2">
                        {isLoading ? 'در حال مقایسه...' : 'شروع مقایسه'}
                        {!isLoading && <GitCompareArrows className="w-5 h-5 opacity-80 group-hover:opacity-100" />}
                      </span>
                    </button>
                  </div>
            </div>
        )}

        {renderResult()}

        {result && (
            <div className="mt-8 text-center border-t border-gray-700 pt-4">
                 <button
                    onClick={() => {
                        setResult(null);
                        setError(null);
                        setIsLoading(false);
                    }}
                    className="px-6 py-2 text-sm font-semibold text-gray-300 bg-gray-700/50 rounded-lg hover:bg-gray-600/50 border border-gray-600 transition"
                >
                    انجام مقایسه جدید
                </button>
            </div>
        )}

      </div>
    </div>
  );
};
