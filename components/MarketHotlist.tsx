
import React, { useState, useEffect, useCallback } from 'react';
import { Flame, ChevronUp, Loader2, AlertTriangle, RefreshCw, Eye } from 'lucide-react';
import { getTopTrendingSymbols } from '../services/geminiService';
import type { HotSymbol, MarketType } from '../types';

interface MarketHotlistProps {
  onSymbolSelect: (symbol: HotSymbol) => void;
}

const getMarketTagStyle = (market: MarketType) => {
    switch(market) {
        case 'Crypto': return 'bg-yellow-600/50 text-yellow-200 border-yellow-500/50';
        case 'Forex': return 'bg-sky-600/50 text-sky-200 border-sky-500/50';
        case 'US Stocks': return 'bg-emerald-600/50 text-emerald-200 border-emerald-500/50';
        case 'Iran Bourse': return 'bg-rose-600/50 text-rose-200 border-rose-500/50';
        case 'Other':
        default: return 'bg-gray-600/50 text-gray-200 border-gray-500/50';
    }
}

export const MarketHotlist: React.FC<MarketHotlistProps> = ({ onSymbolSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [symbols, setSymbols] = useState<HotSymbol[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSymbols = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const hotSymbols = await getTopTrendingSymbols();
            setSymbols(hotSymbols);
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت نمادها';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen && symbols.length === 0) {
            fetchSymbols();
        }
    }, [isOpen, symbols.length, fetchSymbols]);

    const handleToggle = () => setIsOpen(prev => !prev);
    
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <p className="mr-3 text-gray-400">در حال شناسایی نمادهای داغ بازار...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex items-center justify-center p-8 text-red-400">
                    <AlertTriangle className="h-6 w-6" />
                    <p className="mr-3">{error}</p>
                </div>
            );
        }
        
        if (symbols.length === 0) {
             return (
                <div className="text-center p-8">
                    <Flame className="mx-auto h-12 w-12 text-gray-600" />
                    <p className="mt-2 text-sm text-gray-400">برای مشاهده پیشنهادات AI، فید را باز کنید.</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
                {symbols.map((item) => (
                    <div 
                        key={item.symbol} 
                        className="bg-gray-800/40 p-4 rounded-lg hover:bg-gray-800/70 hover:ring-2 hover:ring-amber-500/50 transition-all group cursor-pointer"
                        onClick={() => onSymbolSelect(item)}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-lg text-amber-300 group-hover:text-amber-200">{item.symbol}</h4>
                                <p className="text-xs text-gray-400">{item.name}</p>
                            </div>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${getMarketTagStyle(item.market)}`}>
                                {item.market}
                            </span>
                        </div>
                        <p className="text-sm text-gray-300 mt-3 border-t border-gray-700/50 pt-3">{item.reason}</p>
                         <button className="w-full text-center mt-4 text-xs font-semibold text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                           <Eye size={14} /> مشاهده جزئیات
                        </button>
                    </div>
                ))}
            </ul>
        );
    }

    return (
        <div className="bg-gray-900/30 backdrop-blur-xl rounded-2xl shadow-xl shadow-sky-900/10 border border-gray-700/50">
            <button
                onClick={handleToggle}
                className="w-full flex items-center justify-between p-4 text-left text-lg font-semibold text-gray-200"
                aria-expanded={isOpen}
            >
                <div className="flex items-center">
                    <Flame className="w-6 h-6 ml-3 text-amber-400" />
                    <span>نمادهای داغ پیشنهادی AI</span>
                </div>
                <div className="flex items-center gap-4">
                    {isOpen && (
                        <button
                            onClick={(e) => { e.stopPropagation(); fetchSymbols(); }}
                            disabled={isLoading}
                            className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-wait"
                            title="به‌روزرسانی لیست"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    )}
                    <ChevronUp className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            <div
                className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="px-4 pb-4">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
