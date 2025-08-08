
import { timezones } from './data/timezones';

export type MarketType = 'Crypto' | 'Forex' | 'US Stocks' | 'Iran Bourse' | 'Other';

export const FileCategories = ['داده‌های بازار', 'استراتژی شخصی', 'اخبار و مقالات', 'گزارش‌های تحلیلی', 'تصویر چارت', 'سایر'] as const;
export type FileCategory = typeof FileCategories[number];

export const timeframes = ['5 دقیقه', '15 دقیقه', '1 ساعت', '4 ساعت', 'روزانه', 'هفتگی', 'ماهانه', 'سالیانه'] as const;
export type Timeframe = typeof timeframes[number];

export type Timezone = typeof timezones[number]['value'];

export const riskProfiles = ['محافظه‌کار', 'متعادل', 'تهاجمی'] as const;
export type RiskProfile = typeof riskProfiles[number];

export const strategies = [
    'تحلیل تکنیکال کلاسیک', 
    'تحلیل بر اساس پرایس اکشن', 
    'تحلیل با امواج الیوت', 
    'نوسان‌گیری روزانه (Day Trading)',
    'نوسان‌گیری میان‌مدت (Swing Trading)',
    'اسکالپینگ (Scalping)',
    'معامله‌گری موقعیتی (Position)',
    'سرمایه‌گذاری ارزشی (Value)',
    'سرمایه‌گذاری بر رشد (Growth)',
    'معامله بر اساس اخبار',
    'معامله‌گری مخالف روند (Contrarian)',
    'تحلیل بر اساس آسترولوژی'
] as const;
export type Strategy = typeof strategies[number];

export const indicators = [
    'RSI (شاخص قدرت نسبی)',
    'MACD (مکدی)',
    'Bollinger Bands (باندهای بولینگر)',
    'Ichimoku Cloud (ابر ایچیموکو)',
    'Volume Profile (پروفایل حجم)',
    'ATR (میانگین محدوده واقعی)',
    'Stochastic Oscillator (نوسان‌گر استوکاستیک)',
    'Fibonacci Retracement (اصلاحی فیبوناچی)'
] as const;
export type Indicator = typeof indicators[number];


export const aiProviders = ['Gemini', 'OpenAI', 'Qwen'] as const;
export type AiProvider = typeof aiProviders[number];

export interface FinancialSymbol {
    symbol: string;
    name: string;
    market: MarketType;
    popular?: boolean;
}

export type PatternImplication = 'Bullish' | 'Bearish' | 'Neutral';
export type PatternCategory = 'Classic Chart' | 'Candlestick' | 'Harmonic';
export type PatternReliability = 'Low' | 'Medium' | 'High';

export interface Pattern {
    name: string;
    description: string;
    implication: PatternImplication;
    category: PatternCategory;
    reliability: PatternReliability;
    keyLevels?: { name: string; value: number }[];
    startDate?: string;
    endDate?: string;
}

export interface IndicatorAnalysis {
    rsi: { value: number; signal: 'Overbought' | 'Oversold' | 'Neutral'; description: string };
    macd: { signal: 'Bullish Crossover' | 'Bearish Crossover' | 'Neutral'; description: string };
    bollinger: { signal: 'Price near Upper Band' | 'Price near Lower Band' | 'Price near Middle Band'; description: string };
}

