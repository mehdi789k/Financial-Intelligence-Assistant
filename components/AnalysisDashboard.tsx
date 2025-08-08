
import React, { useState } from 'react';
import type { AnalysisResult, UploadedFile, GroundingSource, ChatMessage, AnalysisRecord, SavedAnalysisRecord, KnowledgeItem } from '../types';
import { SummaryCard } from './SummaryCard';
import { TargetsTable } from './TargetsTable';
import { CandlestickChart } from './CandlestickChart';
import { FileList } from './FileList';
import { ConfidenceGauge } from './ConfidenceGauge';
import { GroundingSources } from './GroundingSources';
import { ChatInterface } from './ChatInterface';
import { TechnicalInsights } from './TechnicalInsights';
import { StrategyView } from './StrategyView';
import { SentimentGauge } from './SentimentGauge';
import { ProgressiveReveal } from './ProgressiveReveal';
import { ContextualTooltip } from './ContextualTooltip';
import { TrendingUp, TrendingDown, BrainCircuit, Signal, ShieldAlert, GitCompareArrows, AlertTriangle, Newspaper, Sparkles, FileText, BarChart, BookOpen, Activity, Save, CheckCircle, Lightbulb, Check, Moon, Star, FileDown, Loader2 } from 'lucide-react';

interface AnalysisDashboardProps {
  analysis: AnalysisResult;
  sources: GroundingSource[];
  uploadedFiles: UploadedFile[];
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  onSendMessage: (message: string) => void;
  viewingBannerInfo: { type: 'history' | 'saved', record: AnalysisRecord | SavedAnalysisRecord } | null;
  knowledgeContextItems: KnowledgeItem[];
  onSaveRequest: () => void;
  isSaved: boolean;
  onToggleWatchlist: () => void;
  isInWatchlist: boolean;
}

type Tab = 'summary' | 'chart' | 'data';

const getSignalColor = (signal: AnalysisResult['signal']) => {
  switch (signal) {
    case 'خرید قوی': return 'text-emerald-400';
    case 'خرید': return 'text-green-400';
    case 'نگهداری': return 'text-yellow-400';
    case 'فروش': return 'text-red-400';
    case 'فروش قوی': return 'text-rose-500';
    default: return 'text-gray-400';
  }
};

const getRiskColor = (risk: AnalysisResult['riskLevel']) => {
    switch (risk) {
        case 'پایین': return 'text-green-400';
        case 'متوسط': return 'text-yellow-400';
        case 'بالا': return 'text-red-400';
        default: return 'text-gray-400';
    }
}

const TabButton: React.FC<{active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode}> = ({ active, onClick, children, icon }) => (
  <button
    onClick={onClick}
    className={`relative flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-all duration-300 w-full md:w-auto
      ${active
        ? 'text-sky-300'
        : 'text-gray-400 hover:text-gray-100'
      }`}
  >
    {icon}
    <span className="relative z-10">{children}</span>
    {active && (
        <span
         className="absolute inset-x-0 bottom-0 h-0.5 bg-sky-400 rounded-full z-0 underline-grow-active"
       ></span>
    )}
  </button>
);


