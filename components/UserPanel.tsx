
import React, { useState, useRef } from 'react';
import { X, FileDown, Trash2, History, Save, FolderArchive, Star, Loader2, Zap, BrainCircuit, ShieldCheck, FileUp, Edit, Check, PlusCircle, BookOpen, Lightbulb, Search } from 'lucide-react';
import type { KnowledgeItem, LearnedTechnique, TechniqueType } from '../types';

interface UserPanelProps {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    historyCount: number;
    savedCount: number;
    filesCount: number;
    watchlistCount: number;
    knowledgeCount: number;
    techniqueCount: number;
  };
  onExportAllData: () => void;
  onDeleteAllData: () => Promise<void>;
  onStartTour: () => void;
  knowledgeItems: KnowledgeItem[];
  onUpdateKnowledgeItem: (item: KnowledgeItem) => Promise<void>;
  onDeleteKnowledgeItem: (id: number) => Promise<void>;
  onImportFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  techniques: LearnedTechnique[];
  onAddTechnique: (technique: Omit<LearnedTechnique, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateTechnique: (technique: LearnedTechnique) => Promise<void>;
  onDeleteTechnique: (id: number) => Promise<void>;
  onDiscoverNewTechniques: () => void;
  isDiscovering: boolean;
}

type Tab = 'actions' | 'knowledge' | 'policy';

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: number, color: string }> = ({ icon, label, value, color }) => (
    <div className={`flex items-center p-4 bg-gray-800/50 rounded-lg border ${color}`}>
        <div className="mr-4">{icon}</div>
        <div>
            <div className="text-2xl font-bold text-gray-100">{value}</div>
            <div className="text-sm text-gray-400">{label}</div>
        </div>
    </div>
);

const TechniqueEditor: React.FC<{ 
    technique: LearnedTechnique;
    onUpdate: (item: LearnedTechnique) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
}> = ({ technique, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(technique.name);
    const [description, setDescription] = useState(technique.description);
    const [parameters, setParameters] = useState(technique.parameters);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onUpdate({ ...technique, name, description, parameters });
            setIsEditing(false);
        } catch (e) {
            console.error("Failed to save technique:", e);
        } finally {
            setIsSaving(false);
        }
    };
    
    const isStrategy = technique.type === 'Strategy';
    const Icon = isStrategy ? Lightbulb : BookOpen;
    const color = isStrategy ? 'text-amber-400' : 'text-purple-400';

    return (
        <div className="p-4 bg-gray-900/40 rounded-lg border border-gray-700/60 text-sm">
            <div className="flex justify-between items-start gap-4">
                <div className="flex-grow space-y-2">
                     {isEditing ? (
                         <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-900/80 border border-gray-600 rounded-lg p-2 font-semibold text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                     ) : (
                        <div className={`font-semibold ${color} flex items-center gap-2`}>
                            <Icon className="w-5 h-5" />
                            {technique.name}
                        </div>
                     )}
                     {isEditing ? (
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-gray-900/80 border border-gray-600 rounded-lg p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[80px]"
                            placeholder="توضیحات"
                        />
                    ) : (
                        <p className="text-gray-300 whitespace-pre-line">{technique.description}</p>
                    )}
                     {isEditing ? (
                        <input
                            value={parameters}
                            onChange={(e) => setParameters(e.target.value)}
                            className="w-full bg-gray-900/80 border border-gray-600 rounded-lg p-2 text-xs text-gray-400 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                             placeholder="پارامترها"
                        />
                    ) : (
                        <p className="text-xs text-gray-400 font-mono bg-black/30 p-2 rounded">پارامترها: {technique.parameters}</p>
                    )}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                    {isEditing ? (
                         <button onClick={handleSave} disabled={isSaving} className="p-2 rounded-full text-gray-300 bg-emerald-700/80 hover:bg-emerald-600 transition-colors">
                            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                        </button>
                    ) : (
                         <button onClick={() => setIsEditing(true)} className="p-2 rounded-full text-gray-300 hover:bg-sky-700 hover:text-white transition-colors">
                            <Edit className="h-5 w-5" />
                        </button>
                    )}
                     <button onClick={() => onDelete(technique.id!)} className="p-2 rounded-full text-gray-400 hover:bg-red-800 hover:text-red-300 transition-colors">
                        <Trash2 className="h-5 w-5" />
                    </button>
                </div>
            </div>
             {isEditing && (
                <button onClick={() => { setIsEditing(false); setName(technique.name); setDescription(technique.description); setParameters(technique.parameters); }} className="text-xs text-gray-400 hover:text-white mt-2">
                    لغو
                </button>
            )}
        </div>
    );
};

