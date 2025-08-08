
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { Chat, Content } from "@google/genai";
import type { AnalysisResult, GroundingSource, FinancialSymbol, FileCategory, Timeframe, Timezone, RiskProfile, UploadedFile, Strategy, NewsItem, ComparativeAnalysisResult, HotSymbol, EnhancedStrategy, LearnedTechnique, Indicator } from '../types';
import { FileCategories } from '../types';

let geminiAi: GoogleGenAI | null = null;

if (process.env.API_KEY) {
    try {
        geminiAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } catch(e) {
        console.error("Failed to initialize Gemini AI:", e);
        geminiAi = null;
    }
} else {
    console.warn("API_KEY environment variable is not set. Gemini AI service is not available.");
}


export const isAiInitialized = (): boolean => {
    return !!geminiAi;
};

const getGeminiInstance = (): GoogleGenAI => {
    if (!geminiAi) {
        throw new Error("سرویس هوش مصنوعی Gemini به دلیل عدم وجود کلید API قابل راه‌اندازی نیست. لطفاً از تنظیم بودن متغیر محیطی API_KEY اطمینان حاصل کنید.");
    }
    return geminiAi;
};

export const createChatSession = (history: Content[], systemInstruction: string): Chat | null => {
    try {
        const localAi = getGeminiInstance();
        return localAi.chats.create({
            model: 'gemini-2.5-flash',
            history,
            config: {
                systemInstruction,
            },
        });
    } catch (e) {
        console.error("Failed to create chat session:", e);
        return null;
    }
};