export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ 
  analysis, 
  sources, 
  uploadedFiles,
  chatMessages,
  isChatLoading,
  onSendMessage,
  viewingBannerInfo,
  knowledgeContextItems,
  onSaveRequest,
  isSaved,
  onToggleWatchlist,
  isInWatchlist
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [isExporting, setIsExporting] = useState(false);
  const [highlightedPattern, setHighlightedPattern] = useState<AnalysisResult['patterns'][0] | null>(null);
  const dashboardRef = React.useRef<HTMLDivElement>(null);

  const handleExportPdf = async () => {
    if (!dashboardRef.current || isExporting) return;

    setIsExporting(true);

    try {
        const { default: jsPDF } = await import('jspdf');
        const { default: html2canvas } = await import('html2canvas');

        const canvas = await html2canvas(dashboardRef.current, {
            scale: 2,
            backgroundColor: '#0c111d',
            useCORS: true,
            ignoreElements: (element) => element.classList.contains('ignore-pdf'),
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / pdfWidth;
        const imgHeightOnPdf = canvasHeight / ratio;
        
        let heightLeft = imgHeightOnPdf;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightOnPdf);
        heightLeft -= pdfHeight;

        let page = 1;
        while (heightLeft > 0) {
            position = -pdfHeight * page;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightOnPdf);
            heightLeft -= pdfHeight;
            page++;
        }
        
        const safeSymbol = analysis.symbol.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `analysis_${safeSymbol}_${analysis.timeframe}.pdf`;
        pdf.save(fileName);

    } catch (error) {
        console.error("Error generating PDF:", error);
    } finally {
        setIsExporting(false);
    }
};

  let bannerContent = null;
  if (viewingBannerInfo) {
    const { type, record } = viewingBannerInfo;
    const dateStr = new Date(record.timestamp).toLocaleString('fa-IR', { timeZone: record.timezone, dateStyle: 'medium', timeStyle: 'short'});
    if (type === 'history') {
      bannerContent = (
        <div className="bg-blue-900/40 border border-blue-700 text-blue-200 p-4 rounded-xl flex items-center justify-center shadow-lg animate-fade-in">
          <AlertTriangle className="w-6 h-6 ml-3 flex-shrink-0" />
          <p className="font-semibold text-sm md:text-base">
            شما در حال مشاهده یک تحلیل آرشیو شده از تاریخ {dateStr} (منطقه زمانی: {record.timezone}) هستید.
          </p>
        </div>
      );
    } else if (type === 'saved') {
      const savedRecord = record as SavedAnalysisRecord;
      bannerContent = (
         <div className="bg-amber-900/40 border border-amber-700 text-amber-200 p-4 rounded-xl flex items-center justify-center shadow-lg animate-fade-in">
          <AlertTriangle className="w-6 h-6 ml-3 flex-shrink-0" />
          <p className="font-semibold text-sm md:text-base">
            شما در حال مشاهده تحلیل ذخیره شده "{savedRecord.name}" هستید (ذخیره در {dateStr}، منطقه زمانی: {record.timezone}).
          </p>
        </div>
      );
    }
  }

  const isViewingNonLive = !!viewingBannerInfo;
  const usedKnowledgeContext = knowledgeContextItems && knowledgeContextItems.length > 0 && !isViewingNonLive;

  const renderContent = () => {
    switch(activeTab) {
      case 'summary':
        return (
          <div className="space-y-6">
             <ProgressiveReveal delay={0} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard 
                  title="سیگنال اصلی"
                  value={analysis.signal}
                  icon={<Signal className={`w-8 h-8 ${getSignalColor(analysis.signal)}`} />}
                  description="توصیه معاملاتی بر اساس تحلیل جامع."
                  valueClassName={getSignalColor(analysis.signal)}
                />
                <SummaryCard
                  title="سطح ریسک"
                  value={analysis.riskLevel}
                  icon={<ShieldAlert className={`w-8 h-8 ${getRiskColor(analysis.riskLevel)}`} />}
                  description="ارزیابی ریسک سرمایه‌گذاری."
                  valueClassName={getRiskColor(analysis.riskLevel)}
                />
                <SummaryCard
                  title="ریسک/ریوارد"
                  value={analysis.strategy?.riskManagement?.riskRewardRatio || 'N/A'}
                  icon={<GitCompareArrows className="w-8 h-8 text-sky-400"/>}
                  description="نسبت ریسک به سود احتمالی."
                  tooltipText="نسبت ریسک به ریوارد، میزان سودی که به ازای هر واحد ریسک انتظار دارید را اندازه‌گیری می‌کند. نسبت بالاتر از ۱:۲ مطلوب در نظر گرفته می‌شود."
                />
                <SummaryCard
                  title="امتیاز اطمینان"
                  value={<ConfidenceGauge value={analysis.confidence} />}
                  icon={<BrainCircuit className="w-8 h-8 text-purple-400"/>}
                  description="میزان اطمینان AI به این تحلیل."
                  tooltipText="این امتیاز نشان‌دهنده میزان اطمینان هوش مصنوعی به پیش‌بینی‌ها و تحلیل ارائه شده بر اساس داده‌های موجود است. امتیاز بالاتر به معنای قطعیت بیشتر است."
                />
            </ProgressiveReveal>
             <ProgressiveReveal delay={200} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-gray-800/30 p-6 rounded-xl border border-gray-700/50 shadow-lg flex flex-col items-center justify-center backdrop-blur-sm">
                    <h3 className="text-lg font-semibold text-gray-200 mb-4">
                        <ContextualTooltip text="این شاخص احساسات کلی بازار (ترس یا طمع) را بر اساس اخبار و تحلیل‌های اجتماعی اندازه‌گیری می‌کند.">
                            احساسات بازار
                        </ContextualTooltip>
                    </h3>
                    <SentimentGauge score={analysis.sentimentScore} text={analysis.sentiment} />
                </div>
                <div className="lg:col-span-2 bg-gray-800/30 p-6 rounded-xl border border-gray-700/50 shadow-lg backdrop-blur-sm">
                    <h3 className="text-xl font-semibold mb-4 text-gray-200">خلاصه تحلیل و پیش‌بینی</h3>
                    <p className="text-gray-300 leading-relaxed text-sm mb-4">{analysis.summary}</p>
                    <h4 className="font-semibold text-gray-200 mt-4 mb-2">پیش‌بینی کوتاه‌مدت:</h4>
                    <p className="text-gray-400 text-sm">{analysis.prediction}</p>
                </div>
            </ProgressiveReveal>

             <ProgressiveReveal delay={300}>
                <StrategyView analysis={analysis} />
            </ProgressiveReveal>
            
             <ProgressiveReveal delay={400} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {analysis.keyTakeaways && analysis.keyTakeaways.length > 0 && (
                  <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/50 shadow-lg backdrop-blur-sm">
                    <h3 className="text-xl font-semibold mb-4 flex items-center text-sky-300">
                      <Check className="w-6 h-6 ml-2 text-sky-400" />
                      نکات کلیدی
                    </h3>
                    <ul className="space-y-3">
                      {analysis.keyTakeaways.map((item, index) => (
                         <li key={index} className="flex items-start gap-3">
                            <div className="w-4 h-4 mt-1 rounded-full bg-sky-500/50 flex-shrink-0"></div>
                            <span className="text-gray-300 text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.proTip && (
                  <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/50 shadow-lg backdrop-blur-sm">
                    <h3 className="text-xl font-semibold mb-4 flex items-center text-amber-300">
                      <Lightbulb className="w-6 h-6 ml-2 text-amber-400" />
                      دیدگاه حرفه‌ای
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{analysis.proTip}</p>
                  </div>
                )}
             </ProgressiveReveal>

             {analysis.astrologyAnalysis && (
                <ProgressiveReveal delay={500} className="bg-gradient-to-br from-indigo-800/30 via-gray-800/30 to-gray-800/30 p-6 rounded-xl border border-indigo-700/60 shadow-lg backdrop-blur-sm">
                  <h3 className="text-xl font-semibold mb-4 flex items-center text-indigo-300">
                    <Moon className="w-6 h-6 ml-2 text-indigo-400" />
                    <ContextualTooltip text="این یک تحلیل گمانه‌پردازانه بر اساس موقعیت سیارات و رویدادهای نجومی است و نباید به عنوان توصیه مالی قطعی در نظر گرفته شود.">
                        تحلیل آسترولوژی (گمانه‌پردازانه)
                    </ContextualTooltip>
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-line">{analysis.astrologyAnalysis}</p>
                   <p className="text-xs text-indigo-400/80 mt-4">
                    این تحلیل بر اساس مفاهیم غیرسنتی و آسترولوژی مالی است و باید به عنوان یک دیدگاه تکمیلی در نظر گرفته شود.
                  </p>
                </ProgressiveReveal>
            )}

            {analysis.learnedInsights && analysis.learnedInsights !== 'در این تحلیل نکته جدیدی برای یادگیری یافت نشد.' && (
                <ProgressiveReveal delay={600} className="bg-gradient-to-br from-purple-800/30 via-gray-800/30 to-gray-800/30 p-6 rounded-xl border border-purple-700/60 shadow-lg backdrop-blur-sm">
                  <h3 className="text-xl font-semibold mb-4 flex items-center text-purple-300">
                    <Sparkles className="w-6 h-6 ml-2 text-purple-400" />
                    آموخته‌های جدید AI
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-line">{analysis.learnedInsights}</p>
                  <p className="text-xs text-purple-400/80 mt-4">
                    هوش مصنوعی این نکات را از طریق جستجو در وب برای بهبود تحلیل‌های آینده آموخته است.
                  </p>
                </ProgressiveReveal>
            )}
          </div>
        );
      case 'chart':
        return (
          <div className="space-y-6">
            <ProgressiveReveal delay={0} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gray-800/30 p-4 md:p-6 rounded-xl border border-gray-700/50 shadow-lg backdrop-blur-sm">
                    <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-200">نمودار قیمت و اهداف</h3>
                    <CandlestickChart
                        candlestickData={analysis.candlestickData}
                        predictionData={analysis.priceChartData}
                        patterns={analysis.patterns}
                        buyTargets={analysis.buyTargets}
                        sellTargets={analysis.sellTargets}
                        stopLoss={analysis.stopLoss}
                        timezone={analysis.timezone}
                        highlightedPattern={highlightedPattern}
                     />
                </div>
                <TechnicalInsights
                    patterns={analysis.patterns}
                    indicators={analysis.indicators}
                    highlightedPattern={highlightedPattern}
                    onPatternSelect={setHighlightedPattern}
                />
            </ProgressiveReveal>
            <ProgressiveReveal delay={200} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TargetsTable title="اهداف خرید (ورود)" targets={analysis.buyTargets} type="buy" />
                <TargetsTable title="اهداف فروش (خروج)" targets={analysis.sellTargets} type="sell" />
            </ProgressiveReveal>
          </div>
        );
      case 'data':
         return (
            <div className="space-y-6">
                 {usedKnowledgeContext && (
                    <ProgressiveReveal delay={0} className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/50 shadow-lg backdrop-blur-sm">
                        <h3 className="text-xl font-semibold mb-3 flex items-center text-purple-300">
                            <BrainCircuit className="w-6 h-6 ml-2" />
                            نکات تاثیرگذار از تحلیل‌های پیشین
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">هوش مصنوعی از این آموخته‌ها برای بهبود و شخصی‌سازی تحلیل فعلی استفاده کرده است.</p>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {knowledgeContextItems.map(item => (
                                <div key={item.id} className="p-3 bg-gray-900/40 rounded-lg border border-gray-700/60 text-sm">
                                    <p className="font-semibold text-purple-400">{item.type}</p>
                                    <p className="text-gray-300 whitespace-pre-line mt-1">{item.content}</p>
                                </div>
                            ))}
                        </div>
                    </ProgressiveReveal>
                )}
                {analysis.newsSummary && analysis.newsSummary !== 'هیچ خبر قابل توجهی یافت نشد.' && (
                    <ProgressiveReveal delay={50} className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/50 shadow-lg backdrop-blur-sm">
                        <h3 className="text-xl font-semibold mb-3 flex items-center text-gray-200">
                            <Newspaper className="w-6 h-6 ml-2 text-sky-400" />
                            خلاصه اخبار تاثیرگذار
                        </h3>
                        <p className="text-gray-300 leading-relaxed text-sm">
                            {analysis.newsSummary}
                        </p>
                    </ProgressiveReveal>
                )}
                {sources.length > 0 && 
                    <ProgressiveReveal delay={150}>
                        <GroundingSources sources={sources} />
                    </ProgressiveReveal>
                }
                {uploadedFiles.length > 0 && (
                    <ProgressiveReveal delay={300} className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/50 shadow-lg backdrop-blur-sm">
                        <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-200">
                            <FileText className="w-6 h-6 ml-2 text-sky-400" />
                            فایل‌های استفاده شده در تحلیل
                        </h3>
                        <FileList files={uploadedFiles} />
                    </ProgressiveReveal>
                )}
            </div>
         );
      default:
        return null;
    }
  }

  const isChatDisabled = isViewingNonLive;


  return (
    <div className="space-y-6" ref={dashboardRef}>
      <ProgressiveReveal delay={0}>
        {bannerContent}
      </ProgressiveReveal>
      
      {usedKnowledgeContext && (
          <ProgressiveReveal delay={50} className="bg-purple-900/40 border border-purple-700 text-purple-200 p-4 rounded-xl flex items-center justify-center shadow-lg">
            <BrainCircuit className="w-6 h-6 ml-3" />
            <p className="font-semibold text-sm md:text-base">
              این تحلیل با استفاده از دانش آموخته شده از تحلیل‌های پیشین بهبود یافته است.
            </p>
          </ProgressiveReveal>
      )}

      <ProgressiveReveal delay={100} className="flex flex-col md:flex-row justify-between items-center gap-4 ignore-pdf">
        <div className="flex items-center gap-3">
            <button
                onClick={onToggleWatchlist}
                title={isInWatchlist ? "حذف از واچ‌لیست" : "افزودن به واچ‌لیست"}
                className="p-2 rounded-full text-yellow-400 hover:bg-yellow-400/20 transition-colors"
                aria-label={isInWatchlist ? "حذف از واچ‌لیست" : "افزودن به واچ‌لیست"}
            >
                <Star size={28} className={`transition-all duration-300 ${isInWatchlist ? 'fill-current transform scale-110' : ''}`} />
            </button>
            <h2 className="text-2xl md:text-3xl font-bold text-center">
              نتایج تحلیل برای <span className="text-sky-400">{analysis.symbol}</span>
              <span className="text-xl font-medium text-gray-400 mr-2">({analysis.timeframe})</span>
            </h2>
        </div>
        
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <button
              onClick={onSaveRequest}
              disabled={isSaved}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-300 transform hover:scale-105
                ${isSaved
                  ? 'bg-emerald-800/30 border-emerald-700/60 text-emerald-300 cursor-default'
                  : 'bg-amber-800/30 border-amber-700/60 text-amber-300 hover:bg-amber-700/50 hover:border-amber-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                }`}
          >
              {isSaved ? <CheckCircle size={18} /> : <Save size={18} />}
              {isSaved ? 'تحلیل ذخیره شد' : 'ذخیره تحلیل'}
          </button>
           <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-300 transform hover:scale-105
                bg-sky-800/30 border-sky-700/60 text-sky-300 hover:bg-sky-700/50 hover:border-sky-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              `}
            >
              {isExporting ? <Loader2 size={18} className="animate-spin"/> : <FileDown size={18} />}
              {isExporting ? 'در حال صدور...' : 'خروجی PDF'}
            </button>
        </div>
      </ProgressiveReveal>
      
      <ProgressiveReveal delay={200} className="bg-gray-900/30 rounded-xl border border-gray-700/50 shadow-lg backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-center justify-center border-b border-gray-700/50">
            <TabButton active={activeTab === 'summary'} onClick={() => setActiveTab('summary')} icon={<Activity size={18}/>}>
                خلاصه و استراتژی
            </TabButton>
             <TabButton active={activeTab === 'chart'} onClick={() => setActiveTab('chart')} icon={<BarChart size={18}/>}>
                نمودار و تکنیکال
            </TabButton>
             <TabButton active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={<BookOpen size={18}/>}>
                اخبار و منابع
            </TabButton>
        </div>

        <div className="p-4 md:p-6">
            {renderContent()}
        </div>
      </ProgressiveReveal>
      
      {!isChatDisabled && (
        <ProgressiveReveal delay={700} className="ignore-pdf chat-interface-container">
            <ChatInterface
              messages={chatMessages}
              isLoading={isChatLoading}
              onSendMessage={onSendMessage}
            />
        </ProgressiveReveal>
      )}
    </div>
  );
};