const AddTechniqueForm: React.FC<{ onAdd: UserPanelProps['onAddTechnique'] }> = ({ onAdd }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<TechniqueType>('Strategy');
    const [description, setDescription] = useState('');
    const [parameters, setParameters] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !description) return;
        setIsAdding(true);
        try {
            await onAdd({ name, type, description, parameters: parameters || 'N/A', source: 'manual' });
            setName('');
            setType('Strategy');
            setDescription('');
            setParameters('');
        } finally {
            setIsAdding(false);
        }
    };
    
    return (
        <form onSubmit={handleAdd} className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/50 space-y-3">
             <h4 className="font-semibold text-gray-200">افزودن تکنیک جدید به صورت دستی</h4>
             <input value={name} onChange={e => setName(e.target.value)} placeholder="نام استراتژی/اندیکاتور" required className="w-full bg-gray-900/50 p-2 rounded-md border border-gray-600 focus:ring-sky-500 focus:border-sky-500"/>
             <select value={type} onChange={e => setType(e.target.value as TechniqueType)} className="w-full bg-gray-900/50 p-2 rounded-md border border-gray-600 focus:ring-sky-500 focus:border-sky-500">
                <option value="Strategy">استراتژی</option>
                <option value="Indicator">اندیکاتور</option>
             </select>
             <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="توضیحات کامل..." required className="w-full bg-gray-900/50 p-2 rounded-md border border-gray-600 focus:ring-sky-500 focus:border-sky-500 min-h-[100px]"/>
             <input value={parameters} onChange={e => setParameters(e.target.value)} placeholder="پارامترها (اختیاری)" className="w-full bg-gray-900/50 p-2 rounded-md border border-gray-600 focus:ring-sky-500 focus:border-sky-500"/>
             <button type="submit" disabled={isAdding} className="w-full flex justify-center items-center gap-2 p-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-500 disabled:bg-sky-800">
                {isAdding ? <Loader2 className="animate-spin" /> : <PlusCircle />}
                افزودن
             </button>
        </form>
    )
}


