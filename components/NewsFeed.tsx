
import React, { useState, useEffect, useCallback } from 'react';
import { Newspaper, ChevronUp, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { getLatestFinancialNews } from '../services/geminiService';
import type { NewsItem } from '../types';

export const NewsFeed: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [news, setNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchNews = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const newsItems = await getLatestFinancialNews();
            setNews(newsItems);
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت اخبار';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Fetch news only when the component is first opened
        if (isOpen && news.length === 0) {
            fetchNews();
        }
    }, [isOpen, news.length, fetchNews]);

    const handleToggle = () => setIsOpen(prev => !prev);
    
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <p className="mr-3 text-gray-400">در حال دریافت آخرین اخبار...</p>
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
        
        if (news.length === 0) {
             return (
                <div className="text-center p-8">
                    <Newspaper className="mx-auto h-12 w-12 text-gray-600" />
                    <p className="mt-2 text-sm text-gray-400">برای مشاهده اخبار، فید را باز کنید.</p>
                </div>
            );
        }

        return (
            <ul className="space-y-4 p-1">
                {news.map((item, index) => (
                    <li key={index} className="bg-gray-800/40 p-4 rounded-lg hover:bg-gray-800/70 transition-colors">
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                            <h4 className="font-bold text-md text-sky-300 hover:underline">{item.title}</h4>
                            <p className="text-sm text-gray-300 mt-2">{item.summary}</p>
                            <p className="text-xs text-gray-500 mt-3 font-semibold">{item.source}</p>
                        </a>
                    </li>
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
                    <Newspaper className="w-6 h-6 ml-3 text-emerald-400" />
                    <span>آخرین اخبار مالی</span>
                </div>
                <div className="flex items-center gap-4">
                    {isOpen && (
                        <button
                            onClick={(e) => { e.stopPropagation(); fetchNews(); }}
                            disabled={isLoading}
                            className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-wait"
                            title="به‌روزرسانی اخبار"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    )}
                    <ChevronUp className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            <div
                className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="px-4 pb-4">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