const analysisResultSchema = {
    type: Type.OBJECT,
    properties: {
        symbol: { type: Type.STRING, description: "نماد مالی تحلیل شده." },
        timeframe: { type: Type.STRING, description: "تایم فریم تحلیل شده." },
        timezone: { type: Type.STRING, description: "منطقه زمانی استفاده شده." },
        trend: { type: Type.STRING, description: "توصیف کوتاه و مختصر روند فعلی قیمت (مثلاً: 'صعودی با مومنتوم بالا', 'نزولی در کانال', 'خنثی و رنج'). **نباید بیشتر از یک جمله باشد.**" },
        summary: { type: Type.STRING, description: "خلاصه کلی تحلیل در یک پاراگراف. شامل یافته‌های اصلی، فرصت‌ها و ریسک‌ها." },
        signal: { type: Type.STRING, description: "سیگنال نهایی معامله. باید یکی از مقادیر زیر باشد: 'خرید قوی', 'خرید', 'نگهداری', 'فروش', 'فروش قوی'." },
        sentiment: { type: Type.STRING, description: "توصیف احساسات کلی بازار (مثلاً: 'طمع شدید', 'ترس', 'خنثی')." },
        sentimentScore: { type: Type.NUMBER, description: "امتیاز عددی احساسات از -100 (ترس شدید) تا 100 (طمع شدید)." },
        newsSummary: { type: Type.STRING, description: "خلاصه‌ای از مهم‌ترین اخبار اخیر مرتبط با نماد." },
        patterns: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    implication: { type: Type.STRING, description: "یکی از: 'Bullish', 'Bearish', 'Neutral'" },
                    category: { type: Type.STRING, description: "یکی از: 'Classic Chart', 'Candlestick', 'Harmonic'" },
                    reliability: { type: Type.STRING, description: "یکی از: 'Low', 'Medium', 'High'" },
                    keyLevels: {
                        type: Type.ARRAY,
                        description: "An array of key price levels for the pattern, like support or resistance.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: "The name of the level, e.g., 'Support 1' or 'Fib 0.618'." },
                                value: { type: Type.NUMBER, description: "The price value of the level." },
                            },
                            required: ["name", "value"],
                        }
                    },
                    startDate: { type: Type.STRING, description: "Date in UTC ISO 8601 format" },
                    endDate: { type: Type.STRING, description: "Date in UTC ISO 8601 format" },
                },
                required: ["name", "description", "implication", "category", "reliability"],
            },
        },
        indicators: {
            type: Type.OBJECT,
            properties: {
                rsi: { type: Type.OBJECT, properties: { value: { type: Type.NUMBER }, signal: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["value", "signal", "description"] },
                macd: { type: Type.OBJECT, properties: { signal: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["signal", "description"] },
                bollinger: { type: Type.OBJECT, properties: { signal: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["signal", "description"] },
            },
            required: ["rsi", "macd", "bollinger"],
        },
        strategy: { 
            type: Type.OBJECT,
            properties: {
                primary: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        entryConditions: { type: Type.ARRAY, items: { type: Type.STRING } },
                        exitConditions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ["title", "description", "entryConditions", "exitConditions"],
                },
                alternative: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        triggerCondition: { type: Type.STRING },
                    },
                    required: ["title", "description", "triggerCondition"],
                },
                riskManagement: {
                    type: Type.OBJECT,
                    properties: {
                        positionSizing: { type: Type.STRING },
                        riskRewardRatio: { type: Type.STRING },
                    },
                    required: ["positionSizing", "riskRewardRatio"],
                },
                simulatedBacktestNotes: { type: Type.STRING }
            },
            required: ["primary", "riskManagement", "simulatedBacktestNotes"],
        },
        buyTargets: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "آرایه‌ای از قیمت‌های هدف برای خرید." },
        sellTargets: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "آرایه‌ای از قیمت‌های هدف برای فروش." },
        stopLoss: { type: Type.NUMBER, description: "قیمت پیشنهادی برای حد ضرر." },
        prediction: { type: Type.STRING, description: "پیش‌بینی حرکت قیمت برای چند کندل آینده. باید مختصر و دقیق باشد." },
        riskLevel: { type: Type.STRING, description: "سطح کلی ریسک تحلیل. باید یکی از مقادیر زیر باشد: 'پایین', 'متوسط', 'بالا'." },
        confidence: { type: Type.NUMBER, description: "امتیاز اطمینان AI به این تحلیل (0-100)." },
        candlestickData: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    date: { type: Type.STRING, description: "Date in UTC ISO 8601 format" },
                    open: { type: Type.NUMBER },
                    high: { type: Type.NUMBER },
                    low: { type: Type.NUMBER },
                    close: { type: Type.NUMBER },
                    volume: { type: Type.NUMBER },
                },
                required: ["date", "open", "high", "low", "close", "volume"],
            },
        },
        priceChartData: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    date: { type: Type.STRING, description: "Date in UTC ISO 8601 format" },
                    price: { type: Type.NUMBER },
                    type: { type: Type.STRING },
                },
                required: ["date", "price", "type"],
            },
        },
        learnedInsights: { type: Type.STRING, description: "نکته جدیدی که AI از این تحلیل برای بهبود تحلیل‌های آینده یاد گرفته است." },
        keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING }, description: "لیستی از مهم‌ترین نکات کلیدی تحلیل." },
        proTip: { type: Type.STRING, description: "یک نکته یا توصیه حرفه‌ای برای معامله‌گر." },
        astrologyAnalysis: { type: Type.STRING, description: "تحلیل گمانه‌پردازانه بر اساس آسترولوژی مالی (در صورت انتخاب استراتژی مربوطه)." },
        backtestResult: {
            type: Type.OBJECT,
            properties: {
                totalProfitLoss: { type: Type.NUMBER, description: "Total profit or loss as a percentage" },
                winRate: { type: Type.NUMBER, description: "Percentage of winning trades, e.g., 65 for 65%" },
                maxDrawdown: { type: Type.NUMBER, description: "Maximum drawdown as a percentage, e.g., 15.5 for 15.5%" },
                profitFactor: { type: Type.NUMBER, description: "Gross profit / gross loss" },
                period: { type: Type.STRING, description: "The period over which the backtest was run, e.g., 'Last 500 candles'" },
                tradesCount: { type: Type.NUMBER, description: "Total number of trades executed" },
            },
            required: ["totalProfitLoss", "winRate", "maxDrawdown", "profitFactor", "period", "tradesCount"],
        },
    },
    required: [
        "symbol", "timeframe", "timezone", "trend", "summary", "signal", "sentiment", "sentimentScore",
        "newsSummary", "patterns", "indicators", "strategy", "buyTargets", "sellTargets", "stopLoss",
        "prediction", "riskLevel", "confidence", "candlestickData", "priceChartData",
        "learnedInsights", "keyTakeaways", "proTip"
    ],
};

const comparativeAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        symbolA: { type: Type.STRING },
        symbolB: { type: Type.STRING },
        timeframe: { type: Type.STRING },
        riskProfile: { type: Type.STRING, description: "پروفایل ریسک سرمایه‌گذار. باید یکی از این مقادیر باشد: 'محافظه‌کار', 'متعادل', 'تهاجمی'." },
        keyMetrics: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    metric: { type: Type.STRING },
                    symbolAValue: { type: Type.STRING },
                    symbolBValue: { type: Type.STRING },
                },
            },
        },
        comparativeSummary: { type: Type.STRING },
        recommendation: { type: Type.STRING },
        proRecommendation: { type: Type.STRING },
        conRecommendation: { type: Type.STRING },
    },
};

