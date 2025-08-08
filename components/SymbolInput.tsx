
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, AlertTriangle, Clock } from 'lucide-react';
import { getSymbolSuggestions } from '../services/geminiService';
import type { FinancialSymbol, MarketType } from '../types';

interface SymbolInputProps {
  symbol: string;
  setSymbol: (symbol: string) => void;
  disabled?: boolean;
  id?: string;
  label?: string | null;
  placeholder?: string;
  helperText?: string | null;
}

const getMarketTagStyle = (market: MarketType) => {
    switch(market) {
        case 'Crypto': return 'bg-yellow-600/50 text-yellow-200 border border-yellow-500/50';
        case 'Forex': return 'bg-sky-600/50 text-sky-200 border border-sky-500/50';
        case 'US Stocks': return 'bg-emerald-600/50 text-emerald-200 border border-emerald-500/50';
        case 'Iran Bourse': return 'bg-rose-600/50 text-rose-200 border border-rose-500/50';
        case 'Other':
        default: return 'bg-gray-600/50 text-gray-200 border border-gray-500/50';
    }
}

const getMarketPersianName = (market: MarketType) => {
    switch(market) {
        case 'Crypto': return 'کریپتو';
        case 'Forex': return 'فارکس';
        case 'US Stocks': return 'سهام آمریکا';
        case 'Iran Bourse': return 'بورس ایران';
        case 'Other': return 'سایر';
        default: return market;
    }
}

const HighlightMatch: React.FC<{ text: string; query: string }> = ({ text, query }) => {
    if (!text) {
        return null;
    }
    if (!query || query.length < 2) return <>{text}</>;
    // Escape special characters for regex
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <span key={i} className="text-sky-300 bg-sky-800/50 rounded px-1 py-0.5">{part}</span>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    );
};


export const SymbolInput: React.FC<SymbolInputProps> = ({
  symbol,
  setSymbol,
  disabled = false,
  id = 'symbol-input',
  label = "نماد مالی",
  placeholder = "جستجوی نماد... (مثلا: فولاد, BTC, EUR/USD)",
  helperText = "نام نماد مورد نظر خود را برای تحلیل وارد کنید."
}) => {
  const [suggestions, setSuggestions] = useState<FinancialSymbol[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);
  const debounceTimeout = useRef<number | null>(null);
  const suggestionsCache = useRef<Record<string, FinancialSymbol[]>>({});

  const fetchSuggestions = useCallback(async (value: string) => {
    if (isCoolingDown) return;

    if (suggestionsCache.current[value]) {
      setSuggestions(suggestionsCache.current[value]);
      setIsSearching(false);
      return;
    }

    try {
      const results = await getSymbolSuggestions(value);
      suggestionsCache.current[value] = results; 
      setSuggestions(results);
      setError(null);
    } catch (err: any) { 
      setSuggestions([]);
      const isRateLimitError =
        (err?.error?.code === 429) ||
        (err?.error?.status === 'RESOURCE_EXHAUSTED') ||
        JSON.stringify(err).toLowerCase().includes('resource_exhausted');
      
      if (isRateLimitError) {
        const cooldownDuration = 30000;
        setIsCoolingDown(true);
        setError(`محدودیت درخواست API. لطفاً ${cooldownDuration / 1000} ثانیه صبر کنید.`);
        setShowSuggestions(true);
        setTimeout(() => {
          setIsCoolingDown(false);
          setError(null); 
        }, cooldownDuration);
      } else {
        const errorMessage = err?.message || err?.error?.message || 'یک خطای ناشناخته رخ داد.';
        setError(errorMessage);
      }
    } finally {
      setIsSearching(false);
    }
  }, [isCoolingDown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSymbol(value);

    if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
    }

    if (isCoolingDown) return;
    
    if (value.length < 2) {
        setShowSuggestions(false);
        setIsSearching(false);
        setSuggestions([]);
        setError(null);
        return;
    }
    
    setIsSearching(true);
    setError(null);
    if (!showSuggestions) setShowSuggestions(true);
    setSuggestions([]);

    debounceTimeout.current = window.setTimeout(() => {
        fetchSuggestions(value);
    }, 1200);
  };

  const handleSelectSuggestion = (selectedSymbol: FinancialSymbol) => {
    setSymbol(selectedSymbol.symbol);
    setShowSuggestions(false);
    setError(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (componentRef.current && !componentRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
    }
  }, []);
  
  const hasTypedEnough = symbol.length >= 2;
  const isDisabled = disabled || isCoolingDown;

  return (
    <div ref={componentRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 z-10">
           {isCoolingDown ? <Clock className="h-5 w-5 text-yellow-500 animate-pulse" /> : isSearching ? <Loader2 className="h-5 w-5 text-gray-500 animate-spin" /> : <Search className="h-5 w-5 text-gray-500" />}
        </div>
        <input
          type="text"
          id={id}
          value={symbol}
          onChange={handleChange}
          onFocus={() => { if (hasTypedEnough && !isCoolingDown) setShowSuggestions(true); }}
          autoComplete="off"
          disabled={isDisabled}
          className="peer block w-full bg-gray-900/50 border border-gray-600/80 rounded-lg shadow-sm py-3 pr-10 pl-3 focus:outline-none focus:ring-2 focus:ring-sky-500/80 focus:border-sky-500 transition disabled:bg-gray-800/50 disabled:cursor-not-allowed disabled:placeholder:text-gray-600"
          placeholder={isCoolingDown ? "محدودیت درخواست! لطفاً صبر کنید..." : placeholder}
        />
        <div className="absolute inset-0 rounded-lg border-2 border-transparent peer-focus:border-sky-500/50 pointer-events-none transition duration-300"></div>
         {((showSuggestions && hasTypedEnough) || (isCoolingDown && error)) && (
            <ul className="absolute z-20 w-full mt-2 bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {isCoolingDown ? (
                error && (
                    <li className="px-4 py-3 text-sm text-yellow-300 bg-yellow-900/20 text-center flex items-center justify-center">
                        <Clock className="h-5 w-5 ml-2 animate-pulse" />
                        {error}
                    </li>
                )
              ) : (
                <>
                    {isSearching && (
                        <li className="px-4 py-3 text-sm text-gray-400 text-center flex items-center justify-center">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            در حال جستجو...
                        </li>
                    )}
                    {error && (
                        <li className="px-4 py-3 text-sm text-red-300 bg-red-900/20 text-center flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 ml-2" />
                        {error}
                        </li>
                    )}
                    {!isSearching && !error && suggestions.length === 0 && (
                        <li className="px-4 py-3 text-sm text-gray-400 text-center">
                            نتیجه‌ای یافت نشد.
                        </li>
                    )}
                    {!isSearching && !error && suggestions.map((item) => (
                        <li
                        key={`${item.symbol}-${item.name}`}
                        onClick={() => handleSelectSuggestion(item)}
                        className="px-4 py-3 text-sm text-gray-300 hover:bg-sky-800/50 cursor-pointer transition-colors flex justify-between items-center"
                        >
                        <div className="flex flex-col items-start gap-1">
                            <div className="font-bold">
                                <HighlightMatch text={item.symbol} query={symbol} />
                            </div>
                            <div className="text-gray-400 text-xs">
                                <HighlightMatch text={item.name} query={symbol} />
                            </div>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${getMarketTagStyle(item.market)}`}>
                            {getMarketPersianName(item.market)}
                        </span>
                        </li>
                    ))}
                </>
              )}
            </ul>
        )}
      </div>
      {helperText && <p className="mt-2 text-xs text-gray-500">{helperText}</p>}
    </div>
  );
};
