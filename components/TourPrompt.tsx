import React from 'react';
import { Zap } from 'lucide-react';

interface TourPromptProps {
    onStart: () => void;
    onDismiss: () => void;
}

export const TourPrompt: React.FC<TourPromptProps> = ({ onStart, onDismiss }) => {
    return (
        <div className="tour-prompt-popover bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700 w-full max-w-sm p-5 text-center">
            <h3 className="text-lg font-bold text-sky-300 flex items-center justify-center gap-2">
                <Zap className="text-sky-400" />
                راهنمای شروع سریع
            </h3>
            <p className="text-sm text-gray-300 my-3">
                آیا می‌خواهید با یک تور تعاملی کوتاه با قابلیت‌های اصلی برنامه آشنا شوید؟
            </p>
            <div className="flex gap-3 mt-4">
                <button
                    onClick={onDismiss}
                    className="flex-1 px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-700/50 rounded-lg hover:bg-gray-600/50 border border-gray-600 transition"
                >
                    نه، ممنون
                </button>
                <button
                    onClick={onStart}
                    className="flex-1 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-emerald-600 rounded-lg shadow-lg hover:from-sky-600 hover:to-emerald-700 transition"
                >
                    بله، شروع کن
                </button>
            </div>
        </div>
    );
};
