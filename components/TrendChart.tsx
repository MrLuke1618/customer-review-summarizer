
import React from 'react';
import { Summary } from '../types';

interface TrendChartProps {
  data: {
    label: string;
    summary: Summary;
  }[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  const chartHeight = 250;
  const padding = { top: 20, right: 20, bottom: 50, left: 40 };

  const minSpacing = 120;
  const calculatedWidth = padding.left + padding.right + Math.max(0, data.length - 1) * minSpacing;
  const chartWidth = Math.max(500, calculatedWidth);

  const maxValue = Math.max(0, ...data.flatMap(d => [d.summary.sentiment.positive, d.summary.sentiment.negative, d.summary.sentiment.neutral]));

  // A more robust way to calculate a "nice" ceiling for the Y-axis
  const getNiceCeiling = (value: number): number => {
    if (value === 0) return 5; // Set a minimum axis size
    const power = Math.pow(10, Math.floor(Math.log10(value)));
    const relativeValue = value / power;
    let ceiling;
    if (relativeValue < 1.5) ceiling = 1.5;
    else if (relativeValue < 2) ceiling = 2;
    else if (relativeValue < 3) ceiling = 3;
    else if (relativeValue < 4) ceiling = 4;
    else if (relativeValue < 5) ceiling = 5;
    else if (relativeValue < 8) ceiling = 8;
    else ceiling = 10;
    return ceiling * power;
  };
  
  const yAxisMax = getNiceCeiling(maxValue);
  
  // Dynamically determine the number of ticks for a clean look
  const tickCount = yAxisMax <= 5 ? yAxisMax : 5;
  const tickIncrement = yAxisMax / tickCount;
  const yAxisLabels = Array.from({ length: tickCount + 1 }, (_, i) => i * tickIncrement);

  const getX = (index: number) => {
    const drawableWidth = chartWidth - padding.left - padding.right;
    if (data.length === 0) return 0;
    const sectionWidth = drawableWidth / data.length;
    return padding.left + (index * sectionWidth) + (sectionWidth / 2);
  };
  const getY = (value: number) => chartHeight - padding.bottom - (value / yAxisMax) * (chartHeight - padding.top - padding.bottom);

  const createPath = (sentimentKey: keyof Summary['sentiment']) => {
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.summary.sentiment[sentimentKey] ?? 0)}`).join(' ');
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">Sentiment Trend Analysis</h3>
        <div className="flex justify-center space-x-4 text-sm mb-4">
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></span>Positive</div>
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-rose-500 mr-2"></span>Negative</div>
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-slate-500 mr-2"></span>Neutral</div>
        </div>
        <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ minWidth: '400px', width: `${chartWidth}px` }}>
                {/* Y-axis grid lines and labels */}
                {yAxisLabels.map(label => (
                    <g key={label}>
                        <line
                            x1={padding.left} y1={getY(label)}
                            x2={chartWidth - padding.right} y2={getY(label)}
                            strokeWidth="0.5" strokeDasharray="3,3" 
                            className="stroke-slate-200 dark:stroke-slate-700" />
                        <text 
                            x={padding.left - 8} 
                            y={getY(label) + 3} 
                            textAnchor="end" 
                            className="text-xs fill-slate-500 dark:fill-white"
                        >
                            {Math.round(label * 10) / 10}
                        </text>
                    </g>
                ))}
                
                {/* X-axis labels */}
                {data.map((d, i) => (
                    <text
                        key={i} x={getX(i)} y={chartHeight - padding.bottom + 20}
                        textAnchor="middle" className="text-xs fill-slate-500 dark:fill-white"
                    >
                        {d.label}
                    </text>
                ))}

                {/* Data lines */}
                {data.length > 1 && (
                    <>
                        <path d={createPath('positive')} fill="none" stroke="#10b981" strokeWidth="2" />
                        <path d={createPath('negative')} fill="none" stroke="#f43f5e" strokeWidth="2" />
                        <path d={createPath('neutral')} fill="none" stroke="#64748b" strokeWidth="2" />
                    </>
                )}

                {/* Data points */}
                {data.map((d, i) => (
                    <g key={i}>
                        <circle cx={getX(i)} cy={getY(d.summary.sentiment.positive ?? 0)} r="3" fill="#10b981" />
                        <circle cx={getX(i)} cy={getY(d.summary.sentiment.negative ?? 0)} r="3" fill="#f43f5e" />
                        <circle cx={getX(i)} cy={getY(d.summary.sentiment.neutral ?? 0)} r="3" fill="#64748b" />
                    </g>
                ))}
            </svg>
        </div>
    </div>
  );
};
