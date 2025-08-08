
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Layout } from './components/Layout';
import { SymbolInput } from './components/SymbolInput';
import { FileUpload } from './components/FileUpload';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { AnalysisHistory } from './components/AnalysisHistory';
import { Loader } from './components/Loader';
import { getFinancialAnalysis, isAiInitialized, createChatSession, extractTechniquesFromFileContent, discoverNewTechniquesFromWeb } from './services/geminiService';
import { addKnowledgeItemsToDB, getKnowledgeForContextFromDB, getAllFilesFromDB } from './services/db';
import type { AnalysisData, AnalysisRecord, UploadedFile, ChatMessage, Timeframe, RiskProfile, KnowledgeItem, AnalysisResult, SavedAnalysisRecord, Strategy, Timezone, HotSymbol, LearnedTechnique, Indicator } from './types';
import { riskProfiles, timeframes, strategies, indicators } from './types';
import { timezones } from './data/timezones';
import { useFileStore, useAnalysisHistory } from './hooks/useFileStore';
import { useSavedAnalyses } from './hooks/useSavedAnalyses';
import { useWatchlist } from './hooks/useWatchlist';
import { useKnowledge } from './hooks/useKnowledge';
import { useTechniques } from './hooks/useTechniques';
import type { Chat } from "@google/genai";
import { TimeframeSelector } from './components/TimeframeSelector';
import { TimezoneSelector } from './components/TimezoneSelector';
import { RiskProfileSelector } from './components/RiskProfileSelector';
import { StrategySelector } from './components/StrategySelector';
import { IndicatorSelector } from './components/IndicatorSelector';
import { SavedAnalyses } from './components/SavedAnalyses';
import { Watchlist } from './components/Watchlist';
import { NewsFeed } from './components/NewsFeed';
import { SaveAnalysisModal } from './components/SaveAnalysisModal';
import { UserPanel } from './components/UserPanel';
import { OnboardingTour } from './components/OnboardingTour';
import { ComparativeAnalysisModal } from './components/ComparativeAnalysisModal';
import { ImportDataModal } from './components/ImportDataModal';
import type { TourStep } from './components/OnboardingTour';
import { TourPrompt } from './components/TourPrompt';
import { MarketHotlist } from './components/MarketHotlist';
import { SymbolHotlistModal } from './components/SymbolHotlistModal';
import { TechniqueLearningModal } from './components/TechniqueLearningModal';
import { Sparkles } from 'lucide-react';

const PREFERENCES_KEY = 'financialAnalystPrefs_v2';
const TOUR_COMPLETED_KEY = 'financialAnalystTourCompleted_v2'; // Version bump for new tour logic
const CHAT_SYSTEM_INSTRUCTION = 'شما یک دستیار تحلیلگر مالی هستید. وظیفه شما پاسخ به سوالات کاربر بر اساس تحلیل ارائه شده در تاریخچه گفتگو است. پاسخ‌های خود را کوتاه، دقیق و کاملاً مرتبط با سوال کاربر ارائه دهید. تمام پاسخ‌ها باید به زبان فارسی باشند.';

const tourSteps: TourStep[] = [
    {
        selector: '#symbol-input-container',
        title: '۱. شروع تحلیل',
        content: 'نام نماد مالی مورد نظر خود را در این کادر وارد کنید. هوش مصنوعی به شما پیشنهاداتی خواهد داد.',
        position: 'bottom',
        action: { type: 'type', selector: '#main-symbol-input' }
    },
    {
        selector: '.risk-profile-selector',
        title: '۲. پروفایل ریسک',
        content: 'پروفایل ریسک خود را انتخاب کنید. این کار به هوش مصنوعی کمک می‌کند تا تحلیل و استراتژی متناسب با روحیات شما ارائه دهد.',
        position: 'bottom',
    },
    {
        selector: '.start-analysis-button',
        title: '۳. اجرای تحلیل',
        content: 'عالی! حالا روی این دکمه کلیک کنید تا تحلیل هوشمند آغاز شود.',
        position: 'top',
        action: { type: 'click', selector: '.start-analysis-button' }
    },
    {
        selector: '#dashboard-start',
        title: '۴. مشاهده نتایج',
        content: 'نتایج تحلیل شما در این داشبورد جامع نمایش داده می‌شود. می‌توانید بین تب‌های مختلف برای مشاهده جزئیات جابجا شوید.',
        position: 'top',
    },
    {
        selector: '.user-panel-button',
        title: '۵. پنل کاربری',
        content: 'از اینجا به آمار، مدیریت داده‌ها و شروع مجدد این راهنما دسترسی خواهید داشت.',
        position: 'left',
    }
];