const hotSymbolSchema = {
    type: Type.OBJECT,
    properties: {
        symbol: { type: Type.STRING },
        name: { type: Type.STRING },
        market: { type: Type.STRING, description: "یکی از مقادیر: 'Crypto', 'Forex', 'US Stocks', 'Iran Bourse', 'Other'" },
        reason: { type: Type.STRING, description: "یک دلیل کوتاه و جذاب برای اینکه چرا این نماد داغ است." },
        keyMetrics: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    metric: { type: Type.STRING },
                    value: { type: Type.STRING },
                },
            },
        },
        detailedAnalysis: { type: Type.STRING, description: "تحلیل دقیق‌تر شامل اخبار اخیر، چشم‌انداز تکنیکال و پتانسیل رشد." },
    },
    required: ["symbol", "name", "market", "reason", "keyMetrics", "detailedAnalysis"]
};

const learnedTechniqueSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "نام توصیفی برای استراتژی یا اندیکاتور." },
            type: { type: Type.STRING, description: "نوع تکنیک. باید 'Strategy' یا 'Indicator' باشد." },
            description: { type: Type.STRING, description: "توضیح کامل و دقیق در مورد نحوه کارکرد تکنیک، شرایط ورود/خروج یا سیگنال‌ها." },
            parameters: { type: Type.STRING, description: "پارامترهای کلیدی به صورت یک رشته. مثال: 'length: 14, source: close' یا 'N/A'." },
        },
        required: ["name", "type", "description", "parameters"]
    }
};