export const UserPanel: React.FC<UserPanelProps> = ({ isOpen, onClose, stats, onExportAllData, onDeleteAllData, onStartTour, knowledgeItems, onUpdateKnowledgeItem, onDeleteKnowledgeItem, onImportFileSelect, techniques, onAddTechnique, onUpdateTechnique, onDeleteTechnique, onDiscoverNewTechniques, isDiscovering }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('actions');
    const importInputRef = useRef<HTMLInputElement>(null);

    const handleDelete = () => {
        const confirmed = window.confirm(
          'آیا مطمئن هستید؟ با این کار تمام تاریخچه، تحلیل‌های ذخیره شده، فایل‌های آرشیو، واچ‌لیست و دانش سفارشی شما برای همیشه حذف خواهند شد. این عمل غیرقابل بازگشت است.'
        );
        if (confirmed) {
          setIsDeleting(true);
          onDeleteAllData().finally(() => {
            setIsDeleting(false);
            onClose();
          });
        }
    };
    
    const handleStartTourClick = () => {
        onClose();
        setTimeout(onStartTour, 150);
    };

    if (!isOpen) return null;

    const TabButton = ({ tab, label, icon }: { tab: Tab, label: string, icon: React.ReactNode }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab 
                ? 'text-sky-300 border-sky-400' 
                : 'text-gray-400 border-transparent hover:text-white hover:bg-gray-700/50'
            }`}
        >
            {icon} {label}
        </button>
    );

    const renderContent = () => {
        switch(activeTab) {
            case 'knowledge':
                return (
                    <div className="animate-fade-in space-y-4">
                        <p className="text-sm text-gray-400">
                           در این بخش می‌توانید دانش سفارشی خود را مدیریت کنید. این دانش در تحلیل‌های آینده توسط هوش مصنوعی استفاده خواهد شد.
                        </p>
                        <div className="p-4 bg-gray-900/30 rounded-lg border border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <h4 className="font-semibold text-gray-200">کشف دانش از وب</h4>
                                <p className="text-xs text-gray-500 mt-1">به هوش مصنوعی اجازه دهید استراتژی‌ها و اندیکاتورهای جدید را از اینترنت پیدا کند.</p>
                            </div>
                            <button
                                onClick={onDiscoverNewTechniques}
                                disabled={isDiscovering}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-300 transform hover:scale-105 bg-emerald-800/30 border-emerald-700/60 text-emerald-300 hover:bg-emerald-700/50 hover:border-emerald-600 w-full md:w-auto flex-shrink-0 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDiscovering ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                {isDiscovering ? 'در حال جستجو...' : 'کشف تکنیک‌های جدید'}
                            </button>
                        </div>
                         <div className="max-h-[500px] overflow-y-auto space-y-3 p-2 bg-black/20 rounded-lg">
                           <AddTechniqueForm onAdd={onAddTechnique} />
                            {techniques.length > 0 ? (
                                techniques.map(item => <TechniqueEditor key={item.id} technique={item} onUpdate={onUpdateTechnique} onDelete={onDeleteTechnique} />)
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <BrainCircuit size={40} className="mx-auto" />
                                    <p className="mt-2">کتابخانه دانش شما خالی است.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'policy':
                return (
                     <div className="animate-fade-in space-y-4">
                        <h3 className="text-lg font-semibold text-gray-200">حریم خصوصی و داده‌های شما</h3>
                        <div className="space-y-3 text-sm text-gray-300 leading-relaxed p-4 bg-gray-900/40 rounded-lg border border-gray-700/60">
                            <p>
                                <strong>ما به حریم خصوصی شما احترام می‌گذاریم.</strong> این برنامه با اولویت امنیت و کنترل کاربر طراحی شده است.
                            </p>
                            <p className="flex items-start gap-3">
                                <ShieldCheck className="w-8 h-5 text-emerald-400 mt-1 flex-shrink-0" />
                                <span>
                                    <strong>ذخیره‌سازی محلی:</strong> تمام داده‌های شما، شامل تاریخچه تحلیل‌ها، دانش سفارشی، فایل‌های آپلود شده و واچ‌لیست شما، به صورت ایمن <strong className="text-emerald-300">فقط در مرورگر شما</strong> (توسط IndexedDB) ذخیره می‌شوند.
                                </span>
                            </p>
                            <p className="flex items-start gap-3">
                                <Zap className="w-8 h-5 text-sky-400 mt-1 flex-shrink-0" />
                                 <span>
                                    <strong>ارتباط با AI:</strong> برای انجام تحلیل، فقط اطلاعات ضروری (مانند نام نماد، تایم‌فریم و...) به همراه کلید API تنظیم شده در محیط برنامه، به صورت امن به سرورهای Google ارسال می‌شود.
                                </span>
                            </p>
                            <p>
                                شما کنترل کامل بر داده‌های خود دارید و هر زمان که بخواهید می‌توانید از طریق همین پنل، تمام اطلاعات را حذف کنید.
                            </p>
                        </div>
                    </div>
                );
            case 'actions':
            default:
                return (
                     <div className="animate-fade-in">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-200 mb-4">آمار کلی</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                                <StatCard icon={<History size={32} className="text-sky-400"/>} label="تحلیل در تاریخچه" value={stats.historyCount} color="border-sky-700/50" />
                                <StatCard icon={<Save size={32} className="text-amber-400"/>} label="تحلیل ذخیره شده" value={stats.savedCount} color="border-amber-700/50" />
                                <StatCard icon={<Star size={32} className="text-yellow-400"/>} label="نماد در واچ‌لیست" value={stats.watchlistCount} color="border-yellow-700/50" />
                                <StatCard icon={<FolderArchive size={32} className="text-emerald-400"/>} label="فایل در آرشیو" value={stats.filesCount} color="border-emerald-700/50" />
                                <StatCard icon={<BrainCircuit size={32} className="text-purple-400"/>} label="تکنیک سفارشی" value={stats.techniqueCount} color="border-purple-700/50" />
                                <StatCard icon={<Lightbulb size={32} className="text-indigo-400"/>} label="آموخته‌های AI" value={stats.knowledgeCount} color="border-indigo-700/50" />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-200 mb-4">ابزارها و اقدامات</h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-900/30 rounded-lg border border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div>
                                        <h4 className="font-semibold text-gray-200">راهنمای شروع به کار</h4>
                                        <p className="text-xs text-gray-500 mt-1">آیا با برنامه آشنایی ندارید؟ راهنمای ما را دنبال کنید.</p>
                                    </div>
                                    <button
                                        onClick={handleStartTourClick}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-300 transform hover:scale-105 bg-sky-800/30 border-sky-700/60 text-sky-300 hover:bg-sky-700/50 hover:border-sky-600 w-full md:w-auto flex-shrink-0 justify-center"
                                    >
                                        <Zap size={18} />
                                        شروع راهنما
                                    </button>
                                </div>
                                <div className="p-4 bg-gray-900/30 rounded-lg border border-gray-700">
                                    <h4 className="font-semibold text-gray-200">پشتیبان‌گیری و بازیابی داده</h4>
                                    <p className="text-xs text-gray-500 mt-1 mb-4">از کل داده‌های برنامه (تاریخچه، تنظیمات، دانش سفارشی و...) خروجی بگیرید یا داده‌ها را از یک فایل پشتیبان بازیابی کنید.</p>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <input type="file" ref={importInputRef} onChange={onImportFileSelect} className="hidden" accept=".json" />
                                        <button
                                            onClick={() => importInputRef.current?.click()}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-300 transform hover:scale-105 bg-sky-800/30 border-sky-700/60 text-sky-300 hover:bg-sky-700/50 hover:border-sky-600"
                                        >
                                            <FileUp size={18} />
                                            بازیابی از فایل...
                                        </button>
                                        <button
                                            onClick={onExportAllData}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-300 transform hover:scale-105 bg-emerald-800/30 border-emerald-700/60 text-emerald-300 hover:bg-emerald-700/50 hover:border-emerald-600"
                                        >
                                            <FileDown size={18} />
                                            پشتیبان‌گیری
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 bg-red-900/20 rounded-lg border border-red-700/50 flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div>
                                        <h4 className="font-semibold text-red-300">حذف تمام داده‌ها (غیرقابل بازگشت)</h4>
                                        <p className="text-xs text-red-400/80 mt-1">تمام اطلاعات شما از جمله تاریخچه، موارد ذخیره شده، فایل‌ها و واچ‌لیست برای همیشه پاک می‌شود.</p>
                                    </div>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-300 transform hover:scale-105 bg-red-800/30 border-red-700/60 text-red-300 hover:bg-red-700/50 hover:border-red-600 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto flex-shrink-0 justify-center"
                                    >
                                        {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                        {isDeleting ? 'در حال حذف...' : 'حذف همه چیز'}
                                    </button>
                                </div>
                            </div>
                        </div>
                     </div>
                );
        }
    }


    return (
        <div 
            className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex justify-center items-start z-[60] animate-fade-in overflow-y-auto"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700 w-full max-w-3xl p-6 my-8 animate-slide-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 border-b border-gray-700/70 pb-4">
                    <h2 className="text-2xl font-bold text-sky-300">پنل کاربری</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="flex items-center border-b border-gray-700/70 mb-6 overflow-x-auto">
                    <TabButton tab="actions" label="آمار و ابزارها" icon={<Zap size={16}/>} />
                    <TabButton tab="knowledge" label="کتابخانه دانش" icon={<BrainCircuit size={16}/>} />
                    <TabButton tab="policy" label="سیاست داده‌ها" icon={<ShieldCheck size={16}/>} />
                </div>

                <div className="min-h-[400px]">
                    {renderContent()}
                </div>

            </div>
        </div>
    );
};
