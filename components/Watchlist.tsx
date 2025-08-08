
import React, { useState } from 'react';
import { Star, Eye, Trash2, ChevronUp, Loader2, PlusCircle } from 'lucide-react';
import { SymbolInput } from './SymbolInput';
import type { WatchlistItem } from '../types';

interface WatchlistProps {
  watchlist: WatchlistItem[];
  isInitialized: boolean;
  onSelect: (symbol: string) => void;
  onDelete: (symbol: string) => void;
  onAdd: (symbol: string) => void;
  currentSymbol: string | null;
}

export const Watchlist: React.FC<WatchlistProps> = ({ watchlist, isInitialized, onSelect, onDelete, onAdd, currentSymbol }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [newSymbol, setNewSymbol] = useState('');

    const handleToggle = () => setIsOpen(prev => !prev);

    const handleAdd = () => {
        const symbolToAdd = newSymbol.trim();
        if (symbolToAdd) {
            onAdd(symbolToAdd);
            setNewSymbol('');
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleAdd();
        }
    };

    const renderContent = () => {
        if (!isInitialized) {
            return (
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <p className="mr-3 text-gray-400">بارگذاری واچ‌لیست...</p>
                </div>
            );
        }

        if (watchlist.length === 0) {
            return (
                <div className="text-center p-8">
                    <Star className="mx-auto h-12 w-12 text-gray-600" />
                    <p className="mt-2 text-sm text-gray-400">واچ‌لیست شما خالی است.</p>
                    <p className="text-xs text-gray-500">یک نماد جدید از طریق کادر بالا اضافه کنید.</p>
                </div>
            );
        }

        return (
             <ul className="space-y-3 p-1 max-h-[400px] overflow-y-auto">
                {watchlist.map(item => {
                    const isActive = currentSymbol === item.symbol;
                    return (
                        <li 
                            key={item.symbol} 
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg
                            ${isActive ? 'bg-sky-900/50 ring-2 ring-sky-500' : 'bg-gray-800/40 hover:bg-gray-800/70'}`}
                        >
                            <div className="flex-grow mb-3 sm:mb-0">
                                <p className="font-bold text-lg text-sky-300">{item.symbol}</p>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-2">
                                <button
                                    onClick={() => onSelect(item.symbol)}
                                    title="تحلیل نماد"
                                    className="p-2 rounded-full text-gray-300 hover:bg-sky-700 hover:text-white transition-colors"
                                >
                                    <Eye className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => onDelete(item.symbol)}
                                    title="حذف از واچ‌لیست"
                                    className="p-2 rounded-full text-gray-400 hover:bg-red-800 hover:text-red-300 transition-colors"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </li>
                    )
                })}
            </ul>
        )
    }

    return (
        <div className="bg-gray-900/30 backdrop-blur-xl rounded-2xl shadow-xl shadow-sky-900/10 border border-gray-700/50">
            <button
                onClick={handleToggle}
                className="w-full flex items-center justify-between p-4 text-left text-lg font-semibold text-gray-200"
                aria-expanded={isOpen}
                aria-controls="watchlist-content"
            >
                <div className="flex items-center">
                    <Star className="w-6 h-6 ml-3 text-yellow-400" />
                    <span>واچ‌لیست</span>
                </div>
                <ChevronUp className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div
                id="watchlist-content"
                className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="px-4 pb-4">
                    <div className="p-1 my-3 border-b border-gray-700/80 pb-4">
                        <div className="flex items-end gap-2">
                            <div className="flex-grow">
                                <SymbolInput
                                    id="watchlist-symbol-input"
                                    symbol={newSymbol}
                                    setSymbol={setNewSymbol}
                                    label="افزودن نماد به واچ‌لیست"
                                    placeholder="مثلا: BTC یا AAPL"
                                    helperText={null}
                                />
                            </div>
                            <button
                                onClick={handleAdd}
                                disabled={!newSymbol.trim()}
                                className="flex-shrink-0 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800/50 disabled:cursor-not-allowed text-white font-bold h-[50px] w-[50px] flex items-center justify-center rounded-lg transition-all transform hover:scale-105 shadow-lg"
                                aria-label="افزودن نماد به واچ‌لیست"
                            >
                                <PlusCircle size={24} />
                            </button>
                        </div>
                    </div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