export const getFinancialAnalysis = async (symbol: string, timeframe: Timeframe, timezone: Timezone, riskProfile: RiskProfile, strategies: Strategy[], indicators: Indicator[], customTechniques: LearnedTechnique[], files: UploadedFile[], knowledgeContext: string): Promise<{ analysis: AnalysisResult; sources: GroundingSource[]; prompt: string; }> => {
  const localAi = getGeminiInstance();

  const riskProfileMap: Record<RiskProfile, string> = {
    'محافظه‌کار': 'Conservative',
    'متعادل': 'Balanced',
    'تهاجمی': 'Aggressive'
  };
  const englishRiskProfile = riskProfileMap[riskProfile];
  
  // --- Step 1: Fetch news and grounding sources using Google Search tool ---
  const newsPrompt = `با استفاده از جستجوی گوگل، خلاصه‌ای از آخرین و مهم‌ترین اخبار و رویدادهای مربوط به نماد مالی "${symbol}" را به زبان فارسی ارائه بده.`;
  
  let newsSummary = 'هیچ خبر قابل توجهی یافت نشد.';
  let sources: GroundingSource[] = [];

  try {
      const newsResponse = await localAi.models.generateContent({
          model: "gemini-2.5-flash",
          contents: newsPrompt,
          config: {
              tools: [{ googleSearch: {} }],
          },
      });
      newsSummary = newsResponse.text || newsSummary;
      sources = newsResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  } catch(e) {
      console.warn(`Could not fetch news for ${symbol}:`, e);
      // Continue without news if this step fails
  }

  // --- Step 2: Perform the main analysis with the fetched news as context ---
  const marketDataFiles = files.filter(f => f.category === 'داده‌های بازار');
  const otherTextFiles = files.filter(f => f.category !== 'تصویر چارت' && f.category !== 'داده‌های بازار');
  const imageFiles = files.filter(f => f.category === 'تصویر چارت');
  
  const marketDataContents = marketDataFiles.map(f => `نام فایل داده بازار: ${f.name}\nمحتوا:\n${f.content}`).join('\n\n---\n\n');
  const otherFileContents = otherTextFiles.map(f => `نام فایل: ${f.name}\nمحتوا:\n${f.content}`).join('\n\n---\n\n');
  const strategiesString = strategies.join(', ');
  const indicatorsString = indicators.join(', ');
  const customTechniquesContext = customTechniques.map(t => `- نام: ${t.name} (نوع: ${t.type})\n  - توضیحات: ${t.description}\n  - پارامترها: ${t.parameters}`).join('\n');

  const systemInstruction = `شما یک API تحلیلگر مالی هستید. وظیفه شما این است که بر اساس درخواست کاربر، یک تحلیل دقیق و جامع انجام دهید و نتیجه را فقط و فقط به صورت یک آبجکت JSON معتبر که با اسکیمای ارائه شده مطابقت دارد، برگردانید. تمام پاسخ‌ها باید به زبان فارسی باشند.`;
  
  const userPrompt = `
# تحلیل جامع مالی
**وظیفه:** شما یک API تحلیلگر مالی هستید. تحلیل کاملی برای نماد مالی زیر انجام دهید و نتیجه را **فقط و فقط** به صورت یک آبجکت JSON معتبر برگردانید.
---
## اطلاعات ورودی برای تحلیل:

**1. پارامترهای اصلی:**
   - **نماد:** ${symbol}
   - **تایم فریم:** ${timeframe}
   - **منطقه زمانی:** ${timezone}
   - **پروفایل ریسک کاربر:** ${riskProfile} (${englishRiskProfile})
   - **استراتژی‌های منتخب:** ${strategiesString}
   - **اندیکاتورهای منتخب:** ${indicatorsString}

**2. کتابخانه دانش سفارشی کاربر (استراتژی‌ها و اندیکاتورهای یادگرفته شده):**
   ${customTechniquesContext || 'موجود نیست.'}

**3. دانش آموخته شده (از تحلیل‌های قبلی):**
   ${knowledgeContext || 'موجود نیست.'}

**4. خلاصه اخبار وب:**
   ${newsSummary}

**5. فایل‌های کاربر:**
   - **فایل‌های داده بازار (برای قیمت):** ${marketDataContents ? marketDataContents : 'فایلی ارائه نشده. از دانش داخلی خود برای شبیه‌سازی داده‌های واقعی و اخیر استفاده کنید.'}
   - **سایر فایل‌های متنی:** ${otherFileContents || 'موجود نیست.'}
   - **تصاویر چارت:** ${imageFiles.length > 0 ? `${imageFiles.length} تصویر پیوست شده است.` : 'موجود نیست.'}
---
## دستورالعمل‌های دقیق برای خروجی JSON:

- **ساختار خروجی:** خروجی باید **دقیقاً** یک آبجکت JSON باشد که با \`responseSchema\` مطابقت کامل دارد. **هیچ متنی خارج از این آبجکت JSON قرار ندهید.** تمام فیلدهای اجباری (required) در اسکیما باید حتماً پر شوند.
- **تمرکز تحلیل:** تحلیل تکنیکال باید با تمرکز ویژه بر **استراتژی‌ها، اندیکاتورها و تکنیک‌های سفارشی** منتخب کاربر انجام شود.
- **اولویت داده‌ها:** اگر فایل داده بازار (\`marketDataFiles\`) توسط کاربر آپلود شده، تحلیل تکنیکال (الگوها، اندیکاتورها) و شبیه‌سازی بک‌تست باید *منحصراً* بر اساس آن داده‌ها انجام شود. در غیر این صورت، از دانش داخلی خود استفاده کنید.
- **قالب تاریخ‌ها:** تمام فیلدهای تاریخ باید به صورت رشته متنی با فرمت UTC ISO 8601 باشند.
- **تولید داده نمودار:**
    - **candlestickData:** آرایه‌ای شامل **60 کندل آخر** را ارائه دهید.
    - **priceChartData:** پیش‌بینی قیمت برای **10 کندل آینده** را ارائه دهید.
- **شبیه‌سازی بک‌تست:**
    - **backtestResult:** یک شبیه‌سازی **واقع‌گرایانه و تخمینی** از عملکرد استراتژی اصلی روی داده‌های گذشته انجام دهید. این یک محاسبه واقعی نیست، بلکه یک تخمین آماری است. اگر امکان‌پذیر نیست، یک آبجکت با مقادیر پیش‌فرض منطقی برگردانید.
- **آموخته‌های جدید (Learned Insights):**
    - **learnedInsights:** اگر از این تحلیل نکته جدید، عمومی و قابل استفاده در آینده یاد گرفتید، آن را به طور خلاصه در این فیلد بنویسید. در غیر این صورت، از رشته دقیق "در این تحلیل نکته جدیدی برای یادگیری یافت نشد." استفاده کنید.
- **تحلیل آسترولوژی:**
    - اگر 'تحلیل بر اساس آسترولوژی' در استراتژی‌ها وجود دارد، فیلد \`astrologyAnalysis\` را پر کنید. در غیر این صورت، این کلید را در خروجی JSON قرار ندهید.
- **زبان:** تمام متن‌های خروجی باید به زبان فارسی باشند.

**اکنون تحلیل را شروع کرده و فقط آبجکت JSON را برگردانید.**
`;

  const imageParts = imageFiles.map(file => ({
      inlineData: {
          mimeType: file.type,
          data: file.content.split(',')[1] // remove data:image/jpeg;base64,
      }
  }));

  const parts = [
      { text: userPrompt }, 
      ...imageParts
  ];

  const response = await localAi.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: analysisResultSchema,
    },
  });

  let analysis: AnalysisResult;
  try {
      const jsonText = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
      analysis = JSON.parse(jsonText) as AnalysisResult;
  } catch (e) {
      console.error("Failed to parse JSON response from AI:", response.text, e);
      throw new Error("پاسخ دریافت شده از هوش مصنوعی در فرمت JSON معتبر نبود. لطفاً دوباره تلاش کنید.");
  }
  
  // The sources are from the first API call.
  return { analysis, sources, prompt: userPrompt };
};

