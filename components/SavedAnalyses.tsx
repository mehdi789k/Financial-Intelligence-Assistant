
import React, { useState } from 'react';
import { Save, Eye, Trash2, ChevronUp, Loader2, FolderArchive, Star } from 'lucide-react';
import type { SavedAnalysisRecord } from '../types';

interface SavedAnalysesProps {
  analyses: SavedAnalysisRecord[];
  isInitialized: boolean;
  onLoad: (id: number) => void;
  onDelete: (id: number) => void;
  activeId: number | null;
}

export const SavedAnalyses: React.FC<SavedAnalysesProps> = ({ analyses, isInitialized, onLoad, onDelete, activeId }) => {
    const [isOpen, setIsOpen] = useState(true);

    const handleToggle = () => setIsOpen(prev => !prev);

    const renderContent = () => {
        if (!isInitialized) {
            return (
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <p className="mr-3 text-gray-400">بارگذاری تحلیل‌های ذخیره شده...</p>
                </div>
            );
        }

        if (analyses.length === 0) {
            return (
                <div className="text-center p-8">
                    <FolderArchive className="mx-auto h-12 w-12 text-gray-600" />
                    <p className="mt-2 text-sm text-gray-400">هیچ تحلیلی ذخیره نشده است.</p>
                    <p className="text-xs text-gray-500">می‌توانید تحلیل‌های مهم را برای دسترسی سریع، اینجا ذخیره کنید.</p>
                </div>
            );
        }

        return (
             <ul className="space-y-3 p-1">
                {analyses.map(record => {
                    const dateStr = new Date(record.timestamp).toLocaleString('fa-IR', { 
                        dateStyle: 'short', 
                        timeStyle: 'short',
                        timeZone: record.timezone || 'UTC'
                    });

                    return (
                        <li 
                            key={record.id} 
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg
                            ${activeId === record.id ? 'bg-amber-900/50 ring-2 ring-amber-500' : 'bg-gray-800/40 hover:bg-gray-800/70'}`}
                        >
                            <div className="flex-grow mb-3 sm:mb-0">
                                 <p className="font-bold text-lg text-amber-300 flex items-center gap-2">
                                    <Star size={16} className="text-amber-400 fill-current"/>
                                    {record.name}
                                </p>
                                <div className="text-xs text-gray-400 font-mono mt-1 space-x-4 space-x-reverse">
                                    <span>نماد: {record.symbol}</span>
                                    <span>{dateStr}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-2">
                                <button
                                    onClick={() => onLoad(record.id!)}
                                    title="بازیابی و مشاهده تحلیل"
                                    className="p-2 rounded-full text-gray-300 hover:bg-amber-700 hover:text-white transition-colors"
                                >
                                    <Eye className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => onDelete(record.id!)}
                                    title="حذف تحلیل ذخیره شده"
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
                aria-controls="saved-analyses-content"
            >
                <div className="flex items-center">
                    <Save className="w-6 h-6 ml-3 text-amber-400" />
                    <span>تحلیل‌های ذخیره شده</span>
                </div>
                 <ChevronUp className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div
                id="saved-analyses-content"
                className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="px-4 pb-4">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