export interface CandlestickDataPoint {
    date: string; // Should be an ISO 8601 string from the API
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface EnhancedStrategy {
    primary: {
        title: string;
        description: string;
        entryConditions: string[];
        exitConditions: string[];
    };
    alternative?: {
        title: string;
        description: string;
        triggerCondition: string;
    };
    riskManagement: {
        positionSizing: string;
        riskRewardRatio: string;
    };
    simulatedBacktestNotes: string;
}

export interface BacktestResult {
    totalProfitLoss: number; // as a percentage
    winRate: number; // as a percentage, e.g., 65 for 65%
    maxDrawdown: number; // as a percentage
    profitFactor: number;
    period: string; // e.g., "Last 500 candles"
    tradesCount: number;
}

export interface AnalysisResult {
  symbol: string;
  timeframe: Timeframe;
  timezone: Timezone;
  trend: string;
  summary: string;
  signal: 'خرید قوی' | 'خرید' | 'نگهداری' | 'فروش' | 'فروش قوی';
  sentiment: string;
  sentimentScore: number; // -100 (Extreme Fear) to 100 (Extreme Greed)
  newsSummary: string;
  patterns: Pattern[];
  indicators: IndicatorAnalysis;
  strategy: EnhancedStrategy;
  buyTargets: number[];
  sellTargets: number[];
  stopLoss: number;
  prediction: string;
  riskLevel: 'پایین' | 'متوسط' | 'بالا';
  confidence: number; // A number from 0 to 100
  candlestickData: CandlestickDataPoint[];
  priceChartData: Array<{ date: string; price: number; type: 'predicted' }>; // date should be ISO string
  learnedInsights?: string;
  keyTakeaways: string[];
  proTip: string;
  astrologyAnalysis?: string;
  backtestResult?: BacktestResult;
}

export interface UploadedFile {
  name: string;
  type: string;
  size: number;
  content: string; // Base64 Data URL for images, raw text for others
  contentHash: string;
  category: FileCategory;
  symbol: string;
}

export interface GroundingSource {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
  timestamp: number;
}

export interface AnalysisData {
  analysis: AnalysisResult;
  sources: GroundingSource[];
  filesUsed: UploadedFile[];
}

export interface AnalysisRecord {
  id?: number; // Optional because it's added by IndexedDB
  timestamp: number;
  symbol: string;
  timeframe: Timeframe;
  timezone: Timezone;
  filesUsed: UploadedFile[];
  analysis: AnalysisResult;
  sources: GroundingSource[];
  prompt: string; // The full prompt sent to the AI
  chatHistory?: ChatMessage[];
}

export interface SavedAnalysisRecord {
  id?: number; // Optional because it's added by IndexedDB
  name: string; // User-defined name
  timestamp: number;
  symbol: string;
  timeframe: Timeframe;
  timezone: Timezone;
  filesUsed: UploadedFile[];
  analysis: AnalysisResult;
  sources: GroundingSource[];
  prompt: string; // The full prompt sent to the AI
  chatHistory?: ChatMessage[];
}

export interface WatchlistItem {
  symbol: string;
  addedAt: number;
}

export type KnowledgeType = 'Insight' | 'Pattern' | 'Strategy';

export interface KnowledgeItem {
    id?: number; // Optional because it's added by IndexedDB
    sourceAnalysisId: number; // The ID of the analysis this knowledge came from
    type: KnowledgeType;
    content: string;
    symbol: string;
    timeframe: Timeframe;
    timestamp: number;
}

export type TechniqueType = 'Strategy' | 'Indicator';

export interface LearnedTechnique {
    id?: number; // Optional because it's added by IndexedDB
    name: string;
    type: TechniqueType;
    description: string;
    parameters: string; // e.g., "length: 14, source: close"
    source: 'user_upload' | 'manual' | 'web_discovery';
    sourceFileName?: string;
    createdAt: number;
}

export interface NewsItem {
  title: string;
  summary: string;
  link: string;
  source: string;
}

export interface ComparisonMetric {
    metric: string;
    symbolAValue: string;
    symbolBValue:string;
}

export interface ComparativeAnalysisResult {
    symbolA: string;
    symbolB: string;
    timeframe: Timeframe;
    riskProfile: RiskProfile;
    keyMetrics: ComparisonMetric[];
    comparativeSummary: string;
    recommendation: string;
    proRecommendation: string;
    conRecommendation: string;
}

export interface HotSymbol {
  symbol: string;
  name: string;
  market: MarketType;
  reason: string;
  keyMetrics: Array<{ metric: string; value: string }>;
  detailedAnalysis: string;
}