export const getSymbolSuggestions = async (query: string): Promise<FinancialSymbol[]> => {
    const localAi = getGeminiInstance();
    const systemInstruction = `شما یک سرویس پیشنهاددهنده نمادهای مالی هستید. کاربر یک عبارت جستجو ارائه می‌دهد.
از جستجوی گوگل برای یافتن نمادهای مالی مرتبط و به‌روز استفاده کنید.
شما باید بازارهای 'Crypto', 'Forex', 'US Stocks', 'Iran Bourse', و 'Other' را پوشش دهید.
پاسخ شما **حتماً و فقط** باید یک آرایه JSON معتبر باشد. هیچ متن اضافی، توضیح یا حصار مارک‌داون مانند \`\`\`json اضافه نکنید.
هر آبجکت در آرایه باید شامل پراپرتی‌های زیر باشد:
- "symbol": رشته (تیکر رسمی نماد)
- "name": رشته (نام کامل نماد)
- "market": رشته (یکی از این مقادیر: 'Crypto', 'Forex', 'US Stocks', 'Iran Bourse', 'Other')
- "popular": بولین (true اگر نماد بسیار رایج باشد)

تمام مقادیر رشته‌ای در JSON (مانند name) باید به زبان فارسی باشند.
مثال برای کوئری "بیت": [{"symbol":"BTC","name":"بیت‌کوین","market":"Crypto","popular":true}]`;

    const prompt = `لطفاً نمادهای مالی برای عبارت زیر را پیدا کن: "${query}"`;
    
    let response: GenerateContentResponse | undefined;
    try {
        response = await localAi.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                tools: [{ googleSearch: {} }],
            }
        });

        // The model sometimes returns conversational text before the JSON.
        // We need to extract the JSON part.
        let jsonText = response.text.trim();
        const startIndex = jsonText.indexOf('[');
        const endIndex = jsonText.lastIndexOf(']');

        if (startIndex !== -1 && endIndex > startIndex) {
            jsonText = jsonText.substring(startIndex, endIndex + 1);
        } else {
            // Handle case where it might be a single object without an array
            const objStartIndex = jsonText.indexOf('{');
            const objEndIndex = jsonText.lastIndexOf('}');
            if (objStartIndex !== -1 && objEndIndex > objStartIndex) {
                // It's a single object, wrap it in an array
                jsonText = `[${jsonText.substring(objStartIndex, objEndIndex + 1)}]`;
            } else {
                 // No valid JSON array or object found
                console.warn('No valid JSON array or object found in symbol suggestion response:', response.text);
                return [];
            }
        }
        
        return JSON.parse(jsonText) as FinancialSymbol[];
    } catch (e) {
        console.error("Failed to fetch or parse symbol suggestions:", e, response?.text);
        // Throw a more descriptive error to be caught by the UI
        throw new Error("خطا در پردازش پیشنهادها. ممکن است پاسخ AI نامعتبر یا خالی باشد.");
    }
};

