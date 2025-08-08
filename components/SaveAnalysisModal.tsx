
import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';

interface SaveAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  defaultName: string;
}

export const SaveAnalysisModal: React.FC<SaveAnalysisModalProps> = ({ isOpen, onClose, onSave, defaultName }) => {
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
    }
  }, [isOpen, defaultName]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md p-6 m-4 animate-slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-sky-300">ذخیره تحلیل</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          یک نام برای این تحلیل وارد کنید تا بتوانید بعداً آن را به راحتی پیدا و بازیابی کنید.
        </p>
        <div>
          <label htmlFor="analysis-name" className="block text-sm font-medium text-gray-300 mb-2">
            نام تحلیل
          </label>
          <input
            type="text"
            id="analysis-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full bg-gray-900/50 border border-gray-600/80 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-sky-500/80 focus:border-sky-500 transition"
            placeholder="مثال: تحلیل هفتگی بیت‌کوین"
            autoFocus
          />
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-semibold text-gray-300 bg-gray-700/50 rounded-lg hover:bg-gray-600/50 border border-gray-600 transition"
          >
            انصراف
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-emerald-600 rounded-lg shadow-lg hover:from-sky-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={18} />
            ذخیره
          </button>
        </div>
      </div>
    </div>
  );
};