
import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, ReferenceArea } from 'recharts';
import type { CandlestickDataPoint, Pattern, Timezone } from '../types';

interface CandlestickChartProps {
  candlestickData: CandlestickDataPoint[];
  predictionData: Array<{ date: string; price: number }>;
  patterns: Pattern[];
  buyTargets: number[];
  sellTargets: number[];
  stopLoss: number;
  timezone: Timezone;
  highlightedPattern: Pattern | null;
}

const CustomTooltip = ({ active, payload, label, timezone }: any) => {
  if (active && payload && payload.length) {
    const predictionPoint = payload.find(p => p.dataKey === 'price');
    const candlePayload = payload.find(p => p.dataKey === 'body');
    const date = new Date(label);

    const formattedDate = date.toLocaleString('fa-IR', {
        timeZone: timezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    if (predictionPoint) {
         return (
            <div className="p-3 bg-gray-800/80 backdrop-blur-md border border-gray-600 rounded-lg shadow-xl">
                <p className="label text-base text-gray-300">{formattedDate}</p>
                <p className="intro text-lg font-bold text-amber-300">{`پیش‌بینی: $${predictionPoint.value.toLocaleString()}`}</p>
            </div>
        );
    }

    if (!candlePayload || candlePayload.payload.open === undefined) return null;
    
    const data = candlePayload.payload;
    const color = data.close >= data.open ? 'text-green-400' : 'text-red-400';

    return (
      <div className="p-3 bg-gray-800/80 backdrop-blur-md border border-gray-600 rounded-lg shadow-xl text-sm">
        <p className="label text-base text-gray-300 font-bold mb-2">{formattedDate}</p>
        <p className={color}><strong>بسته شدن: ${data.close.toLocaleString()}</strong></p>
        <p className="text-gray-400">باز شدن: ${data.open.toLocaleString()}</p>
        <p className="text-gray-400">بالاترین: ${data.high.toLocaleString()}</p>
        <p className="text-gray-400">پایین‌ترین: ${data.low.toLocaleString()}</p>
        <p className="text-gray-400">حجم: {data.volume.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const CustomizedCandle = (props: any) => {
    const { x, y, width, height, low, high, open, close } = props;
    const isRising = close >= open;
    const color = isRising ? '#10b981' : '#f43f5e';
    const wickColor = isRising ? '#2dd4bf' : '#fb7185';
    
    // Sometimes height can be 0, so we ensure a min height for visibility.
    const bodyHeight = Math.max(Math.abs(height), 1);
    const bodyY = isRising ? y + height - bodyHeight : y;

    return (
        <g strokeWidth="1" className="candle">
            {/* Wick line */}
            <line x1={x + width / 2} y1={y} x2={x + width / 2} y2={y + (high - low)} stroke={wickColor} />
            {/* Body rectangle */}
            <rect x={x} y={bodyY} width={width} height={bodyHeight} fill={color} />
        </g>
    );
};

const CustomizedVolumeBar = (props: any) => {
    const { x, y, width, height, payload } = props;
    const isRising = payload.close >= payload.open;
    const color = isRising ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)';
    return <rect x={x} y={y} width={width} height={height} fill={color} />;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({ candlestickData, predictionData, patterns, buyTargets, sellTargets, stopLoss, timezone, highlightedPattern }) => {
  if (!candlestickData || candlestickData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] text-gray-500">
        داده‌ای برای نمایش نمودار وجود ندارد.
      </div>
    );
  }

  const chartData = candlestickData.map(d => ({
      ...d,
      body: [d.open, d.close].sort((a,b) => a - b),
      wick: [d.low, d.high]
  }));

  const combinedData = [
    ...chartData,
    ...predictionData.map(p => ({ date: p.date, price: p.price })),
  ];
  
  const allPriceValues = [
    ...candlestickData.flatMap(d => [d.high, d.low]),
    ...predictionData.map(d => d.price),
    ...buyTargets,
    ...sellTargets,
    stopLoss
  ].filter(v => v > 0);
  const dataMin = Math.min(...allPriceValues) * 0.98;
  const dataMax = Math.max(...allPriceValues) * 1.02;

  const allVolumeValues = candlestickData.map(d => d.volume);
  const volumeMax = Math.max(...allVolumeValues) * 3; // Give more space to price chart

  const tickFormatter = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('fa-IR', {
        timeZone: timezone,
        month: 'short',
        day: 'numeric'
    });
  }

  return (
    <div style={{ width: '100%', height: 500 }}>
      <ResponsiveContainer>
        <ComposedChart
          data={combinedData}
          margin={{
            top: 5,
            right: 5,
            left: 5,
            bottom: 20,
          }}
        >
          <defs>
            <linearGradient id="patternGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="rgba(14, 165, 233, 0.3)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="rgba(14, 165, 233, 0)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="highlightedPatternGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="rgba(14, 165, 233, 0.5)" stopOpacity={0.5}/>
                <stop offset="95%" stopColor="rgba(14, 165, 233, 0.1)" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" strokeOpacity={0.3} />
          <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={50} tickFormatter={tickFormatter}/>
          <YAxis yAxisId="price" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} type="number" domain={[dataMin, dataMax]} allowDataOverflow tickFormatter={(value) => `$${Number(value).toLocaleString()}`} />
          <YAxis yAxisId="volume" orientation="right" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} type="number" domain={[0, volumeMax]} tickFormatter={(value) => (value / 1000000).toFixed(1) + 'M'} />
          
          <Tooltip content={<CustomTooltip timezone={timezone} />} />
          <Legend verticalAlign="top" height={36} formatter={(value) => <span className="text-gray-300 text-sm">{value}</span>} />

          {buyTargets.map((target, index) => (
            <ReferenceLine yAxisId="price" key={`buy-${index}`} y={target} label={{ value: `خرید ${index+1}`, position: 'right', fill: '#10b981', fontSize: 10, dy: -5 }} stroke="#10b981" strokeDasharray="3 3" />
          ))}

          {sellTargets.map((target, index) => (
            <ReferenceLine yAxisId="price" key={`sell-${index}`} y={target} label={{ value: `فروش ${index+1}`, position: 'right', fill: '#f43f5e', fontSize: 10, dy: -5 }} stroke="#f43f5e" strokeDasharray="3 3" />
          ))}

          {stopLoss > 0 && (
            <ReferenceLine yAxisId="price" y={stopLoss} label={{ value: `حد ضرر`, position: 'right', fill: '#eab308', fontSize: 10, dy: -5 }} stroke="#eab308" strokeDasharray="4 4" />
          )}

          {patterns?.map((pattern, index) => {
            if (!pattern.startDate || !pattern.endDate) return null;
            
            const isHighlighted = highlightedPattern?.name === pattern.name && highlightedPattern?.startDate === pattern.startDate;

            return (
              <ReferenceArea
                key={index}
                yAxisId="price"
                x1={pattern.startDate}
                x2={pattern.endDate}
                stroke={isHighlighted ? "#0ea5e9" : "rgba(14, 165, 233, 0.7)"}
                strokeOpacity={isHighlighted ? 1 : 0.5}
                strokeWidth={isHighlighted ? 2 : 1}
                fill={isHighlighted ? "url(#highlightedPatternGradient)" : "url(#patternGradient)"}
                label={{ 
                    value: pattern.name, 
                    position: 'insideTop', 
                    fill: '#60a5fa', 
                    fontSize: 12, 
                    fontWeight: isHighlighted ? 'bold' : 'normal',
                    opacity: isHighlighted ? 1 : 0.7
                }}
              />
            )
          })}
          
          <Bar yAxisId="price" dataKey="wick" fill="#8884d8" stroke="none" barSize={1} name="Wick" hide/>
          <Bar yAxisId="price" dataKey="body" shape={<CustomizedCandle />} name="قیمت تاریخی" />
          
          <Bar yAxisId="volume" dataKey="volume" name="حجم معاملات" shape={<CustomizedVolumeBar />} />

          <Line
            yAxisId="price"
            type="monotone"
            dataKey="price"
            stroke="#f59e0b" // Amber color for prediction
            strokeWidth={2.5}
            strokeDasharray="5 5"
            name="پیش‌بینی قیمت"
            dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
            connectNulls
          />

        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