export const categorizeFileContent = async (content: string): Promise<FileCategory> => {
    const localAi = getGeminiInstance();
    const systemInstruction = `شما یک سرویس دسته‌بندی فایل هستید. بر اساس محتوای فایل، فقط یکی از دسته‌بندی‌های زیر را به عنوان یک رشته JSON برگردانید: ${JSON.stringify(FileCategories)}. محتوا را تحلیل کرده و مناسب‌ترین دسته‌بندی را انتخاب کنید. برای تصاویر، همیشه 'تصویر چارت' را برگردانید. خروجی شما باید **فقط** رشته JSON نام دسته‌بندی باشد.`;
    
    const response = await localAi.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `محتوای فایل:\n\n${content.substring(0, 4000)}`, // Truncate for performance
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: { type: Type.STRING }
        }
    });

    return JSON.parse(response.text) as FileCategory;
};

export const extractTechniquesFromFileContent = async (content: string): Promise<Omit<LearnedTechnique, 'id' | 'createdAt' | 'source' | 'sourceFileName'>[]> => {
    const localAi = getGeminiInstance();
    const systemInstruction = `شما یک دستیار تحلیلگر مالی خبره هستید. وظیفه شما تحلیل محتوای متنی یک فایل و استخراج تعاریف استراتژی‌ها یا اندیکاتورهای معاملاتی است. برای هر تکنیک یافت‌شده، نام، نوع ('Strategy' یا 'Indicator')، توضیحات کامل و پارامترهای مشخص آن را ارائه دهید. نتیجه را **فقط** به صورت یک آرایه JSON معتبر مطابق با اسکیمای ارائه‌شده برگردانید. اگر هیچ تکنیکی یافت نشد، یک آرایه خالی [] برگردانید. تمام متن‌ها باید به زبان فارسی باشند.`;

    const prompt = `محتوای زیر را تحلیل کرده و هرگونه استراتژی یا اندیکاتور معاملاتی را استخراج کن:\n\n---\n${content.substring(0, 8000)}\n---`;

    try {
        const response = await localAi.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: learnedTechniqueSchema,
            },
        });
        
        const jsonText = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
        const techniques = JSON.parse(jsonText) as Omit<LearnedTechnique, 'id' | 'createdAt' | 'source' | 'sourceFileName'>[];
        return techniques.filter(t => t.name && t.type && t.description); // Basic validation
    } catch(err) {
        console.error("Failed to extract techniques from file content:", err);
        // Don't throw error to user, just return empty array on failure
        return [];
    }
};


export const getWhatIfAnalysis = async (scenario: string, originalAnalysis: AnalysisResult): Promise<string> => {
    const localAi = getGeminiInstance();
    const systemInstruction = `شما یک تحلیلگر مالی هستید که یک سناریوی "چه می‌شود اگر" را بر اساس یک تحلیل اولیه انجام می‌دهید. پاسخ شما باید مستقیم، به زبان فارسی و متمرکز بر تاثیر سناریوی جدید بر نتایج تحلیل اصلی (مثل سیگنال، اهداف، ریسک) باشد. از ارائه دوباره کل تحلیل خودداری کنید و فقط تغییرات را شرح دهید.`;

    const prompt = `
    تحلیل اصلی:
    ${JSON.stringify(originalAnalysis, null, 2)}

    سناریوی جدید:
    "${scenario}"

    با توجه به تحلیل اصلی، تاثیر این سناریوی جدید را تحلیل کن.
    `;
    
    const response = await localAi.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            systemInstruction: systemInstruction,
        }
    });

    return response.text;
};

export const getLatestFinancialNews = async (): Promise<NewsItem[]> => {
    const localAi = getGeminiInstance();
    const prompt = `Using Google Search, find the 5 latest and most important global financial news articles. Return the result as a valid JSON array of objects. Each object must have "title", "summary", "link", and "source" properties. The "link" must be a full, valid URL. Do not include any surrounding text or markdown. Just the JSON array. All text content must be in Persian.`;
    
    try {
        const response = await localAi.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        
        const text = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
        return JSON.parse(text) as NewsItem[];
    } catch (error) {
        console.error("Failed to fetch or parse financial news:", error);
        throw new Error("Could not fetch financial news. The API might have returned an unexpected format.");
    }
};

