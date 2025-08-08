
import React, { useState, useEffect } from 'react';
import { X, Save, BrainCircuit, Lightbulb, BookOpen, AlertCircle } from 'lucide-react';
import type { LearnedTechnique, TechniqueType } from '../types';

interface TechniqueLearningModalProps {
  isOpen: boolean;
  initialTechniques: LearnedTechnique[];
  onClose: () => void;
  onSave: (techniquesToSave: Omit<LearnedTechnique, 'id'>[]) => void;
}

const getSourceText = (technique: LearnedTechnique): string => {
    switch (technique.source) {
        case 'user_upload':
            return technique.sourceFileName ? `فایل کاربر: ${technique.sourceFileName}` : 'فایل کاربر';
        case 'web_discovery':
            return 'کشف شده از وب توسط AI';
        case 'manual':
            return 'ایجاد شده به صورت دستی';
        default:
            return 'نامشخص';
    }
};

const EditableTechnique: React.FC<{
    technique: LearnedTechnique;
    isSelected: boolean;
    onToggle: () => void;
    onUpdate: (updatedTechnique: LearnedTechnique) => void;
}> = ({ technique, isSelected, onToggle, onUpdate }) => {
    const [name, setName] = useState(technique.name);
    const [description, setDescription] = useState(technique.description);
    const [parameters, setParameters] = useState(technique.parameters);

    useEffect(() => {
        onUpdate({ ...technique, name, description, parameters });
    }, [name, description, parameters]);
    
    const isStrategy = technique.type === 'Strategy';
    const Icon = isStrategy ? Lightbulb : BookOpen;
    const color = isStrategy ? 'text-amber-400' : 'text-purple-400';

    return (
        <div className={`p-4 rounded-lg border-2 transition-all ${isSelected ? 'bg-sky-900/40 border-sky-600' : 'bg-gray-800/50 border-gray-700/80'}`}>
            <div className="flex justify-between items-start gap-4">
                <div className="flex-grow space-y-3">
                     <div className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 ${color}`} />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-transparent font-semibold text-gray-200 focus:outline-none focus:ring-1 focus:ring-sky-500 rounded px-2"
                        />
                     </div>
                     <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-sm text-gray-300 min-h-[100px] focus:ring-sky-500 focus:border-sky-500"
                     />
                     <input
                        type="text"
                        value={parameters}
                        onChange={(e) => setParameters(e.target.value)}
                        className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-xs text-gray-400 font-mono focus:ring-sky-500 focus:border-sky-500"
                     />
                </div>
                 <div className="flex-shrink-0">
                    <button 
                        onClick={onToggle}
                        className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${isSelected ? 'bg-sky-500 border-sky-400' : 'bg-gray-700 border-gray-600 hover:border-sky-500'}`}
                    >
                         {isSelected && <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                    </button>
                 </div>
            </div>
             <p className="text-xs text-gray-500 mt-2">منبع: {getSourceText(technique)}</p>
        </div>
    )
};


export const TechniqueLearningModal: React.FC<TechniqueLearningModalProps> = ({ isOpen, initialTechniques, onClose, onSave }) => {
  const [editedTechniques, setEditedTechniques] = useState<LearnedTechnique[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setEditedTechniques(initialTechniques);
      setSelectedIndices(new Set(initialTechniques.map((_, index) => index)));
    }
  }, [isOpen, initialTechniques]);

  const handleUpdateTechnique = (index: number, updatedTechnique: LearnedTechnique) => {
    setEditedTechniques(prev => {
        const newTechniques = [...prev];
        newTechniques[index] = updatedTechnique;
        return newTechniques;
    });
  };

  const handleToggleSelection = (index: number) => {
      setSelectedIndices(prev => {
          const newSet = new Set(prev);
          if (newSet.has(index)) {
              newSet.delete(index);
          } else {
              newSet.add(index);
          }
          return newSet;
      });
  };

  const handleSave = () => {
    const techniquesToSave = editedTechniques.filter((_, index) => selectedIndices.has(index));
    // Strip ID before saving, as DB will assign one
    const techniquesWithoutId = techniquesToSave.map(t => {
        const { id, ...rest } = t;
        return rest;
    });
    onSave(techniquesWithoutId);
  };
  
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex justify-center items-start z-[70] animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700 w-full max-w-2xl p-6 my-8 animate-slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-sky-300 flex items-center gap-2">
            <BrainCircuit />
            یادگیری دانش جدید
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-3 bg-sky-900/30 border border-sky-700 text-sky-200 rounded-lg flex items-center gap-3 mb-4 text-sm">
            <AlertCircle />
            <p>هوش مصنوعی موارد زیر را شناسایی کرده است. موارد مورد نظر برای افزودن به کتابخانه دانش خود را انتخاب و ویرایش کنید.</p>
        </div>
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
            {editedTechniques.map((technique, index) => (
                <EditableTechnique
                    key={index}
                    technique={technique}
                    isSelected={selectedIndices.has(index)}
                    onToggle={() => handleToggleSelection(index)}
                    onUpdate={(updated) => handleUpdateTechnique(index, updated)}
                />
            ))}
        </div>

        <div className="mt-6 flex justify-between items-center">
             <span className="text-sm text-gray-400">{selectedIndices.size} از {editedTechniques.length} مورد برای ذخیره انتخاب شده.</span>
            <div className="flex gap-4">
                 <button
                    onClick={onClose}
                    className="px-6 py-2 text-sm font-semibold text-gray-300 bg-gray-700/50 rounded-lg hover:bg-gray-600/50 border border-gray-600 transition"
                >
                    انصراف
                </button>
                <button
                    onClick={handleSave}
                    disabled={selectedIndices.size === 0}
                    className="px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-emerald-600 rounded-lg shadow-lg hover:from-sky-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Save size={18} />
                    ذخیره موارد انتخابی
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
