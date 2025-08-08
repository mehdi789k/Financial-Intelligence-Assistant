

import React, { useCallback, useState, useMemo } from 'react';
import type { UploadedFile, FileCategory, LearnedTechnique } from '../types';
import { FileCategories } from '../types';
import { categorizeFileContent, extractTechniquesFromFileContent } from '../services/geminiService';
import { 
    UploadCloud, 
    FileText, 
    Power, 
    Trash2, 
    Loader2, 
    ChevronDown, 
    ChevronUp,
    Database,
    Lightbulb,
    Newspaper,
    ClipboardList,
    File as FileIcon,
    AlertCircle,
    Image as ImageIcon,
    BrainCircuit
} from 'lucide-react';

interface FileUploadProps {
  symbol: string;
  archivedFiles: UploadedFile[];
  addFilesToArchive: (newFiles: UploadedFile[]) => Promise<void>;
  removeFileFromArchive: (fileName: string) => void;
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  isArchiveReady: boolean;
  disabled?: boolean;
  onFileProcessedForLearning: (file: UploadedFile) => void;
}

interface Notification {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

const categoryInfo: Record<FileCategory, { icon: React.ElementType, color: string }> = {
    'داده‌های بازار': { icon: Database, color: 'text-sky-400' },
    'استراتژی شخصی': { icon: Lightbulb, color: 'text-amber-400' },
    'اخبار و مقالات': { icon: Newspaper, color: 'text-emerald-400' },
    'گزارش‌های تحلیلی': { icon: ClipboardList, color: 'text-purple-400' },
    'تصویر چارت': { icon: ImageIcon, color: 'text-indigo-400' },
    'سایر': { icon: FileIcon, color: 'text-gray-400' }
};

const sha256 = async (text: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const FileUpload: React.FC<FileUploadProps> = ({
  symbol,
  archivedFiles,
  addFilesToArchive,
  removeFileFromArchive,
  isEnabled,
  setIsEnabled,
  isArchiveReady,
  disabled = false,
  onFileProcessedForLearning,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [openCategories, setOpenCategories] = useState<Record<FileCategory, boolean>>(() => {
    const state: any = {};
    FileCategories.forEach(c => state[c] = true);
    return state;
  });

  const addNotification = (message: string, type: Notification['type'] = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, 6000);
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const filesToProcess = event.target.files;
    if (!filesToProcess || filesToProcess.length === 0 || !symbol) return;

    setIsProcessing(true);
    setProcessingStatus('شروع پردازش...');

    const existingContentHashMap = new Map<string, string>(archivedFiles.map(f => [f.contentHash, f.name]));
    const existingNameMap = new Map<string, UploadedFile>(archivedFiles.map(f => [f.name, f]));
    const batchContentHashMap = new Map<string, string>();
    
    const filesToUpload: UploadedFile[] = [];
    let addedCount = 0;
    let updatedCount = 0;
    let ignoredCount = 0;
    let learningTriggered = false;

    for (const file of Array.from(filesToProcess)) {
        setProcessingStatus(`در حال خواندن ${file.name}...`);
        try {
            const content = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (readEvent) => resolve(readEvent.target?.result as string);
                reader.onerror = (_err) => reject(new Error(`Error reading file: ${file.name}`));
                if (file.type.startsWith('image/')) {
                    reader.readAsDataURL(file);
                } else {
                    reader.readAsText(file);
                }
            });

            if (!content) continue;

            setProcessingStatus(`در حال هش‌کردن ${file.name}...`);
            const contentHash = await sha256(content);

            if (batchContentHashMap.has(contentHash)) {
                addNotification(`فایل "${file.name}" محتوای تکراری با فایل دیگر در همین آپلود دارد.`, 'warning');
                ignoredCount++;
                continue;
            }

            const isImage = file.type.startsWith('image/');
            let newFile: UploadedFile | null = null;
            
            setProcessingStatus(`در حال دسته‌بندی ${file.name}...`);
            const category = isImage ? 'تصویر چارت' : await categorizeFileContent(content);
            const fileWithSymbol = { name: file.name, type: file.type, size: file.size, content, contentHash, category, symbol };


            const existingFileWithSameName = existingNameMap.get(file.name);
            if (existingFileWithSameName) {
                if (existingFileWithSameName.contentHash === contentHash) {
                    addNotification(`فایل "${file.name}" بدون تغییر باقی ماند.`, 'info');
                    ignoredCount++;
                } else {
                    // UPDATE
                    newFile = fileWithSymbol;
                    filesToUpload.push(newFile);
                    batchContentHashMap.set(contentHash, file.name);
                    updatedCount++;
                }
            } else {
                 if (existingContentHashMap.has(contentHash)) {
                    addNotification(`محتوای فایل "${file.name}" با فایل موجود "${existingContentHashMap.get(contentHash)}" برای این نماد یکسان است.`, 'warning');
                    ignoredCount++;
                } else {
                    // ADD NEW
                    newFile = fileWithSymbol;
                    filesToUpload.push(newFile);
                    batchContentHashMap.set(contentHash, file.name);
                    addedCount++;
                }
            }
            
            // Trigger learning process for new/updated text files
            if (newFile && !isImage) {
                setProcessingStatus(`در حال استخراج دانش از ${file.name}...`);
                onFileProcessedForLearning(newFile);
                learningTriggered = true;
            }

        } catch (err: any) {
            console.error('Error processing file:', file.name, err);
             const isRateLimitError = (err?.error?.code === 429) || (err?.error?.status === 'RESOURCE_EXHAUSTED') || JSON.stringify(err).toLowerCase().includes('resource_exhausted');
            if (isRateLimitError) {
                addNotification('محدودیت درخواست API. پردازش متوقف شد. لطفاً یک دقیقه صبر کرده و دوباره امتحان کنید.', 'error');
                break;
            } else {
                addNotification(`خطا در پردازش فایل ${file.name}.`, 'error');
            }
        }
    }

    if (filesToUpload.length > 0) {
        setProcessingStatus('در حال ذخیره فایل‌ها در آرشیو...');
        try {
            await addFilesToArchive(filesToUpload);
            let summaryMessage = [];
            if (addedCount > 0) summaryMessage.push(`${addedCount} فایل جدید اضافه شد`);
            if (updatedCount > 0) summaryMessage.push(`${updatedCount} فایل به‌روزرسانی شد`);
            if (summaryMessage.length > 0) {
                addNotification(summaryMessage.join(' و ') + '.', 'success');
            }
            if (learningTriggered) {
                addNotification('هوش مصنوعی در حال بررسی فایل‌ها برای یادگیری است...', 'info');
            }
        } catch (error) {
            console.error("Error saving files:", error);
            addNotification(`خطا در ذخیره فایل‌ها.`, 'error');
        }
    }
    
    setProcessingStatus('');
    setIsProcessing(false);
    if (event.target) {
        event.target.value = '';
    }
  }, [symbol, addFilesToArchive, archivedFiles, onFileProcessedForLearning]);


  const handleRemoveFile = async (fileName: string) => {
    await removeFileFromArchive(fileName);
  };
  
  const handleToggle = () => {
    if (!disabled) {
        setIsEnabled(!isEnabled);
    }
  };
  
  const groupedFiles = useMemo(() => {
    const groups = {} as Record<FileCategory, UploadedFile[]>;
    FileCategories.forEach(cat => groups[cat] = []);
    archivedFiles.forEach(file => {
        const category = file.category || 'سایر';
        if (groups[category]) {
            groups[category].push(file);
        } else {
            groups['سایر'].push(file);
        }
    });
    return groups;
  }, [archivedFiles]);

  const effectivelyDisabled = disabled || isProcessing || !symbol;

  const renderFileArchive = () => {
    if (!isArchiveReady) {
      return (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <p className="mr-3 text-gray-400">بارگذاری آرشیو فایل...</p>
        </div>
      );
    }
    
    if (archivedFiles.length === 0) {
      return (
        <div className="text-center py-8">
            <FileText className="mx-auto h-10 w-10 text-gray-600" />
            <p className="mt-2 text-sm text-gray-500">آرشیو فایل شما برای نماد <span className="font-bold text-sky-400">{symbol || '...'}</span> خالی است.</p>
        </div>
      );
    }
    
    return (
        <div className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-2">
            {FileCategories.map(category => {
                const files = groupedFiles[category];
                if (!files || files.length === 0) return null;
                
                const { icon: CategoryIcon, color } = categoryInfo[category] || categoryInfo['سایر'];
                const isOpen = openCategories[category];
                
                return (
                    <div key={category} className="animate-fade-in">
                        <button
                            onClick={() => setOpenCategories(prev => ({...prev, [category]: !prev[category]}))}
                            className="w-full flex items-center justify-between p-2 rounded-md bg-gray-700/20 hover:bg-gray-700/40 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <CategoryIcon className={`w-5 h-5 ${color}`} />
                                <span className={`font-semibold ${color}`}>{category}</span>
                                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{files.length}</span>
                            </div>
                            <ChevronUp className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} />
                        </button>
                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                            <div className="pl-4 pt-2 space-y-2">
                                {files.map(file => {
                                    const { icon: FileTypeIcon, color: iconColor } = categoryInfo[file.category] || categoryInfo['سایر'];
                                    return (
                                        <div key={file.name} className="flex items-center justify-between bg-gray-700/30 p-2 rounded-md transition-colors hover:bg-gray-700/50">
                                          <div className="flex items-center space-x-3 space-x-reverse grow overflow-hidden">
                                            <FileTypeIcon className={`h-5 w-5 ${iconColor} flex-shrink-0`}/>
                                            <span className="text-sm text-gray-300 truncate" title={file.name}>{file.name}</span>
                                          </div>
                                          <button onClick={() => handleRemoveFile(file.name)} className="text-gray-500 hover:text-red-400 p-1 rounded-full hover:bg-red-900/50 transition-colors flex-shrink-0 ml-2">
                                            <Trash2 className="h-4 w-4"/>
                                          </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    )
  }
  
  const notificationColors: Record<Notification['type'], string> = {
      info: 'bg-sky-800 text-sky-200',
      success: 'bg-emerald-800 text-emerald-200',
      warning: 'bg-amber-800 text-amber-200',
      error: 'bg-red-800 text-red-200',
  }

  return (
    <div className={`transition-opacity ${disabled ? 'opacity-60 cursor-not-allowed' : 'opacity-100'}`}>
      <div className="flex justify-between items-center mb-2">
         <label className="block text-sm font-medium text-gray-300">
            آرشیو فایل هوشمند (اختیاری)
         </label>
         <div className="flex items-center gap-3">
             <button
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={`${isEnabled ? 'bg-sky-500' : 'bg-gray-600'} relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-inner disabled:cursor-not-allowed`}
                role="switch"
                aria-checked={isEnabled}
            >
                <span
                    aria-hidden="true"
                    className={`${isEnabled ? 'translate-x-7' : 'translate-x-1'} pointer-events-none relative inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out`}
                >
                    <span className="absolute inset-0 flex h-full w-full items-center justify-center">
                        <Power className={`h-4 w-4 transition-colors duration-300 ${isEnabled ? 'text-sky-500' : 'text-gray-400'}`} />
                    </span>
                </span>
            </button>
         </div>
      </div>
       <p className="text-xs text-gray-500 mb-2">
           با آپلود فایل‌های متنی (مقاله، استراتژی و...)، هوش مصنوعی به طور خودکار دانش جدید را استخراج و یاد می‌گیرد. فایل‌ها به نماد انتخابی شما مرتبط می‌شوند.
        </p>
      
      {isEnabled && !disabled ? (
        <div className="animate-fade-in bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
          <div className="fixed top-5 right-5 z-50 space-y-2 w-full max-w-sm">
              {notifications.map(n => (
                  <div key={n.id} className={`flex items-center gap-3 p-3 rounded-lg shadow-lg text-sm animate-fade-in ${notificationColors[n.type]}`}>
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <span className="grow">{n.message}</span>
                  </div>
              ))}
          </div>
          <div className="flex justify-center border-2 border-gray-600/80 border-dashed rounded-lg bg-gray-800/20 hover:border-sky-500 transition-colors duration-300">
            <label
              htmlFor="file-upload"
              className={`relative w-full p-4 text-center ${effectivelyDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="space-y-1 text-center">
                {isProcessing ? <Loader2 className="mx-auto h-8 w-8 text-gray-500 animate-spin" /> : <UploadCloud className="mx-auto h-8 w-8 text-gray-500" />}
                 <div className="flex flex-col items-center">
                    <span className="font-medium text-sky-400 hover:text-sky-300 text-sm">
                        {isProcessing ? processingStatus : !symbol ? 'لطفاً ابتدا یک نماد انتخاب کنید' : 'فایل‌ها را بکشید یا برای انتخاب کلیک کنید'}
                    </span>
                     { !isProcessing && symbol && <div className="flex items-center gap-2 mt-1 text-xs text-purple-400 font-semibold"><BrainCircuit size={14}/><span>قابلیت یادگیری از فایل فعال است</span></div>}
                    <p className="text-xs text-gray-500 mt-1">
                        می‌توانید چند فایل متنی یا تصویری را همزمان آپلود کنید.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        (فایل‌های مجاز: CSV, TXT, JSON, PDF, XLSX, و تصاویر)
                    </p>
                </div>
              </div>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} accept=".csv,.txt,.json,.pdf,.xlsx,image/*" disabled={effectivelyDisabled} />
            </label>
          </div>
          {renderFileArchive()}
        </div>
      ) : (
        <div className="mt-1 flex items-center justify-center px-6 min-h-[140px] border-2 border-gray-700/50 border-dashed rounded-lg bg-gray-800/20">
          <p className="text-sm text-gray-500">{disabled ? 'در حال تحلیل...' : 'آپلود فایل غیرفعال است.'}</p>
        </div>
      )}
    </div>
  );
};