export const getComparativeAnalysis = async (symbolA: string, symbolB: string, timeframe: Timeframe, riskProfile: RiskProfile): Promise<ComparativeAnalysisResult> => {
    const localAi = getGeminiInstance();

    const riskProfileMap: Record<RiskProfile, string> = {
        'محافظه‌کار': 'Conservative',
        'متعادل': 'Balanced',
        'تهاجمی': 'Aggressive'
    };
    const englishRiskProfile = riskProfileMap[riskProfile];

    // --- Step 1: Fetch context for both symbols using Google Search tool ---
    const searchPrompt = `با استفاده از جستجوی گوگل، خلاصه‌ای از آخرین اخبار، داده‌های کلیدی و احساسات بازار را برای هر دو نماد مالی "${symbolA}" و "${symbolB}" به زبان فارسی ارائه بده.`;
    
    let searchContext = 'هیچ اطلاعات اضافی از وب یافت نشد.';
    try {
        const searchResponse = await localAi.models.generateContent({
            model: "gemini-2.5-flash",
            contents: searchPrompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        searchContext = searchResponse.text || searchContext;
    } catch(e) {
        console.warn(`Could not fetch web context for comparing ${symbolA} and ${symbolB}:`, e);
    }

    // --- Step 2: Perform the main comparative analysis with the fetched context ---
    const systemInstruction = `You are an expert financial analyst. Compare two financial symbols side-by-side and provide a clear recommendation based on the user's risk profile. Output must be a valid JSON object only, in Persian.`;
    const prompt = `
        **اطلاعات پس‌زمینه از وب:**
        ${searchContext}
        ---
        با توجه به اطلاعات پس‌زمینه بالا و دانش داخلی خود، یک تحلیل مقایسه‌ای بین **${symbolA}** و **${symbolB}** انجام دهید.
        - **تایم فریم:** ${timeframe}
        - **پروفایل ریسک سرمایه‌گذار:** ${riskProfile} (به انگلیسی: ${englishRiskProfile})

        **دستورالعمل‌ها:**
        1.  **خروجی JSON:** کل خروجی باید یک آبجکت JSON معتبر و منطبق با اسکیمای ارائه شده باشد.
        2.  **مقایسه متریک‌های کلیدی:** یک مقایسه رودررو برای متریک‌های زیر ارائه دهید:
            - "روند فعلی" (مثلاً: "صعودی", "نزولی", "خنثی")
            - "نوسانات" (مثلاً: "کم", "متوسط", "زیاد")
            - "احساسات بازار" (مثلاً: "ترس", "خنثی", "طمع")
            - "سطح حمایتی کلیدی"
            - "سطح مقاومتی کلیدی"
        3.  **خلاصه مقایسه‌ای:** یک پاراگراف دقیق برای خلاصه‌سازی تفاوت‌ها و شباهت‌های کلیدی در فیلد "comparativeSummary" بنویسید.
        4.  **توصیه:** بر اساس همه موارد، کدام دارایی را برای سرمایه‌گذار با این پروفایل ریسک توصیه می‌کنید و چرا؟ این را در فیلد "recommendation" قرار دهید.
        5.  **نقاط قوت و ضعف:** به طور خلاصه یک نقطه قوت اصلی را در "proRecommendation" و یک نقطه ضعف اصلی را در "conRecommendation" برای دارایی توصیه‌شده خود لیست کنید.

        پاسخ را کاملاً به زبان فارسی تولید کنید.
    `;

    const response = await localAi.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: comparativeAnalysisSchema,
        },
    });

    try {
        const jsonText = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
        return JSON.parse(jsonText) as ComparativeAnalysisResult;
    } catch(e) {
        console.error("Failed to parse JSON from comparative analysis:", response.text, e);
        throw new Error("پاسخ مقایسه‌ای دریافت شده از هوش مصنوعی در فرمت JSON معتبر نبود.");
    }
};

