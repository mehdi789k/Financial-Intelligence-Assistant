
import React from 'react';
import { Sparkles, User, GitCompareArrows } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onOpenUserPanel: () => void;
  onOpenCompare: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onOpenUserPanel, onOpenCompare }) => {
  return (
    <div className="min-h-screen flex flex-col bg-transparent text-gray-200">
       <style>{`
        @keyframes underline-grow {
          from { width: 0%; transform: translateX(50%); }
          to { width: 100%; transform: translateX(0); }
        }
        .underline-grow-active {
          animation: underline-grow 0.3s forwards;
        }
      `}</style>
      <header className="bg-gray-900/50 backdrop-blur-lg border-b border-gray-700/50 sticky top-0 z-50">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white"/>
               </div>
              <span className="font-bold text-xl text-gray-100">هوش مالی Plus</span>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <span className="text-sm text-gray-400 hidden sm:block">قدرت گرفته از Gemini</span>
               <button
                onClick={onOpenCompare}
                className="p-2 rounded-full text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                title="تحلیل مقایسه‌ای"
                aria-label="باز کردن تحلیل مقایسه‌ای"
              >
                  <GitCompareArrows className="w-6 h-6"/>
              </button>
              <button
                onClick={onOpenUserPanel}
                className="p-2 rounded-full text-gray-300 hover:bg-gray-700 hover:text-white transition-colors user-panel-button"
                title="پنل کاربری"
                aria-label="باز کردن پنل کاربری"
              >
                  <User className="w-6 h-6"/>
              </button>
            </div>
          </div>
        </nav>
      </header>
      <main className="flex-grow">{children}</main>
      <footer className="bg-transparent mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} تحلیلگر هوشمند مالی. تمام حقوق محفوظ است.</p>
        </div>
      </footer>
    </div>
  );
};
