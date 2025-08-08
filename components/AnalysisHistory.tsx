
import React, { useState } from 'react';
import { History, Eye, Trash2, ChevronUp, Loader2 } from 'lucide-react';
import type { AnalysisRecord } from '../types';

interface AnalysisHistoryProps {
  history: AnalysisRecord[];
  isInitialized: boolean;
  onView: (id: number) => void;
  onDelete: (id: number) => void;
  activeId: number | null;
}

const getSignalBadgeStyle = (signal?: string) => {
    if (signal?.includes('خرید')) return 'bg-green-500/20 text-green-300 border-green-500/30';
    if (signal?.includes('فروش')) return 'bg-red-500/20 text-red-300 border-red-500/30';
    return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
}

export const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({ history, isInitialized, onView, onDelete, activeId }) => {
    const [isOpen, setIsOpen] = useState(true);

    const handleToggle = () => setIsOpen(prev => !prev);

    const renderContent = () => {
        if (!isInitialized) {
            return (
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <p className="mr-3 text-gray-400">بارگذاری تاریخچه تحلیل‌ها...</p>
                </div>
            );
        }

        if (history.length === 0) {
            return (
                <div className="text-center p-8">
                    <History className="mx-auto h-12 w-12 text-gray-600" />
                    <p className="mt-2 text-sm text-gray-400">هنوز تحلیلی ذخیره نشده است.</p>
                    <p className="text-xs text-gray-500">پس از اولین تحلیل، نتایج در اینجا نمایش داده می‌شوند.</p>
                </div>
            );
        }

        return (
             <ul className="space-y-3 p-1">
                {history.map(record => {
                    const dateStr = new Date(record.timestamp).toLocaleString('fa-IR', { 
                        dateStyle: 'short', 
                        timeStyle: 'short',
                        timeZone: record.timezone || 'UTC'
                    });

                    return (
                        <li 
                            key={record.id} 
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg
                            ${activeId === record.id ? 'bg-sky-900/50 ring-2 ring-sky-500' : 'bg-gray-800/40 hover:bg-gray-800/70'}`}
                        >
                            <div className="flex-grow mb-3 sm:mb-0">
                                <p className="font-bold text-lg text-sky-300">{record.symbol}</p>
                                <p className="text-xs text-gray-400 font-mono mt-1">
                                    {dateStr}
                                     <span className="mx-2">|</span>
                                     <span>{record.timeframe}</span>
                                </p>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-2">
                                 <span className={`text-xs font-semibold px-2 py-1 rounded-md border whitespace-nowrap ${getSignalBadgeStyle(record.analysis.signal)}`}>
                                    {record.analysis.signal || 'نامشخص'}
                                </span>
                                <button
                                    onClick={() => onView(record.id!)}
                                    title="مشاهده تحلیل"
                                    className="p-2 rounded-full text-gray-300 hover:bg-sky-700 hover:text-white transition-colors"
                                >
                                    <Eye className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => onDelete(record.id!)}
                                    title="حذف تحلیل"
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
                aria-controls="analysis-history-content"
            >
                <div className="flex items-center">
                    <History className="w-6 h-6 ml-3 text-sky-400" />
                    <span>تاریخچه تحلیل‌ها</span>
                </div>
                <ChevronUp className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div
                id="analysis-history-content"
                className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="px-4 pb-4">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