export const getTopTrendingSymbols = async (): Promise<HotSymbol[]> => {
    const localAi = getGeminiInstance();
    const systemInstruction = `شما یک تحلیلگر ارشد بازار مالی هستید. وظیفه شما شناسایی 10 نماد مالی "داغ" و پرپتانسیل از بازارهای مختلف (کریپتو، فارکس، سهام) بر اساس آخرین اخبار و روندهای بازار است. از جستجوی گوگل برای دسترسی به جدیدترین اطلاعات استفاده کنید. خروجی شما باید **فقط** یک آرایه JSON معتبر شامل 10 آبجکت باشد. هیچ متن اضافی یا توضیحی خارج از فرمت JSON ارائه ندهید. تمام متن‌ها باید به زبان فارسی باشند.`;
    const prompt = `لطفاً 10 نماد مالی داغ و در حال رشد را شناسایی کرده و برای هر کدام یک آبجکت JSON با ساختار زیر فراهم کنید:
{
  "symbol": "string",
  "name": "string",
  "market": "یکی از: 'Crypto', 'Forex', 'US Stocks', 'Iran Bourse', 'Other'",
  "reason": "string (دلیل کوتاه و جذاب)",
  "keyMetrics": [{ "metric": "string", "value": "string" }],
  "detailedAnalysis": "string (تحلیل دقیق‌تر)"
}
کل خروجی شما باید یک آرایه JSON از این آبجکت‌ها باشد و هیچ چیز دیگری نباشد.`;
    
    try {
        const response = await localAi.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                tools: [{ googleSearch: {} }],
            },
        });
        
        const jsonText = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
        return JSON.parse(jsonText) as HotSymbol[];
    } catch (error) {
        console.error("Failed to fetch or parse top trending symbols:", error);
        throw new Error("امکان دریافت لیست نمادهای داغ بازار وجود نداشت. لطفاً دوباره امتحان کنید.");
    }
};

export const discoverNewTechniquesFromWeb = async (
    existingTechniques: LearnedTechnique[]
): Promise<Omit<LearnedTechnique, 'id' | 'createdAt' | 'source' | 'sourceFileName'>[]> => {
    const localAi = getGeminiInstance();

    const existingTechniquesList = existingTechniques.map(t => `- ${t.name} (${t.type})`).join('\n');
    
    const systemInstruction = `You are an expert financial analyst assistant. Your task is to discover new trading strategies and indicators from the web using Google Search.
You will be given a list of existing techniques. You must find techniques that are NOT on this list.
Your response MUST be ONLY a valid JSON array of objects. Do not add any extra text, conversation, or markdown fences like \`\`\`json.
Each object in the array must conform to this schema: { name: string, type: 'Strategy'|'Indicator', description: string, parameters: string }.
All text must be in Persian. If no new techniques are found, return an empty array [].`;

    const prompt = `
# وظیفه: کشف تکنیک‌های معاملاتی جدید از وب

با استفاده از جستجوی گوگل، 5 استراتژی یا اندیکاتور معاملاتی جدید، محبوب یا نوآورانه را پیدا کن که در لیست زیر وجود **ندارند**.

## لیست تکنیک‌های موجود (از اینها صرف نظر کن):
${existingTechniquesList || 'هیچکدام'}

---
## دستورالعمل‌های خروجی:

1.  **فقط JSON:** خروجی شما باید **فقط و فقط** یک آرایه JSON معتبر باشد.
2.  **ساختار آبجکت:** هر آبجکت در آرایه باید شامل کلیدهای "name", "type", "description", و "parameters" باشد.
    - **name:** نام توصیفی و رایج تکنیک.
    - **type:** باید یکی از دو مقدار رشته‌ای 'Strategy' یا 'Indicator' باشد.
    - **description:** توضیحی کامل و واضح در مورد نحوه کارکرد، سیگنال‌ها و بهترین زمان استفاده.
    - **parameters:** پارامترهای اصلی به صورت یک رشته. مثال: "length: 14, source: close" یا اگر پارامتر خاصی ندارد "N/A".
3.  **زبان:** تمام مقادیر رشته‌ای باید به زبان **فارسی** باشند.
4.  **نتیجه خالی:** اگر هیچ تکنیک جدید و مناسبی پیدا نکردی، یک آرایه خالی \`[]\` برگردان.

**اکنون جستجو را آغاز کرده و فقط آرایه JSON را برگردان.**
`;

    try {
        const response = await localAi.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                tools: [{ googleSearch: {} }],
            },
        });

        let jsonText = response.text.trim();
        const startIndex = jsonText.indexOf('[');
        const endIndex = jsonText.lastIndexOf(']');

        if (startIndex !== -1 && endIndex > startIndex) {
            jsonText = jsonText.substring(startIndex, endIndex + 1);
        } else {
             console.warn('No valid JSON array found in web discovery response:', response.text);
             return [];
        }
        
        const techniques = JSON.parse(jsonText) as Omit<LearnedTechnique, 'id' | 'createdAt' | 'source' | 'sourceFileName'>[];
        return techniques.filter(t => t.name && t.type && t.description); // Basic validation
    } catch(err) {
        console.error("Failed to discover new techniques from web:", err);
        throw new Error("خطا در هنگام جستجو برای تکنیک‌های جدید در وب. ممکن است پاسخ AI نامعتبر باشد.");
    }
};