const GlobalLoader: React.FC<{ message: string }> = ({ message }) => (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-[100] animate-fade-in">
        <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-2 border-sky-500/30 rounded-full animate-ping"></div>
            <div className="absolute inset-2 border-2 border-emerald-500/30 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-emerald-400 rounded-full shadow-lg shadow-sky-500/50 animate-pulse"></div>
            </div>
        </div>
        <p className="mt-6 text-lg text-gray-300">{message}</p>
        <p className="text-sm text-gray-500">این فرآیند ممکن است چند لحظه طول بکشد.</p>
    </div>
);


function App() {
  const [symbol, setSymbol] = useState<string>('');
  const [timeframe, setTimeframe] = useState<Timeframe>('روزانه');
  const [timezone, setTimezone] = useState<Timezone>('UTC');
  const [riskProfile, setRiskProfile] = useState<RiskProfile>('متعادل');
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([strategies[0]]);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([indicators[0], indicators[1]]);
  
  const { archivedFiles, addFilesToArchive, removeFileFromArchive, clearFiles, replaceAllFiles, isInitialized: isFileArchiveInitialized } = useFileStore();
  const { history, addAnalysisToHistory, removeAnalysisFromHistory, clearHistory, replaceAllHistory, isInitialized: isHistoryInitialized } = useAnalysisHistory();
  const { savedAnalyses, addSavedAnalysis, removeSavedAnalysis, clearSavedAnalyses, replaceAllSavedAnalyses, isInitialized: isSavedAnalysesInitialized } = useSavedAnalyses();
  const { watchlist, isInitialized: isWatchlistInitialized, addToWatchlist, removeFromWatchlist, clearWatchlist, replaceAllWatchlistItems, isSymbolInWatchlist } = useWatchlist();
  const { items: knowledgeItems, isInitialized: isKnowledgeInitialized, updateItem: updateKnowledgeItem, deleteItem: deleteKnowledgeItem, reloadItems: reloadKnowledgeItems, replaceAllKnowledge, clearKnowledge } = useKnowledge();
  const { techniques, addTechniques, updateTechnique, deleteTechnique, replaceAllTechniques, isInitialized: isTechniquesInitialized, clearTechniques } = useTechniques();
  
  const [isFileUploadEnabled, setIsFileUploadEnabled] = useState<boolean>(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // States for viewing and saving
  const [activeAnalysis, setActiveAnalysis] = useState<{ type: 'history' | 'saved', id: number } | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [importModalState, setImportModalState] = useState<{ isOpen: boolean; data: any; error: string | null }>({ isOpen: false, data: null, error: null });
  const [learningModalState, setLearningModalState] = useState<{ isOpen: boolean; techniques: LearnedTechnique[] }>({ isOpen: false, techniques: [] });
  
  // States for Chat
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // State for Knowledge Context
  const [knowledgeContextItems, setKnowledgeContextItems] = useState<KnowledgeItem[]>([]);
  
  // State for onboarding tour
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [showTourPrompt, setShowTourPrompt] = useState(false);

  // State for Hotlist Modal
  const [selectedHotSymbol, setSelectedHotSymbol] = useState<HotSymbol | null>(null);

  const analysisTriggerRef = useRef<'watchlist' | 'user'>('user');

  const filesForCurrentSymbol = useMemo(() => {
    if (!symbol) return [];
    return archivedFiles.filter(file => file.symbol === symbol);
  }, [symbol, archivedFiles]);


  // Load preferences, and check for tour on mount
  useEffect(() => {
    try {
      const savedPrefsRaw = localStorage.getItem(PREFERENCES_KEY);
      const savedPrefs = savedPrefsRaw ? JSON.parse(savedPrefsRaw) : {};
      
      if (!isAiInitialized()) {
        setError("سرویس هوش مصنوعی در دسترس نیست. ممکن است کلید API به درستی تنظیم نشده باشد.");
      }
      
      setPreferences(savedPrefs);
      
      const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
      if (!tourCompleted) {
        setTimeout(() => setShowTourPrompt(true), 1500);
      }
    } catch (e) {
        console.error("Failed to load user preferences", e);
    }
  }, []);
  
  const setPreferences = (prefs: any) => {
    if (prefs.timeframe && timeframes.includes(prefs.timeframe)) setTimeframe(prefs.timeframe);
    if (prefs.timezone && timezones.some(tz => tz.value === prefs.timezone)) setTimezone(prefs.timezone);
    if (prefs.riskProfile && riskProfiles.includes(prefs.riskProfile)) setRiskProfile(prefs.riskProfile);
    if (prefs.selectedStrategies && Array.isArray(prefs.selectedStrategies)) {
        // We trust the saved data. This allows loading custom strategies as well.
        setSelectedStrategies(prefs.selectedStrategies);
    }
    if (prefs.selectedIndicators && Array.isArray(prefs.selectedIndicators)) {
        // We trust the saved data. This allows loading custom indicators as well.
        setSelectedIndicators(prefs.selectedIndicators);
    }
  }

  // Save preferences on change
  useEffect(() => {
    try {
        const prefs = {
            timeframe,
            timezone,
            riskProfile,
            selectedStrategies,
            selectedIndicators,
        };
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
    } catch(e) {
        console.error("Failed to save user preferences", e);
    }
  }, [timeframe, timezone, riskProfile, selectedStrategies, selectedIndicators]);

  // Set default strategies and indicators based on context
  useEffect(() => {
    const newStrategies = new Set<string>();
    const newIndicators = new Set<string>();

    // --- Base Layer ---
    newStrategies.add('تحلیل تکنیکال کلاسیک');
    newStrategies.add('تحلیل بر اساس پرایس اکشن');
    newIndicators.add('RSI (شاخص قدرت نسبی)');
    newIndicators.add('MACD (مکدی)');

    // --- Timeframe Layer ---
    const shortTerm = ['5 دقیقه', '15 دقیقه'];
    const midTerm = ['1 ساعت', '4 ساعت', 'روزانه'];
    const longTerm = ['هفتگی', 'ماهانه', 'سالیانه'];

    if (shortTerm.some(t => t === timeframe)) {
        newStrategies.add('اسکالپینگ (Scalping)');
        newIndicators.add('Stochastic Oscillator (نوسان‌گر استوکاستیک)');
    }
    if (midTerm.some(t => t === timeframe)) {
        newStrategies.add('نوسان‌گیری روزانه (Day Trading)');
        newStrategies.add('نوسان‌گیری میان‌مدت (Swing Trading)');
        newIndicators.add('Bollinger Bands (باندهای بولینگر)');
    }
    if (longTerm.some(t => t === timeframe)) {
        newStrategies.add('معامله‌گری موقعیتی (Position)');
        newStrategies.add('سرمایه‌گذاری بر رشد (Growth)');
        newIndicators.add('Ichimoku Cloud (ابر ایچیموکو)');
    }

    // --- Risk Profile Layer ---
    switch (riskProfile) {
        case 'تهاجمی':
            newStrategies.add('معامله بر اساس اخبار');
            if (timeframe === '5 دقیقه' || timeframe === '15 دقیقه') {
               newStrategies.add('اسکالپینگ (Scalping)');
            }
            break;
        case 'محافظه‌کار':
            newStrategies.add('سرمایه‌گذاری ارزشی (Value)');
            break;
        case 'متعادل':
            // The base and timeframe layers are generally good for balanced.
            break;
    }

    setSelectedStrategies(Array.from(newStrategies));
    setSelectedIndicators(Array.from(newIndicators));

}, [timeframe, riskProfile]);

  const handleFileUploadToggle = (enabled: boolean) => {
    setIsFileUploadEnabled(enabled);
  };

  const handleFileLearning = useCallback(async (file: UploadedFile) => {
    if (file.type.startsWith('image/')) return; // Don't process images for text
    try {
        const extracted = await extractTechniquesFromFileContent(file.content);
        if (extracted.length > 0) {
            const techniquesWithSource: LearnedTechnique[] = extracted.map(t => ({
                ...t,
                source: 'user_upload',
                sourceFileName: file.name,
                createdAt: Date.now()
            }));
            setLearningModalState(prev => ({
                isOpen: true,
                techniques: [...prev.techniques, ...techniquesWithSource]
            }));
        }
    } catch (e) {
        console.error(`Failed to extract techniques from ${file.name}`, e);
    }
  }, []);

  const saveKnowledgeFromAnalysis = async (analysis: AnalysisResult, sourceId: number) => {
    const knowledgeItems: Omit<KnowledgeItem, 'id'>[] = [];
    const timestamp = Date.now();

    if (analysis.learnedInsights && analysis.learnedInsights !== 'در این تحلیل نکته جدیدی برای یادگیری یافت نشد.') {
        knowledgeItems.push({ sourceAnalysisId: sourceId, type: 'Insight', content: analysis.learnedInsights, symbol: analysis.symbol, timeframe: analysis.timeframe, timestamp });
    }
    if (analysis.strategy) {
        knowledgeItems.push({ sourceAnalysisId: sourceId, type: 'Strategy', content: JSON.stringify(analysis.strategy, null, 2), symbol: analysis.symbol, timeframe: analysis.timeframe, timestamp });
    }
    analysis.patterns?.forEach(pattern => {
        knowledgeItems.push({ sourceAnalysisId: sourceId, type: 'Pattern', content: `الگو: ${pattern.name} - مفهوم: ${pattern.implication} - توضیحات: ${pattern.description}`, symbol: analysis.symbol, timeframe: analysis.timeframe, timestamp });
    });

    if (knowledgeItems.length > 0) {
        try {
            await addKnowledgeItemsToDB(knowledgeItems);
            await reloadKnowledgeItems(); // reload knowledge after adding new items
        } catch (error) {
            console.error("Failed to save knowledge items to DB", error);
        }
    }
  };

  const handleAnalysis = useCallback(async () => {
    if (!isAiInitialized()) {
        setError(`سرویس هوش مصنوعی در دسترس نیست. لطفا از تنظیم بودن کلید API اطمینان حاصل کنید.`);
        return;
    }
    if (!symbol || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setAnalysisData(null);
    setActiveAnalysis(null);
    setChatSession(null);
    setChatMessages([]);
    setKnowledgeContextItems([]);

    try {
        const relevantKnowledge = await getKnowledgeForContextFromDB(symbol, timeframe, 5);
        const knowledgeContext = relevantKnowledge.map(k => `- ${k.type}: ${k.content}`).join('\n');
        setKnowledgeContextItems(relevantKnowledge);
        
        const customStrategies = techniques.filter(t => t.type === 'Strategy' && selectedStrategies.includes(t.name));
        const customIndicators = techniques.filter(t => t.type === 'Indicator' && selectedIndicators.includes(t.name));
        const customTechniques = [...customStrategies, ...customIndicators];

        const builtInStrategies = strategies.filter(s => selectedStrategies.includes(s));
        const builtInIndicators = indicators.filter(i => selectedIndicators.includes(i));


        const { analysis, sources, prompt } = await getFinancialAnalysis(symbol, timeframe, timezone, riskProfile, builtInStrategies, builtInIndicators, customTechniques, filesForCurrentSymbol, knowledgeContext);
        
        const newAnalysisData = { analysis, sources, filesUsed: filesForCurrentSymbol };
        setAnalysisData(newAnalysisData);
        
        const newRecord: Omit<AnalysisRecord, 'id'> = {
            timestamp: Date.now(),
            symbol,
            timeframe,
            timezone,
            filesUsed: filesForCurrentSymbol,
            analysis,
            sources,
            prompt,
        };
        
        const newId = await addAnalysisToHistory(newRecord);
        if (newId) {
            await saveKnowledgeFromAnalysis(analysis, newId);
            setActiveAnalysis({ type: 'history', id: newId });
        }
    } catch (err: any) {
        setError(err.message || 'یک خطای ناشناخته در هنگام تحلیل رخ داد.');
    } finally {
        setIsLoading(false);
    }
  }, [symbol, timeframe, timezone, riskProfile, selectedStrategies, selectedIndicators, techniques, filesForCurrentSymbol, addAnalysisToHistory, reloadKnowledgeItems, isLoading]);

    // Effect to trigger analysis from watchlist
    useEffect(() => {
        if (analysisTriggerRef.current === 'watchlist' && symbol && !isLoading) {
            handleAnalysis();
            analysisTriggerRef.current = 'user'; // Reset trigger
        }
    }, [symbol, isLoading, handleAnalysis]);


  const handleSendMessage = useCallback(async (message: string) => {
    if (!chatSession || isChatLoading) return;
    
    setIsChatLoading(true);

    const userMessage: ChatMessage = {
      role: 'user',
      parts: [{ text: message }],
      timestamp: Date.now(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    
    try {
        const response = await chatSession.sendMessage({ message });
        
        const modelMessage: ChatMessage = {
            role: 'model',
            parts: [{ text: response.text }],
            timestamp: Date.now(),
        };
        setChatMessages(prev => [...prev, modelMessage]);
    } catch(err) {
        console.error("Chat error:", err);
        const errorMessage: ChatMessage = {
            role: 'model',
            parts: [{ text: "متاسفانه در پاسخ به شما مشکلی پیش آمد." }],
            timestamp: Date.now(),
        };
        setChatMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsChatLoading(false);
    }
  }, [chatSession, isChatLoading]);
  
  const resetAndLoadChat = (record: AnalysisRecord | SavedAnalysisRecord) => {
    if (!isAiInitialized()) return;
    
    // Remove timestamp property, which is not part of the AI model's history type
    const chatHistoryForModel = (record.chatHistory || []).map(({ role, parts }) => ({ role, parts }));
    
    const model = createChatSession(chatHistoryForModel, CHAT_SYSTEM_INSTRUCTION);

    if (model) {
      setChatSession(model);
      setChatMessages(record.chatHistory || []);
    } else {
        setError("امکان ایجاد جلسه چت وجود ندارد.");
    }
  };

  const handleViewHistory = useCallback((id: number) => {
    const record = history.find(r => r.id === id);
    if (record) {
      setAnalysisData({ analysis: record.analysis, sources: record.sources, filesUsed: record.filesUsed });
      setSymbol(record.symbol);
      setTimeframe(record.timeframe);
      setTimezone(record.timezone);
      setError(null);
      setActiveAnalysis({ type: 'history', id });
      resetAndLoadChat(record);
      setKnowledgeContextItems([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [history]);

  const handleDeleteHistory = useCallback(async (id: number) => {
    await removeAnalysisFromHistory(id);
    if (activeAnalysis && activeAnalysis.type === 'history' && activeAnalysis.id === id) {
        setAnalysisData(null);
        setActiveAnalysis(null);
    }
  }, [removeAnalysisFromHistory, activeAnalysis]);

  const handleOpenSaveModal = useCallback(() => {
    if (analysisData) {
      setIsSaveModalOpen(true);
    }
  }, [analysisData]);

  const handleSaveAnalysis = useCallback(async (name: string) => {
    if (!analysisData || activeAnalysis?.type !== 'history') return;

    const sourceRecord = history.find(h => h.id === activeAnalysis.id);
    if (!sourceRecord) return;

    const savedRecord: Omit<SavedAnalysisRecord, 'id'> = {
        name,
        timestamp: Date.now(),
        symbol: sourceRecord.symbol,
        timeframe: sourceRecord.timeframe,
        timezone: sourceRecord.timezone,
        filesUsed: sourceRecord.filesUsed,
        analysis: analysisData.analysis,
        sources: analysisData.sources,
        prompt: sourceRecord.prompt,
        chatHistory: chatMessages
    };

    const newId = await addSavedAnalysis(savedRecord);
    if (newId) {
        setActiveAnalysis({ type: 'saved', id: newId });
    }
    setIsSaveModalOpen(false);
  }, [analysisData, activeAnalysis, history, chatMessages, addSavedAnalysis]);

  const handleLoadSavedAnalysis = useCallback((id: number) => {
    const record = savedAnalyses.find(r => r.id === id);
     if (record) {
      setAnalysisData({ analysis: record.analysis, sources: record.sources, filesUsed: record.filesUsed });
      setSymbol(record.symbol);
      setTimeframe(record.timeframe);
      setTimezone(record.timezone);
      setError(null);
      setActiveAnalysis({ type: 'saved', id });
      resetAndLoadChat(record);
      setKnowledgeContextItems([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [savedAnalyses]);

  const handleDeleteSavedAnalysis = useCallback(async (id: number) => {
    await removeSavedAnalysis(id);
     if (activeAnalysis && activeAnalysis.type === 'saved' && activeAnalysis.id === id) {
        setAnalysisData(null);
        setActiveAnalysis(null);
    }
  }, [removeSavedAnalysis, activeAnalysis]);
  
  const handleSelectFromWatchlist = useCallback((selectedSymbol: string) => {
    analysisTriggerRef.current = 'watchlist';
    setSymbol(selectedSymbol);
  }, []);
  
  const handleExportAllData = useCallback(async () => {
    const allArchivedFiles = await getAllFilesFromDB();
    const allData = {
      history,
      savedAnalyses,
      archivedFiles: allArchivedFiles,
      watchlist,
      knowledgeItems,
      techniques,
      preferences: {
        timeframe,
        timezone,
        riskProfile,
        selectedStrategies,
        selectedIndicators,
        tourCompleted: localStorage.getItem(TOUR_COMPLETED_KEY) === 'true',
      }
    };
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial_analyst_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [history, savedAnalyses, watchlist, knowledgeItems, techniques, timeframe, timezone, riskProfile, selectedStrategies, selectedIndicators]);

  const handleImportFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            const data = JSON.parse(text as string);
            // Basic validation
            if (typeof data !== 'object' || data === null) {
                throw new Error("فایل معتبر نیست.");
            }
            setImportModalState({ isOpen: true, data, error: null });
        } catch (err) {
            setImportModalState({ isOpen: true, data: null, error: "فایل پشتیبان نامعتبر است یا در خواندن آن مشکلی پیش آمد." });
        }
    };
    reader.onerror = () => {
        setImportModalState({ isOpen: true, data: null, error: "خطا در خواندن فایل." });
    };
    reader.readAsText(file);
    
    // Reset file input
    if(event.target) event.target.value = '';
  };
  
  const handleConfirmImport = async (selections: Record<string, boolean>) => {
    const data = importModalState.data;
    if (!data) return;

    const importPromises = [];

    if (selections.history && data.history) importPromises.push(replaceAllHistory(data.history));
    if (selections.savedAnalyses && data.savedAnalyses) importPromises.push(replaceAllSavedAnalyses(data.savedAnalyses));
    if (selections.archivedFiles && data.archivedFiles) importPromises.push(replaceAllFiles(data.archivedFiles));
    if (selections.watchlist && data.watchlist) importPromises.push(replaceAllWatchlistItems(data.watchlist));
    if (selections.knowledgeItems && data.knowledgeItems) importPromises.push(replaceAllKnowledge(data.knowledgeItems));
    if (selections.techniques && data.techniques) importPromises.push(replaceAllTechniques(data.techniques));

    await Promise.all(importPromises);
    
    if (selections.preferences && data.preferences) {
        setPreferences(data.preferences);
        if (data.preferences.tourCompleted) {
            localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
        } else {
            localStorage.removeItem(TOUR_COMPLETED_KEY);
        }
    }
    
    setImportModalState({ isOpen: false, data: null, error: null });
    // Reload knowledge separately if not already reloaded by other hooks
    if(selections.knowledgeItems && !selections.history) await reloadKnowledgeItems();
  };
  
  const handleSaveLearnedTechniques = async (techniquesToSave: Omit<LearnedTechnique, 'id'>[]) => {
      try {
          await addTechniques(techniquesToSave);
      } catch (e) {
          console.error("Error saving new techniques", e);
          setError("خطا در ذخیره تکنیک‌های جدید.");
      }
      setLearningModalState({ isOpen: false, techniques: [] });
  };
  
    const handleAddTechnique = useCallback(async (technique: Omit<LearnedTechnique, 'id' | 'createdAt'>) => {
        await addTechniques([{
            ...technique,
            createdAt: Date.now()
        }]);
    }, [addTechniques]);

  const handleSelectHotSymbol = (hotSymbol: HotSymbol) => {
      setSelectedHotSymbol(hotSymbol);
  };
  
  const handleAnalyzeHotSymbol = (symbolToAnalyze: string) => {
      setSelectedHotSymbol(null); // Close modal
      analysisTriggerRef.current = 'watchlist'; // Use same logic to trigger analysis
      setSymbol(symbolToAnalyze);
  };

  const handleStartTour = () => {
      setShowTourPrompt(false);
      setIsTourOpen(true);
  };
  
  const handleCloseTour = () => {
      setIsTourOpen(false);
      localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
  };

  const handleDiscoverNewTechniques = useCallback(async () => {
    setIsUserPanelOpen(false);
    setIsDiscovering(true);
    setError(null);
    try {
        const discovered = await discoverNewTechniquesFromWeb(techniques);
        if (discovered && discovered.length > 0) {
            const techniquesWithSource: LearnedTechnique[] = discovered.map(t => ({
                ...t,
                source: 'web_discovery',
                createdAt: Date.now()
            }));
            setLearningModalState({
                isOpen: true,
                techniques: techniquesWithSource
            });
        } else {
            alert('هوش مصنوعی هیچ تکنیک جدید و قابل توجهی در وب پیدا نکرد.');
        }
    } catch (err: any) {
        setError(err.message || 'خطا در هنگام کشف تکنیک‌های جدید از وب.');
    } finally {
        setIsDiscovering(false);
    }
  }, [techniques]);

  const allReady = isFileArchiveInitialized && isHistoryInitialized && isSavedAnalysesInitialized && isWatchlistInitialized && isKnowledgeInitialized && isTechniquesInitialized;
  const isAnalysisRunning = isLoading || isDiscovering;
  const learnedStrategies = techniques.filter(t => t.type === 'Strategy');
  const learnedIndicators = techniques.filter(t => t.type === 'Indicator');
  
  const activeAnalysisIsSaved = !!(activeAnalysis && activeAnalysis.type === 'saved');

  return (
    <>
      {isDiscovering && <GlobalLoader message="هوش مصنوعی در حال جستجو در وب برای دانش جدید است..." />}
      <Layout onOpenUserPanel={() => setIsUserPanelOpen(true)} onOpenCompare={() => setIsCompareModalOpen(true)}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-7xl mx-auto space-y-8">

                <div className="bg-gray-900/30 backdrop-blur-xl rounded-2xl shadow-xl shadow-sky-900/10 p-6 md:p-8 border border-gray-700/50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div id="symbol-input-container" className="lg:col-span-2">
                             <SymbolInput symbol={symbol} setSymbol={setSymbol} disabled={isAnalysisRunning} id="main-symbol-input"/>
                        </div>
                        <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} disabled={isAnalysisRunning} />
                        <RiskProfileSelector riskProfile={riskProfile} setRiskProfile={setRiskProfile} disabled={isAnalysisRunning} />
                         <div className="lg:col-span-2">
                            <TimezoneSelector timezone={timezone} setTimezone={setTimezone} disabled={isAnalysisRunning} />
                        </div>
                    </div>
                     <div className="mt-8">
                        <StrategySelector selectedStrategies={selectedStrategies} setSelectedStrategies={setSelectedStrategies} learnedStrategies={learnedStrategies} disabled={isAnalysisRunning} />
                    </div>
                     <div className="mt-8">
                        <IndicatorSelector selectedIndicators={selectedIndicators} setSelectedIndicators={setSelectedIndicators} learnedIndicators={learnedIndicators} disabled={isAnalysisRunning} />
                    </div>
                     <div className="mt-8">
                        <FileUpload
                            symbol={symbol}
                            archivedFiles={filesForCurrentSymbol}
                            addFilesToArchive={addFilesToArchive}
                            removeFileFromArchive={(fileName: string) => {
                                if (symbol) {
                                  removeFileFromArchive({ symbol, name: fileName });
                                }
                            }}
                            isEnabled={isFileUploadEnabled}
                            setIsEnabled={handleFileUploadToggle}
                            isArchiveReady={isFileArchiveInitialized}
                            disabled={isAnalysisRunning}
                            onFileProcessedForLearning={handleFileLearning}
                        />
                    </div>
                    <div className="mt-8 text-center">
                        <button 
                            onClick={handleAnalysis} 
                            disabled={!symbol || isAnalysisRunning || !allReady}
                            className="start-analysis-button group relative inline-flex items-center justify-center w-full md:w-auto px-12 py-3 text-lg font-bold text-white bg-gradient-to-r from-sky-500 to-emerald-600 rounded-lg shadow-lg hover:shadow-sky-500/40 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                        >
                            <span className="absolute -inset-0.5 -z-10 bg-gradient-to-r from-sky-500 to-emerald-600 rounded-lg blur opacity-0 group-hover:opacity-75 transition duration-500"></span>
                            <span className="relative flex items-center gap-2">
                                <Sparkles className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity" />
                                {isAnalysisRunning ? 'در حال تحلیل...' : 'شروع تحلیل هوشمند'}
                            </span>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-900/50 p-4 rounded-lg text-center text-red-200 border border-red-700">
                        <strong>خطا:</strong> {error}
                    </div>
                )}
                
                {isLoading && <Loader />}
                
                <div id="dashboard-start">
                    {analysisData && (
                        <AnalysisDashboard 
                            analysis={analysisData.analysis} 
                            sources={analysisData.sources} 
                            uploadedFiles={analysisData.filesUsed}
                            chatMessages={chatMessages}
                            isChatLoading={isChatLoading}
                            onSendMessage={handleSendMessage}
                            viewingBannerInfo={activeAnalysis ? { type: activeAnalysis.type, record: (activeAnalysis.type === 'history' ? history.find(h => h.id === activeAnalysis.id) : savedAnalyses.find(s => s.id === activeAnalysis.id))! } : null}
                            knowledgeContextItems={knowledgeContextItems}
                            onSaveRequest={handleOpenSaveModal}
                            isSaved={activeAnalysisIsSaved}
                            onToggleWatchlist={() => isSymbolInWatchlist(analysisData.analysis.symbol) ? removeFromWatchlist(analysisData.analysis.symbol) : addToWatchlist(analysisData.analysis.symbol)}
                            isInWatchlist={isSymbolInWatchlist(analysisData.analysis.symbol)}
                        />
                    )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <AnalysisHistory 
                        history={history}
                        isInitialized={isHistoryInitialized}
                        onView={handleViewHistory}
                        onDelete={handleDeleteHistory}
                        activeId={activeAnalysis?.type === 'history' ? activeAnalysis.id : null}
                     />
                    <SavedAnalyses
                        analyses={savedAnalyses}
                        isInitialized={isSavedAnalysesInitialized}
                        onLoad={handleLoadSavedAnalysis}
                        onDelete={handleDeleteSavedAnalysis}
                        activeId={activeAnalysis?.type === 'saved' ? activeAnalysis.id : null}
                    />
                     <Watchlist
                        watchlist={watchlist}
                        isInitialized={isWatchlistInitialized}
                        onSelect={handleSelectFromWatchlist}
                        onDelete={removeFromWatchlist}
                        onAdd={addToWatchlist}
                        currentSymbol={analysisData ? analysisData.analysis.symbol : null}
                    />
                    <div className="flex flex-col gap-8">
                        <NewsFeed />
                        <MarketHotlist onSymbolSelect={handleSelectHotSymbol} />
                    </div>
                </div>
            </div>
        </div>
      </Layout>

       <SaveAnalysisModal 
          isOpen={isSaveModalOpen} 
          onClose={() => setIsSaveModalOpen(false)} 
          onSave={handleSaveAnalysis} 
          defaultName={analysisData ? `تحلیل ${analysisData.analysis.symbol} در ${analysisData.analysis.timeframe}` : ''}
        />
        {isUserPanelOpen && (
             <UserPanel
              isOpen={isUserPanelOpen}
              onClose={() => setIsUserPanelOpen(false)}
              stats={{ 
                  historyCount: history.length, 
                  savedCount: savedAnalyses.length, 
                  filesCount: archivedFiles.length,
                  watchlistCount: watchlist.length,
                  knowledgeCount: knowledgeItems.length,
                  techniqueCount: techniques.length,
               }}
              onExportAllData={handleExportAllData}
              onDeleteAllData={async () => {
                await clearHistory();
                await clearSavedAnalyses();
                await clearFiles();
                await clearWatchlist();
                await clearTechniques();
                await clearKnowledge();
              }}
              onStartTour={handleStartTour}
              knowledgeItems={knowledgeItems}
              onUpdateKnowledgeItem={updateKnowledgeItem}
              onDeleteKnowledgeItem={deleteKnowledgeItem}
              onImportFileSelect={handleImportFileSelect}
              techniques={techniques}
              onAddTechnique={handleAddTechnique}
              onUpdateTechnique={updateTechnique}
              onDeleteTechnique={deleteTechnique}
              onDiscoverNewTechniques={handleDiscoverNewTechniques}
              isDiscovering={isDiscovering}
            />
        )}
         <OnboardingTour
            steps={tourSteps}
            isOpen={isTourOpen}
            onClose={handleCloseTour}
        />
        {showTourPrompt && !isTourOpen && (
            <TourPrompt 
                onStart={handleStartTour}
                onDismiss={() => {
                    setShowTourPrompt(false);
                    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
                }}
            />
        )}
         <ComparativeAnalysisModal 
            isOpen={isCompareModalOpen}
            onClose={() => setIsCompareModalOpen(false)}
        />
         <ImportDataModal 
            isOpen={importModalState.isOpen}
            onClose={() => setImportModalState({ isOpen: false, data: null, error: null })}
            onImport={handleConfirmImport}
            backupData={importModalState.data}
            error={importModalState.error}
        />
        <SymbolHotlistModal 
            isOpen={!!selectedHotSymbol}
            symbolData={selectedHotSymbol}
            onClose={() => setSelectedHotSymbol(null)}
            onAnalyze={handleAnalyzeHotSymbol}
        />
        <TechniqueLearningModal
            isOpen={learningModalState.isOpen}
            initialTechniques={learningModalState.techniques}
            onClose={() => setLearningModalState({ isOpen: false, techniques: [] })}
            onSave={handleSaveLearnedTechniques}
        />

    </>
  );
}

export default App;
